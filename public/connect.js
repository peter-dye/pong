class Connect extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;
  }

  render() {
    return (
      <div>
        <CreateGame
          socket={this.socket}
          username={this.props.username}
          setSide={this.props.setSide}
        />
        <JoinGame
          socket={this.socket}
          username={this.props.username}
          setSide={this.props.setSide}
        />
      </div>
    );
  }
}


class CreateGame extends React.Component {
  constructor(props){
    super(props);
    this.socket = props.socket;

    this.state = {code: ''}

    this.handleClick = this.handleClick.bind(this);
  }

  render() {
    return(
      <div>
        <button onClick={this.handleClick}> Create </button>
        <p> Your game code is {this.state.code} </p>
      </div>
    );
  }

  handleClick() {
    this.socket.on('created', (code) => {
      this.setState({code: code});
    });
    this.socket.emit('create', this.props.username);
    this.props.setSide('left');
  }
}


class JoinGame extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;
    this.state = {value: ''};

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Game Code:
          <input
            type='text'
            value={this.state.value}
            onChange={this.handleChange}
          />
        </label>
        <input type='submit' value='Join' />
      </form>
    );
  }

  handleChange(event) {
    this.setState({value: event.target.value});
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
