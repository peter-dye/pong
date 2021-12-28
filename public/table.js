// Ping Pong Table
class Table extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handlePing = this.handlePing.bind(this);

    this.socket.on('ping', this.handlePing);

    var paddleIndent = 15;
    this.state = {
      leftLocationX: paddleIndent,
      rightLocationX: this.props.width-paddleIndent,
      leftLocationY: this.props.height/2,
      rightLocationY: this.props.height/2,
      ballLocation: [this.props.width/2, this.props.height/2],
    };

    this.moveRequest = 'none';
  }

  render() {
    return (
      <canvas
        ref='table'
        tabIndex='1'
        onKeyPress={this.handleKeyPress}
        width={this.props.width}
        height={this.props.height}
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
      this.moveRequest = 'up';
    } else if (e.key == 's') {
      this.moveRequest = 'down';
    }
  }

  handlePing(message) {
    var message = JSON.parse(message);

    // update the paddle locations with the information from the ping
    // update the ball location with the information from the ping
    this.setState((state) => {
      return {
        ...state,
        leftLocationY: message.leftLocationY,
        rightLocationY: message.rightLocationY,
        ballLocation: message.ballLocation
      };
    });

    // send a ping response with the move request
    var pingResponse = {
      side: this.props.side,
      moveRequest: this.moveRequest
    };
    socket.emit('pingResponse', JSON.stringify(pingResponse));
    this.moveRequest = 'none';
  }

  updateCanvas() {
    const ctx = this.refs.table.getContext('2d');
    this.drawBackground(ctx);
    this.drawPaddle(ctx, [this.state.leftLocationX, this.state.leftLocationY]);
    this.drawPaddle(ctx, [this.state.rightLocationX, this.state.rightLocationY]);
    this.drawBall(ctx, this.state.ballLocation);
  }

  drawBackground(ctx) {
    let width = this.props.width;
    let height = this.props.height;

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
    let paddleWidth = 6;
    let paddleHeight = 30;

    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(
      center[0]-paddleWidth/2,
      center[1]-paddleHeight/2,
      paddleWidth,
      paddleHeight
    );
  }

  drawBall(ctx, center) {
    let radius = 3;

    ctx.strokeStyle = 'rgb(0, 0, 0)';
    ctx.beginPath();
    ctx.arc(center[0], center[1], radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
}
