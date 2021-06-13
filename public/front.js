// Connect the websocket
var socket = io();

// Render the pong table
ReactDOM.render(<Table socket={socket} />, document.getElementById('Table'));
