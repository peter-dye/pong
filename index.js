const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const randomstring = require('randomstring');

const paddleVelocity = 2;
const ballVelocityMagnitude = 3;
const ballRadius = 3;
const paddleIndent = 15;
const paddleWidth = 6;
const paddleHeight = 30;
const tableWidth = 300;
const tableHeight = 150;

app.use(express.static('public'));

// Setup the Connection Queue dictionary. Shared between all connections.
var connectionQueue = {};

io.on('connection', (socket) => {
  console.log('New player connected.');

  var gameCode;

  var creatorSocket;
  var joinerSocket;

  let gameData = {
    leftName: "",
    rightName: "",
    leftLocationY: tableHeight/2,
    rightLocationY: tableHeight/2,
    ballLocation: [tableWidth/2, tableHeight/2],
    ballVelocity: [-ballVelocityMagnitude, 0],
    leftScore: 0,
    rightScore: 0,
    pausingAfterGoal: false,
  };

  socket.on('create', (username) => {
    creatorSocket = socket;
    creatorSocket.on('pingResponse', (response) => {handlePingResponse(response)});

    gameCode = randomstring.generate(5).toUpperCase();

    gameData.leftName = username;

    // Define a function for the joiner to use to join.
    function join(jUsername, jSocket) {
      joinerSocket = jSocket;
      joinerSocket.on('pingResponse', (response) => {handlePingResponse(response)});
      gameData.rightName = jUsername;

      // Send username messages.
      creatorSocket.emit('opponentUsername', gameData.rightName);
      joinerSocket.emit('opponentUsername', gameData.leftName);

      startGameLoop();
    }

    // Add the function for the joiner to join to the connection queue.
    connectionQueue[gameCode] = join;

    creatorSocket.emit('created', gameCode);
  });


  socket.on('join', (message) => {
    message = JSON.parse(message);

    // Check that the game code exists.

    // Use the gameCode the get the join function.
    var join = connectionQueue[message.gameCode];
    join(message.username, socket);
  });

  function handlePingResponse(response) {
    response = JSON.parse(response);

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
  }


  function startGameLoop() {
    interval = setInterval(sendPingSignal, 1000/30); // 30 frames per second.
  }


  function unpause() {
    gameData.pausingAfterGoal = false;
  }


  function sendPingSignal () {
    updateGame();
    sendPing();
  }


  function sendPing() {
    let gameDataMessage = JSON.stringify(gameData);
    creatorSocket.emit('ping', gameDataMessage);
    joinerSocket.emit('ping', gameDataMessage);
  }


  function updateGame() {
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
  }
});

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
