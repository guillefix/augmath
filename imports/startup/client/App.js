import React from 'react';
import ReactDOM from 'react-dom';
import Tools from './tools.js';
import EquationsPanel from './equations-panel.js';
import * as manips from '../../maths/manipulations.js';
import * as hist from './history';

export default class App extends React.Component {
  constructor() {
    super();
    // this.update = this.update.bind(this);
    this.state = {}
  }
  render() {
    return (
      <div>
        <div className="col-md-3 toolbar">
          <Tools />
        </div>
        <div className="col-md-6">
          <Toolbar />
          <MathInput />
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
  render() {
    return (
      <div className="row">
  			<p id="MathInput">Input some equation (<a id="show_latex">show LaTeX</a>): <span id="mathquill" >...</span>
  			<input size="50"/>
  			<button type="button" className="btn btn-default" id="keep">
  					Keep
  			</button>
  			</p>
  		</div>
    )
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
