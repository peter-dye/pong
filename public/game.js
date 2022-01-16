class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      side: '',
      disableCreateAndJoin: true
    };

    this.socket = props.socket;

    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.setSide = this.setSide.bind(this);
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
          setSide={this.setSide}
          disable={this.state.disableCreateAndJoin}
        />
        <Table
          socket={this.socket}
          username={this.state.username}
          width={300}
          height={150}
          side={this.state.side}
        />
      </div>
    );
  }

  onUsernameChange(username) {
    this.setState((state) => {
      return {
        ...state,
        username: username,
        disableCreateAndJoin: username === ''
      }
    });
  }

  setSide(side) {
    this.setState((state) => {
      return {...state, side: side}
    });
  }
}
