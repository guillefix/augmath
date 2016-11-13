import React from 'react';
import ReactDOM from 'react-dom';
import katex from 'katex';


export default class PlainEq extends React.Component {
  componentDidMount() {
    katex.render(this.props.maths, this.mathel);
  }
  componentDidUpdate(prevProps, prevState) {
    katex.render(this.props.maths, this.mathel);
  }
  render() {
    return <span ref={(span) => this.mathel = span}></span>
  }
}

PlainEq.propTypes = {
    maths: React.PropTypes.string.isRequired
  };
