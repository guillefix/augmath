import React from 'react';
import ReactDOM from 'react-dom';
import * as Actions from '../../../redux/actions/action-creators';

export default class MQInput extends React.Component {
  mqlatex() {
    return this.mathquill.latex().replace(/[^\x00-\x7F]/g, "")
      .replace(/\^([a-z0-9])/g, "^{$1}")
      .replace(/\_([a-z0-9])/g, "_{$1}")
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
  }
  componentDidMount() {
    let MQ = MathQuill.getInterface(2);
    this.mathquill = MQ.MathField($('#mathquill')[0]);
    this.mathquill.latex(this.props.mathStr)
  }
  shouldComponentUpdate(nextProps, nextState) {
    return this.mqlatex() !== nextProps.mathStr
  }
  componentDidUpdate(prevProps, prevState) {
    this.mathquill.latex(this.props.mathStr)
  }
  render() {
    return (
      <span id="mathquill"
        onKeyUp={(e) => {
          if (e.keyCode == 13) this.props.dispatch(Actions.addToHist(this.props.mathStr, ++this.props.index))
          else this.props.update(this.mqlatex()) }}>...</span>
    );
  }
}
