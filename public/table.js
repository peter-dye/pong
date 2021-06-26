// Ping Pong Table
class Table extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;

    this.socket.on('move', this.handleMove);

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleMove = this.handleMove.bind(this);
  }

  render() {
    return (
      <canvas
        id='Table'
        tabIndex='1'
        onKeyPress={this.handleKeyPress}
      >
      </canvas>
    );
  }

  handleKeyPress(e) {
    if (e.key == 'w') {
      var moveMessage = {
        username: this.props.username,
        move: 'moveUp'
      }
    } else if (e.key == 's') {
      var moveMessage = {
        username: this.props.username,
        move: 'moveDown'
      }
    }
    this.socket.emit('move', JSON.stringify(moveMessage));
  }

  handleMove(message) {
    var message = JSON.parse(message);
    console.log(message);
  }
}
