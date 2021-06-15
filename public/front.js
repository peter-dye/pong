// Connect the websocket
var socket = io();

// Render the pong table
ReactDOM.render(<Screen socket={socket} />, document.getElementById('Screen'));
