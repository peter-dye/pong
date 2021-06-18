// Connect the websocket
var socket = io();

// Render the pong table
ReactDOM.render(<Game socket={socket} />, document.getElementById('Game'));
