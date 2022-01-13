const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const randomstring = require('randomstring');
const redis = require('redis');
const util = require('util');

const paddleVelocity = 2;
const ballVelocityMagnitude = 3;
const ballRadius = 3;
const paddleIndent = 15;
const paddleWidth = 6;
const paddleHeight = 30;
const tableWidth = 300;
const tableHeight = 150;

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New player connected.');

  var tx;
  var rx;
  var gameCode;
  var redisClient;

  socket.on('create', async (username) => {
    gameCode = randomstring.generate(5).toUpperCase();

    tx = redis.createClient();
    rx = redis.createClient();

    rx.subscribe(gameCode);
    rx.on('message', async (channel, channelMessage) => {
      channelMessage = JSON.parse(channelMessage);
      if (channelMessage.type === 'ping') {
        sendPing();
      }
      else if (channelMessage.type === 'joined') {
        // send the joiners username to the creator
        let rawGameData = await redisClient.get(gameCode);
        let gameData = JSON.parse(rawGameData);
        socket.emit('oponentUsername', gameData.rightName);

        startGameLoop();
      }
    });

    let gameData = {
      leftName: username,
      rightName: "",
      leftLocationY: tableHeight/2,
      rightLocationY: tableHeight/2,
      ballLocation: [tableWidth/2, tableHeight/2],
      ballVelocity: [-ballVelocityMagnitude, 0],
      leftScore: 0,
      rightScore: 0,
      pausingAfterGoal: false,
    };

    redisClient = createRedisClient();
    await redisClient.set(gameCode, JSON.stringify(gameData));

    socket.emit('created', gameCode);
  });


  socket.on('join', async (message) => {
    message = JSON.parse(message);
    gameCode = message.gameCode;

    // check that the game code exists

    // add the joiners username to the game data
    redisClient = createRedisClient();
    let rawGameData = await redisClient.get(gameCode);
    let gameData = JSON.parse(rawGameData);
    gameData = {
      ...gameData,
      rightName: message.username
    };
    await redisClient.set(gameCode, JSON.stringify(gameData));

    tx = redis.createClient();
    rx = redis.createClient();

    rx.subscribe(gameCode);
    rx.on('message', (channel, channelMessage) => {
      channelMessage = JSON.parse(channelMessage);
      if (channelMessage.type === 'ping') {
        sendPing();
      }
    });

    let joinedMessage = {type: 'joined', username: message.username};
    tx.publish(gameCode, JSON.stringify(joinedMessage));

    // send the creators username to the joiner
    socket.emit('oponentUsername', gameData.leftName);
  });


  socket.on('pingResponse', async (response) => {
    response = JSON.parse(response);
    let rawGameData = await redisClient.get(gameCode);
    let gameData = JSON.parse(rawGameData);

    if (response.side === 'left') {
      if (response.moveRequest === 'up') {
        gameData.leftLocationY = gameData.leftLocationY - paddleVelocity;
      } else if (response.moveRequest === 'down') {
        gameData.leftLocationY = gameData.leftLocationY + paddleVelocity;
      }
    } else if (response.side === 'right') {
      if (response.moveRequest === 'up') {
        gameData.rightLocationY = gameData.rightLocationY - paddleVelocity;
      } else if (response.moveRequest === 'down') {
        gameData.rightLocationY = gameData.rightLocationY + paddleVelocity;
      }
    }

    await redisClient.set(gameCode, JSON.stringify(gameData));
  });


  function startGameLoop() {
    interval = setInterval(sendPingSignal, 1000/30);
  }


  async function unpause() {
    let rawGameData = await redisClient.get(gameCode);
    let gameData = JSON.parse(rawGameData);

    gameData.pausingAfterGoal = false;

    await redisClient.set(gameCode, JSON.stringify(gameData));
  }


  function sendPingSignal () {
    updateGame();
    tx.publish(gameCode, JSON.stringify({type: 'ping'}));
  }


  async function sendPing() {
    socket.emit('ping', await redisClient.get(gameCode));
  }


  async function updateGame() {
    let rawGameData = await redisClient.get(gameCode);
    let gameData = JSON.parse(rawGameData);

    let ballLocation = gameData.ballLocation;
    let ballVelocity = gameData.ballVelocity;

    // If the ball is contacting the left paddle.
    if (contactingLeftPaddle(gameData.leftLocationY, ballLocation, ballVelocity)) {
      ballVelocity = getPaddleBounceVelocity(gameData.leftLocationY, ballLocation);
    }
    // Else if the ball is contacting the right paddle.
    else if (contactingRightPaddle(gameData.rightLocationY, ballLocation, ballVelocity)) {
      ballVelocity = getPaddleBounceVelocity(gameData.rightLocationY, ballLocation);
      ballVelocity[0] = -1 * ballVelocity[0];
    }
    // Else if the ball is contacting the top or bottom side.
    else if (contactingTop(ballLocation, ballVelocity)) {
      // Does not change the magnitude.
      ballVelocity[1] = -1 * ballVelocity[1];
    }
    else if (contactingBottom(ballLocation, ballVelocity)) {
      ballVelocity[1] = -1 * ballVelocity[1];
    }
    // Else if goal for left player.
    else if (leftGoal(ballLocation, ballVelocity)) {
      gameData.leftScore += 1;
      ballLocation = [tableWidth/2 - ballVelocityMagnitude, tableHeight/2];
      ballVelocity = [ballVelocityMagnitude, 0];

      gameData.pausingAfterGoal = true;
      setTimeout(unpause, 1000);
    }
    // Else if goal for right player.
    else if (rightGoal(ballLocation, ballVelocity)) {
      gameData.rightScore += 1;
      ballLocation = [tableWidth/2 + ballVelocityMagnitude, tableHeight/2];
      ballVelocity = [-ballVelocityMagnitude, 0];

      gameData.pausingAfterGoal = true;
      setTimeout(unpause, 1000);
    }

    if (!gameData.pausingAfterGoal) {
      ballLocation[0] = ballLocation[0] + ballVelocity[0];
      ballLocation[1] = ballLocation[1] + ballVelocity[1];
    }

    gameData.ballLocation = ballLocation;
    gameData.ballVelocity = ballVelocity;

    await redisClient.set(gameCode, JSON.stringify(gameData));
  }
});

function createRedisClient() {
  let client = redis.createClient();
  client.get = util.promisify(client.get);
  client.set = util.promisify(client.set);
  return client;
}

function contactingLeftPaddle(paddleLocation, ballLocation, ballVelocity) {
  return ballLocation[0] < (paddleIndent + paddleWidth/2 + ballRadius)
    && ballLocation[0] > paddleIndent
    && Math.abs(ballLocation[1] - paddleLocation) < (paddleHeight/2)
    && ballVelocity[0] < 0;
}

function contactingRightPaddle(paddleLocation, ballLocation, ballVelocity) {
  return ballLocation[0] > (tableWidth - (paddleIndent + paddleWidth/2 + ballRadius))
    && ballLocation[0] < (tableWidth - paddleIndent)
    && Math.abs(ballLocation[1] - paddleLocation) < (paddleHeight/2)
    && ballVelocity[0] > 0;
}

function contactingTop(ballLocation, ballVelocity) {
  return ballLocation[1] < ballRadius
    && ballVelocity[1] < 0;
}

function contactingBottom(ballLocation, ballVelocity) {
  return ballLocation[1] > (tableHeight - ballRadius)
    && ballVelocity[1] > 0;
}

function rightGoal(ballLocation, ballVelocity) {
  // Right goal if contacting left edge.
  return ballLocation[0] < ballRadius
    && ballVelocity[0] < 0;
}

function leftGoal(ballLocation, ballVelocity) {
  // Left goal if contacting right edge.
  return ballLocation[0] > (tableWidth - ballRadius)
    && ballVelocity[0] > 0;
}

function getPaddleBounceVelocity(paddleLocation, ballLocation) {
  let offset = paddleLocation - ballLocation[1];

  // Map the offset from a range of 0 to paddleHeight/2, to a range
  // of 0 to 80 degrees. Negative if needed.
  const maxAngle = 80;
  let angle = degToRad((offset/(paddleHeight/2)) * maxAngle);

  return [
    ballVelocityMagnitude * Math.cos(angle),
    -1 * ballVelocityMagnitude * Math.sin(angle)
  ];
}

function degToRad(deg) {
    return deg * (Math.PI / 180.0);
}

server.listen(3000, () => {
  console.log('Listening on *:3000');
});
