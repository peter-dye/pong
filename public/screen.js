class Screen extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;
  }

  render() {
    return (
      <div>
        <Username />
        <Table socket={this.socket} />
      </div>
    );
  }
}
