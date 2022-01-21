class Username extends React.Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
  }

  render() {
    return (
      <div className='Username'>
        <form>
          <label>
            Username:
            <input
              type='text'
              value={this.props.username}
              onChange={this.handleChange}
              className='UsernameInput'
            />
          </label>
        </form>
      </div>
    );
  }

  handleChange(event) {
    this.props.onChange(event.target.value);
  }
}
