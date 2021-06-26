// Ping Pong Table
class Table extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;

    this.socket.on('move', this.handleMove);

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleMove = this.handleMove.bind(this);

    this.state = {
      width: 300,
      height: 150
    }
  }

  render() {
    return (
      <canvas
        ref='table'
        tabIndex='1'
        onKeyPress={this.handleKeyPress}
        width={this.state.width}
        height={this.state.height}
      >
      </canvas>
    );
  }

  componentDidMount() {
    this.updateCanvas();
  }

  componentDidUpdate() {
    this.updateCanvas();
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

  updateCanvas() {
    const ctx = this.refs.table.getContext('2d');
    this.drawBackground(ctx);
  }

  drawBackground(ctx) {
    var width = this.state.width;
    var height = this.state.height;

    ctx.fillStyle = 'rgb(0, 0, 200)';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = '10';
    ctx.strokeRect(0, 0, width, height);

    ctx.lineWidth = '5';
    ctx.beginPath();
    ctx.moveTo(0, height/2);
    ctx.lineTo(width, height/2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width/2, 0);
    ctx.lineTo(width/2, height);
    ctx.stroke();
  }
}
