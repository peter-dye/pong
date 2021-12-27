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
const ballVelocity = 3;

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
      var channelMessage = JSON.parse(channelMessage);
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

    var gameData = {
      leftName: username,
      rightName: "",
      leftLocationY: 0,
      rightLocationY: 0,
      ballLocation: [0, 0]
    };

    redisClient = createRedisClient();
    await redisClient.set(gameCode, JSON.stringify(gameData));

    socket.emit('created', gameCode);
  });


  socket.on('join', async (message) => {
    var message = JSON.parse(message);

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
      var channelMessage = JSON.parse(channelMessage);
      if (channelMessage.type === 'ping') {
        sendPing();
      }
    });

    var joinedMessage = {type: 'joined', username: message.username};
    tx.publish(gameCode, JSON.stringify(joinedMessage));

    // send the creators username to the joiner
    socket.emit('oponentUsername', gameData.leftName);
  });


  socket.on('pingResponse', async (response) => {
    var response = JSON.parse(response);
    let rawGameData = await redisClient.get(gameCode);
    var gameData = JSON.parse(rawGameData);

    if (response.side === 'left') {
      if (response.moveRequest === 'up') {
        gameData = {
          ...gameData,
          leftLocationY: gameData.leftLocationY - paddleVelocity
        };
      } else if (response.moveRequest === 'down') {
        gameData = {
          ...gameData,
          leftLocationY: gameData.leftLocationY + paddleVelocity
        };
      }
    } else if (response.side === 'right') {
      if (response.moveRequest === 'up') {
        gameData = {
          ...gameData,
          rightLocationY: gameData.rightLocationY - paddleVelocity
        };
      } else if (response.moveRequest === 'down') {
        gameData = {
          ...gameData,
          rightLocationY: gameData.rightLocationY + paddleVelocity
        };
      }
    }

    await redisClient.set(gameCode, JSON.stringify(gameData));
  });


  function startGameLoop() {
    setInterval(sendPingSignal, 1000/30);
  }


  function sendPingSignal () {
    tx.publish(gameCode, JSON.stringify({type: 'ping'}));
  }


  async function sendPing() {
    // message needs to include both paddle locations and ball location
    // ball location is computed here including bouncing off paddles and sides
    computeBallLocation();

    socket.emit('ping', await redisClient.get(gameCode));
  }


  async function computeBallLocation() {
    let rawGameData = await redisClient.get(gameCode);
    var gameData = JSON.parse(rawGameData);

    gameData.ballLocation[1] = gameData.ballLocation[1] + ballVelocity;

    await redisClient.set(gameCode, JSON.stringify(gameData));
  }
});

function createRedisClient() {
  var client = redis.createClient();
  client.get = util.promisify(client.get);
  client.set = util.promisify(client.set);
  return client;
}


server.listen(3000, () => {
  console.log('Listening on *:3000');
});
