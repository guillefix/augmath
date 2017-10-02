import React from 'react';
import ReactDOM from 'react-dom';
import * as Actions from '../../../redux/actions/action-creators';
import MQInput from './mqinput.js'

export default class MathInput extends React.Component {
  latexStr() {
    return ReactDOM.findDOMNode(this.refs.latexInput).value
  }
  toggleLatexInput() {
    this.math_str_el.toggle();
    this.math_str_el.is(":visible") ? $("#show_latex").text("Hide LaTeX") : $("#show_latex").text("Show LaTeX")
  }
  componentDidMount() {
    this.math_str_el = $("#MathInput input");
    this.math_str_el.hide();
  }
  render() {
    const dispatch = this.props.dispatch;
    let index = this.props.index;
    return (
      <div className="row">
  			<p id="MathInput">Input some equation (<a id="show_latex" onClick={this.toggleLatexInput.bind(this)}>show LaTeX</a>): &nbsp;
          <MQInput mathStr={this.props.mathStr} update={this.props.update} dispatch={dispatch} index={this.props.index}/>
          &nbsp;
          <input size="50" ref="latexInput" value={this.props.mathStr}
            onChange={() => {this.props.update(this.latexStr())}}
            onKeyUp={(e) =>{
              if (e.keyCode == 13) dispatch(Actions.addToHist(this.props.mathStr, ++index))
            }}/>
          &nbsp;
          <button type="button" className="btn btn-default" id="keep" onClick={dispatch.bind(null, Actions.addToEqs(this.props.mathStr))}>
  					Keep
  			  </button>
  			</p>
  		</div>
    )
  }
}
// MathInput.contextTypes = {
//   store: React.PropTypes.object
// };
