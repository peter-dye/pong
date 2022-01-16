class Username extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  render() {
    return (
      <form>
        <label>
          Username:
          <input
            type='text'
            value={this.props.username}
            onChange={this.handleChange}
          />
        </label>
      </form>
    );
  }

  handleChange(event) {
    this.props.onChange(event.target.value);
  }
}
