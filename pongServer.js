if (process.argv.length == 3 && process.argv[2] == '--debug') {
  var PORT = 3000;
} else if (process.argv.length == 3 && process.argv[2] == '--release') {
  var PORT = 80;
} else {
  console.log("No valid build argument given. Use command 'node pongServer.js --debug' or 'node pongServer.js --release'")
  return;
}

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const randomstring = require('randomstring');

const paddleVelocity = 5;
const ballVelocityMagnitude = 7;
const ballRadius = 3;
const paddleIndent = 15;
const paddleWidth = 6;
const paddleHeight = 50;
const tableWidth = 600;
const tableHeight = 300;
const maxScore = 11;

app.use(express.static('public'));

// Setup the Connection Queue dictionary. Shared between all connections.
var connectionQueue = {};

io.on('connection', (socket) => {
  var gameCode;

  var creatorSocket;
  var joinerSocket;

  var leftReady = false;
  var rightReady = false;

  var leftPingBacklog = 0;
  var rightPingBacklog = 0;

  var gameLoopInterval;
  var lastSideToScore = 'none';

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
    creatorSocket.on('pingResponse', (response) => {handleLeftPingResponse(response)});
    creatorSocket.on('readyResponse', (response) => {handleLeftReadyResponse(response)});

    gameCode = randomstring.generate(5).toUpperCase();

    gameData.leftName = username;

    // Define a function for the joiner to use to join.
    function join(jUsername, jSocket) {
      joinerSocket = jSocket;
      joinerSocket.emit('joinSuccess', true);
      joinerSocket.on('pingResponse', (response) => {handleRightPingResponse(response)});
      joinerSocket.on('readyResponse', (response) => {handleRightReadyResponse(response)});

      gameData.rightName = jUsername;

      // Send username messages.
      creatorSocket.emit('opponentUsername', gameData.rightName);
      joinerSocket.emit('opponentUsername', gameData.leftName);

      creatorSocket.emit('ready');
      joinerSocket.emit('ready');
    }

    // Add the function for the joiner to join to the connection queue.
    connectionQueue[gameCode] = join;

    creatorSocket.emit('created', gameCode);
  });


  socket.on('join', (message) => {
    message = JSON.parse(message);

    // Check that the game code exists.
    if (!(message.gameCode in connectionQueue)) {
      socket.emit('joinSuccess', false);
      return;
    }

    // Use the gameCode to get the join function.
    var join = connectionQueue[message.gameCode];
    delete connectionQueue[message.gameCode];
    join(message.username, socket);
  });

  function handleLeftReadyResponse(ready) {
    leftReady = ready;
    handleReadyResponseShared();
  }

  function handleRightReadyResponse(ready) {
    rightReady = ready;
    handleReadyResponseShared();
  }

  function handleReadyResponseShared() {
    if (leftReady && rightReady) {
      // Reset the gameData in case this is not the first game.
      gameData = {
        ...gameData,
        leftLocationY: tableHeight/2,
        rightLocationY: tableHeight/2,
        ballLocation: [tableWidth/2, tableHeight/2],
        ballVelocity: [-ballVelocityMagnitude, 0],
        leftScore: 0,
        rightScore: 0,
        pausingAfterGoal: false,
      };

      // Send ping to reset the table.
      sendPing();

      startCountdown();
    }
  }

  function handleLeftPingResponse(moveRequest) {
    if (moveRequest === 'up') {
      gameData.leftLocationY = Math.max(
        gameData.leftLocationY - paddleVelocity,
        0);
    } else if (moveRequest === 'down') {
      gameData.leftLocationY = Math.min(
        gameData.leftLocationY + paddleVelocity,
        tableHeight);
    }

    leftPingBacklog -= 1;
  }

  function handleRightPingResponse(moveRequest) {
    if (moveRequest == 'up') {
      gameData.rightLocationY = Math.max(
        gameData.rightLocationY - paddleVelocity,
        0);
    } else if (moveRequest == 'down') {
      gameData.rightLocationY = Math.min(
        gameData.rightLocationY + paddleVelocity,
        tableHeight);
    }

    rightPingBacklog -= 1;
  }

  async function startCountdown() {
    for (count = 3; count > 0; count--) {
      if (!leftReady || !rightReady) { continue; }

      creatorSocket.emit('countdown', count);
      joinerSocket.emit('countdown', count);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    creatorSocket.emit('countdown', 0);
    joinerSocket.emit('countdown', 0);

    if (!leftReady || !rightReady) { return; }
    startGameLoop();
  }

  function startGameLoop() {
    gameLoopInterval = setInterval(sendPingSignal, 1000/30); // 30 frames per second.
  }

  function stopGameLoop() {
    clearInterval(gameLoopInterval);

    leftReady = false;
    rightReady = false;
    creatorSocket.emit('again');
    joinerSocket.emit('again');
  }


  function unpause() {
    // Reset the ball before unpausing the game updates.
    if (lastSideToScore === 'left') {
      gameData.ballLocation = [tableWidth/2 - ballVelocityMagnitude, tableHeight/2];
      gameData.ballVelocity = [ballVelocityMagnitude, 0];
      lastSideToScore = 'none';
    } else if (lastSideToScore === 'right') {
      gameData.ballLocation = [tableWidth/2 + ballVelocityMagnitude, tableHeight/2];
      gameData.ballVelocity = [-ballVelocityMagnitude, 0];
      lastSideToScore = 'none';
    }

    gameData.pausingAfterGoal = false;
  }


  function sendPingSignal () {
    updateGame();

    if (gameData.rightScore == maxScore || gameData.leftScore == maxScore) {
      stopGameLoop();
    }

    if (leftPingBacklog > 10 || rightPingBacklog > 10) {
      stopGameLoop();
    } else {
      sendPing();
    }
  }


  function sendPing() {
    let gameDataMessage = JSON.stringify(gameData);
    creatorSocket.emit('ping', gameDataMessage);
    joinerSocket.emit('ping', gameDataMessage);

    leftPingBacklog += 1;
    rightPingBacklog += 1;
  }


  function updateGame() {
    if (gameData.pausingAfterGoal) { return; }

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
      lastSideToScore = 'left';
      gameData.pausingAfterGoal = true;
      setTimeout(unpause, 1000);
    }
    // Else if goal for right player.
    else if (rightGoal(ballLocation, ballVelocity)) {
      gameData.rightScore += 1;
      lastSideToScore = 'right';
      gameData.pausingAfterGoal = true;
      setTimeout(unpause, 1000);
    }

    if (gameData.pausingAfterGoal) { return; }

    ballLocation[0] = ballLocation[0] + ballVelocity[0];
    ballLocation[1] = ballLocation[1] + ballVelocity[1];

    gameData.ballLocation = ballLocation;
    gameData.ballVelocity = ballVelocity;
  }
});

function contactingLeftPaddle(paddleLocation, ballLocation, ballVelocity) {
  // Required so the ball does not clip through the paddle.
  let clippingDifference = ballVelocityMagnitude - (paddleWidth/2 + ballRadius);

  let paddleContactRange = paddleIndent + paddleWidth/2 + ballRadius + clippingDifference;

  return ballLocation[0] < (paddleContactRange)
    && ballLocation[0] >= paddleIndent
    && Math.abs(ballLocation[1] - paddleLocation) < (paddleHeight/2)
    && ballVelocity[0] < 0;
}

function contactingRightPaddle(paddleLocation, ballLocation, ballVelocity) {
  // Required so the ball does not clip through the paddle.
  let clippingDifference = ballVelocityMagnitude - (paddleWidth/2 + ballRadius);

  let paddleContactRange = paddleIndent + paddleWidth/2 + ballRadius + clippingDifference;

  return ballLocation[0] > (tableWidth - (paddleContactRange))
    && ballLocation[0] <= (tableWidth - paddleIndent)
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

server.listen(PORT, () => {
  console.log(`Listening on *:${PORT}`);
});
