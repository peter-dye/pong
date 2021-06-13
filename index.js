const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('New player connected.');

  socket.on('moveUp', () => {
    console.log('moveUp event detected.');
    socket.emit('ack', 'moveUp acknowledged');
  });

  socket.on('moveDown', () => {
    console.log('moveDown event detected.');
  });
});

server.listen(3000, () => {
  console.log('Listening on *:3000');
});
