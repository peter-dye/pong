// Ping Pong Table
class Table extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;

    this.socket.on('move', this.handleMove);

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleMove = this.handleMove.bind(this);

    this.state = {
      createCenter: [15, this.props.height/2],
      joinCenter: [this.props.width-15, this.props.height/2]
    };
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
    this.drawPaddle(ctx, this.state.createCenter);
    this.drawPaddle(ctx, this.state.joinCenter);
  }

  drawBackground(ctx) {
    var width = this.props.width;
    var height = this.props.height;

    ctx.fillStyle = 'rgb(102, 153, 255)';
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

  drawPaddle(ctx, center) {
    var paddleWidth = 7;
    var paddleHeight = 30;

    ctx.fillStyle = 'rgb(255, 0, 0)';
    ctx.fillRect(
      center[0]-paddleWidth/2,
      center[1]-paddleHeight/2,
      paddleWidth,
      paddleHeight
    );
  }
}
