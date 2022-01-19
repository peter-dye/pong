class Connect extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;

    this.state = {
      gameCreated: false
    };

    this.handleGameCreatedChange = this.handleGameCreatedChange.bind(this);
  }

  render() {
    if (this.state.gameCreated) {
      return (
        <div className='clearfix'>
          <CreateGame
            socket={this.socket}
            username={this.props.username}
            setSide={this.props.setSide}
            disable={this.props.disable}
            gameCreated={this.state.gameCreated}
            handleGameCreatedChange={this.handleGameCreatedChange}
          />
        </div>
      );
    } else {
      return (
        <div className='clearfix'>
          <CreateGame
            socket={this.socket}
            username={this.props.username}
            setSide={this.props.setSide}
            disable={this.props.disable}
            gameCreated={this.state.gameCreated}
            handleGameCreatedChange={this.handleGameCreatedChange}
          />
          <p className='ConnectOr'> or </p>
          <JoinGame
            socket={this.socket}
            username={this.props.username}
            setSide={this.props.setSide}
            disable={this.props.disable}
          />
        </div>
      );
    }
  }

  handleGameCreatedChange(created) {
    this.setState((state) => {
      return {
        ...state,
        gameCreated: created
      };
    });
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
  }

  render() {
    return (
      <div className="JoinGame">
        <form onSubmit={this.handleSubmit}>
          <input
            type='submit'
            value='Join a game'
            disabled={this.props.disable || this.state.emptyGameCode}
          />
          <label>
            with game code:
            <input
              type='text'
              value={this.state.value}
              onChange={this.handleChange}
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
    this.props.setSide('right');
    event.preventDefault();
  }
}
