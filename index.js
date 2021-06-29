const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const randomstring = require('randomstring');
const redis = require('redis');

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('New player connected.');

  var gameCode;
  var tx;
  var rx;

  socket.on('create', (username) => {
    gameCode = randomstring.generate(5).toUpperCase();

    tx = redis.createClient();
    rx = redis.createClient();

    rx.subscribe(gameCode);
    rx.on('message', (channel, message) => {
      var message = JSON.parse(message);
      if (message.type === 'username') {
        // do something with the username here
      } else if (message.type === 'move') {
        var moveMessage = {username: message.username, move: message.move};
        socket.emit(message.type, JSON.stringify(moveMessage));
      }
    });

    var usernameMessage = {type: 'username', username: username};

    tx.publish(gameCode, JSON.stringify(usernameMessage));

    socket.emit('created', gameCode);
  });

  socket.on('join', (message) => {
    var message = JSON.parse(message);

    gameCode = message.gameCode;

    tx = redis.createClient();
    rx = redis.createClient();

    rx.subscribe(gameCode);
    rx.on('message', (channel, message) => {
      var message = JSON.parse(message);
      if (message.type === 'username') {
        // do something with the username here
      } else if (message.type === 'move') {
        var moveMessage = {username: message.username, move: message.move};
        socket.emit(message.type, JSON.stringify(moveMessage));
      }
    });

    var usernameMessage = {type: 'username', username: message.username};
    tx.publish(gameCode, JSON.stringify(usernameMessage));
  });

  socket.on('move', (message) => {
    var message = JSON.parse(message);
    var moveMessage = {
      type: 'move',
      username: message.username,
      move: message.move
    };
    tx.publish(gameCode, JSON.stringify(moveMessage));
  });
});

server.listen(3000, () => {
  console.log('Listening on *:3000');
});
