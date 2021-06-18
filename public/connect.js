class Connect extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;
  }

  render() {
    return (
      <div>
        <CreateGame socket={this.socket} />
        <JoinGame socket={this.socket} />
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
    this.socket.emit('create');
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
    consolge.log('Join a game with code ' + this.state.value);
    event.preventDefault();
  }
}
