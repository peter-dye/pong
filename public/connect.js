class Connect extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;
  }

  render() {
    if (this.props.gameCreated) {
      return (
        <div className='Connect'>
          <div className='clearfix'>
            <CreateGame
              socket={this.socket}
              username={this.props.username}
              setSide={this.props.setSide}
              disable={this.props.disable}
              gameCreated={this.props.gameCreated}
              handleGameCreatedChange={this.props.handleGameCreatedChange}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className='Connect'>
          <div className='clearfix'>
            <CreateGame
              socket={this.socket}
              username={this.props.username}
              setSide={this.props.setSide}
              disable={this.props.disable}
              gameCreated={this.props.gameCreated}
              handleGameCreatedChange={this.props.handleGameCreatedChange}
            />
            <p className='ConnectOr'> or </p>
            <JoinGame
              socket={this.socket}
              username={this.props.username}
              setSide={this.props.setSide}
              disable={this.props.disable}
              handleGameJoinedChange={this.props.handleGameJoinedChange}
            />
          </div>
        </div>
      );
    }
  }
}


class CreateGame extends React.Component {
  constructor(props){
    super(props);
    this.socket = props.socket;

    this.state = {
      code: ''
    }

    this.handleClick = this.handleClick.bind(this);
  }

  render() {
    if (this.props.gameCreated) {
      return(
        <div className="CreateGame">
          <p> Your game code is {this.state.code} </p>
        </div>
      );
    } else {
      return(
        <div className="CreateGame">
          <button onClick={this.handleClick} disabled={this.props.disable}>
            Create a game
          </button>
        </div>
      );
    }
  }

  handleClick() {
    this.socket.on('created', (code) => {
      this.setState({code: code});
      this.props.handleGameCreatedChange(true);
    });
    this.socket.emit('create', this.props.username);
    this.props.setSide('left');
  }
}


class JoinGame extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;
    this.state = {
      value: '',
      emptyGameCode: true
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleJoinSuccess = this.handleJoinSuccess.bind(this);

    socket.on('joinSuccess', (success) => this.handleJoinSuccess(success));
  }

  render() {
    return (
      <div className="JoinGame">
        <form onSubmit={this.handleSubmit}>
          <input
            type='submit'
            value='Join a game'
            disabled={this.props.disable || this.state.emptyGameCode}
            className='JoinGameButtonInput'
          />
          <label>
            with game code:
            <input
              type='text'
              value={this.state.value}
              onChange={this.handleChange}
              disabled={this.props.disable}
              className='JoinGameCodeInput'
            />
          </label>
        </form>
      </div>
    );
  }

  handleChange(event) {
    this.setState({
      value: event.target.value,
      emptyGameCode: this.value === ''
    });
  }

  handleSubmit(event) {
    var joinMessage = {
      gameCode: this.state.value,
      username: this.props.username
    };
    socket.emit('join', JSON.stringify(joinMessage));
    event.preventDefault();
  }

  handleJoinSuccess(success) {
    if (success) {
      this.props.setSide('right');
      this.props.handleGameJoinedChange(true);
    }
  }
}
