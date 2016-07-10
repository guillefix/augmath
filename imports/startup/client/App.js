import React from 'react';
import ReactDOM from 'react-dom';
import Tools from './tools.js';
import EquationsPanel from './equations-panel.js';
import * as manips from '../../maths/manipulations.js';
import * as hist from './history';
import {prepare, select_node, remove_events, create_events} from "../../maths/functions";

export default class App extends React.Component {
  constructor() {
    super();
    this.update = this.update.bind(this);
    this.updateSelect = this.updateSelect.bind(this);
    this.state = {
      mathStr:"\\frac{v^{2}}{r}=\\frac{GMm}{r^{2}}",
      manip: "term",
      depth: 1};
  }
  update(newStr, render) {
    this.setState({mathStr: newStr})
    if (render) prepare(newStr)
  }
  updateSelect(resetManip = false) {
    newManip = ReactDOM.findDOMNode(this.toolsPane.manipSelect).value;
    newDepth = parseInt(ReactDOM.findDOMNode(this.toolsPane.depthSelect).value);
    remove_events(this.state.manip, this.state.depth);
    if (resetManip) {
      switch(newManip) {
        case "factor":
          newDepth = 2
          break;
        case "term":
          newDepth = 1
          break;
        default:
          newDepth = 3
      }
    }
    create_events(newManip, newDepth);
    this.setState({manip: newManip, depth: newDepth});
  }
  render() {
    return (
      <div>
        <div className="col-md-3 toolbar">
          <Tools ref={(ref) => this.toolsPane = ref} updateSelect={this.updateSelect} manip={this.state.manip} depth={this.state.depth} />
        </div>
        <div className="col-md-6">
          <Toolbar />
          <MathInput mathStr={this.state.mathStr} update={this.update}/>
          <MathArea />
        </div>
        <div className="col-md-3">
          <EquationsPanel />
        </div>
      </div>
    );
  }
}

class Toolbar extends React.Component {
  render() {
    return (
      <div className="row">
  			<div className="bottom-buffer btn-toolbar" role="toolbar">
      			  <div className="btn-group">
      			    <button id="tb-undo" className="btn btn-default" onClick={hist.undo}>Undo</button>
      			    <button id="tb-redo" className="btn btn-default" onClick={hist.redo}>Redo</button>
      			  </div>
      			<button type="button" className="btn btn-default " id="tb-flip_equation" onClick={manips.flip_equation}>
  					Flip equation
  				  </button>
  				<button type="button" className="btn btn-default " id="tb-change_side" onClick={manips.change_side}>
  					Change side
  				</button>

  				<div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-move_up" onClick={manips.move_up}>
  							<span className="glyphicon glyphicon-arrow-up"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_left" onClick={manips.move_left}>
  						<span className="glyphicon glyphicon-arrow-left"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_right" onClick={manips.move_right}>
  						<span className="glyphicon glyphicon-arrow-right"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_down" onClick={manips.move_down}>
  							<span className="glyphicon glyphicon-arrow-down"></span>
  					</button>
  				</div>

  				<div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-distribute-in" onClick={manips.distribute_in}>
  						Distribute in
  					</button>
  					<button type="button" className="btn btn-default" id="tb-collect-out" onClick={manips.collect_out}>
  						Collect out
  					</button>
  				</div>

          <div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-split" onClick={manips.split}>
  						Split out
  					</button>
  					<button type="button" className="btn btn-default" id="tb-merge" onClick={manips.merge}>
  						Merge in
  					</button>
  				</div>
          <br />
          <br />
  				<button type="button" className="btn btn-default" id="tb-eval" onClick={manips.evaluate}>
  					Evaluate/Simplify
  				</button>
  				<button type="button" className="btn btn-default" id="tb-operate" onClick={manips.operate}>
  					Operate
  				</button>
          <button type="button" className="btn btn-default" id="tb-cancel-out" onClick={manips.cancel_out}>
  					Cancel out
  				</button>
  			</div>
  		</div>
    );
  }
}

class MathInput extends React.Component {
  latexStr() {
    return ReactDOM.findDOMNode(this.refs.latexInput).value
  }
  render() {
    return (
      <div className="row">
  			<p id="MathInput">Input some equation (<a id="show_latex" onClick={
            () => {math_str_el.toggle();
              math_str_el.is(":visible") ? $("#show_latex").text("Hide LaTeX") : $("#show_latex").text("Show LaTeX")}
            }>show LaTeX</a>): &nbsp;
          <MQInput mathStr={this.props.mathStr} update={this.props.update}/>
          &nbsp;
          <input size="50" ref="latexInput" value={this.props.mathStr}
            onChange={() => {this.props.update(this.latexStr())}}
            onKeyUp={(e) =>{if (e.keyCode == 13) this.props.update(this.props.mathStr, true)}}/>
          &nbsp;
          <button type="button" className="btn btn-default" id="keep">
  					Keep
  			  </button>
  			</p>
  		</div>
    )
  }
}

class MQInput extends React.Component {
  mqlatex() {
    return mathquill.latex().replace(/[^\x00-\x7F]/g, "")
      .replace(/\^([a-z0-9])/g, "^{$1}")
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
  }
  shouldComponentUpdate(nextProps, nextState) {
    return this.mqlatex() !== nextProps.mathStr
  }
  render() {
    if (mathquill) mathquill.latex(this.props.mathStr)
    return (
      <span id="mathquill"
        onKeyUp={(e) => {
          if (e.keyCode == 13) this.props.update(this.mqlatex(), true)
          else this.props.update(this.mqlatex(), false) }}>...</span>
    );
  }
  componentDidMount() {
    let MQ = MathQuill.getInterface(2);
    window.mathquill = MQ.MathField($('#mathquill')[0]);
    mathquill.latex(this.props.mathStr)
  }
}

class MathArea extends React.Component {
  render() {
    return (
      <div className="row">
        <div className="math-container">
  				<p id="math">...</p>
  			</div>
      </div>
    )
  }
}
