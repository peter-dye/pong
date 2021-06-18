class Game extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;
  }

  render() {
    return (
      <div>
        <Username />
        <Connect socket={this.socket} />
        <Table socket={this.socket} />
      </div>
    );
  }
}
