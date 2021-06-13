// Ping Pong Table
class Table extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;

    this.handleKeyPress = this.handleKeyPress.bind(this);
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
      this.socket.emit('moveUp');
      console.log('moveUp event emitted.');
    } else if (e.key == 's') {
      this.socket.emit('moveDown');
    }
  }
}
