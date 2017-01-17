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
    const { store } = this.context;
    const { dispatch } = store;
    const state = store.getState();
    return (
      <span id="mathquill"
        onKeyUp={(e) => {
          const state = store.getState();
          let index = state.current_index;
          if (e.keyCode == 13) dispatch(Actions.addToHist(this.props.mathStr, ++index))
          else this.props.update(this.mqlatex()) }}>...</span>
    );
  }
}
MQInput.contextTypes = {
  store: React.PropTypes.object
};
