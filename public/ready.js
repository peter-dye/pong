class Ready extends React.Component {
  constructor(props) {
    super(props);
    this.socket = props.socket;

    this.state = {
      ready: false,
      disabled: true
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleReady = this.handleReady.bind(this);

    socket.on('ready', this.handleReady);
  }

  render() {
    return (
      <form>
        <label>
          Ready?
          <input
            disabled={this.state.disabled}
            type='checkbox'
            checked={this.state.ready}
            onChange={this.handleChange}
          />
        </label>
      </form>
    );
  }

  handleChange() {
    let ready = !this.state.ready;

    this.setState((state) => {
      return {
        ...state,
        ready: ready
      };
    });

    let response = {side: this.props.side, ready: ready};
    this.socket.emit('readyResponse', JSON.stringify(response));
  }

  handleReady() {
    this.setState((state) => {
      return {
        ...state,
        disabled: false
      };
    });
  }
}
