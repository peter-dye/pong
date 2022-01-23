class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      side: '',
      disableCreateAndJoin: true,
      gameCreated: false,
      gameJoined: false
    };

    this.socket = props.socket;

    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.setSide = this.setSide.bind(this);
    this.handleGameCreatedChange = this.handleGameCreatedChange.bind(this);
    this.handleGameJoinedChange = this.handleGameJoinedChange.bind(this);
  }

  render() {
    return (
      <div className='Game'>
        <Username
          username={this.state.username}
          onChange={this.onUsernameChange}
          disable={this.state.gameCreated || this.state.gameJoined}
        />
        <Connect
          socket={this.socket}
          username={this.state.username}
          setSide={this.setSide}
          disable={this.state.disableCreateAndJoin}
          gameCreated={this.state.gameCreated}
          handleGameCreatedChange={this.handleGameCreatedChange}
          handleGameJoinedChange={this.handleGameJoinedChange}
        />
        <Table
          socket={this.socket}
          username={this.state.username}
          width={600}
          height={300}
          side={this.state.side}
        />
        <Ready
          socket={this.socket}
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

  handleGameCreatedChange(created) {
    this.setState((state) => {
      return {
        ...state,
        gameCreated: created
      };
    });
  }

  handleGameJoinedChange(joined) {
    this.setState((state) =>{
      return {
        ...state,
        gameJoined: joined,
        disableCreateAndJoin: joined
      };
    });
  }
}
