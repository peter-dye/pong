class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {username: ''};

    this.socket = props.socket;

    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.onUsernameSubmit = this.onUsernameSubmit.bind(this);
  }

  render() {
    return (
      <div>
        <Username
          username={this.state.username}
          onChange={this.onUsernameChange}
          onSubmit={this.onUsernameSubmit}
        />
        <Connect
          socket={this.socket}
          username={this.state.username}
        />
        <Table
          socket={this.socket}
          username={this.state.username}
          width={300}
          height={150}
        />
      </div>
    );
  }

  onUsernameChange(username) {
    this.setState({username: username});
  }

  onUsernameSubmit() {
    alert('Your username is ' + this.state.username);
  }
}
