// Ping Pong Table
class Table extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;

    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleMove = this.handleMove.bind(this);

    this.socket.on('move', this.handleMove);

    this.state = {
      leftCenter: [15, this.props.height/2],
      rightCenter: [this.props.width-15, this.props.height/2]
    };
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
    if (message.move === 'moveUp') {
      var delta = -5;
    } else {
      var delta = 5;
    }
    if (this.props.username === message.username) {
      if (this.props.side === 'left') {
        this.updateLeft(delta);
      } else {
        this.updateRight(delta);
      }
    } else {
      if (this.props.side === 'left') {
        this.updateRight(delta);
      } else {
        this.updateLeft(delta);
      }
    }
  }

  updateLeft(delta) {
    this.setState((state) => {
      return {
        ...state,
        leftCenter: [
          state.leftCenter[0],
          state.leftCenter[1]+delta
        ]
      }
    });
  }

  updateRight(delta) {
    this.setState((state) => {
      return {
        ...state,
        rightCenter: [
          state.rightCenter[0],
          state.rightCenter[1]+delta
        ]
      }
    });
  }

  updateCanvas() {
    const ctx = this.refs.table.getContext('2d');
    this.drawBackground(ctx);
    this.drawPaddle(ctx, this.state.leftCenter);
    this.drawPaddle(ctx, this.state.rightCenter);
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

    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(
      center[0]-paddleWidth/2,
      center[1]-paddleHeight/2,
      paddleWidth,
      paddleHeight
    );
  }
}
