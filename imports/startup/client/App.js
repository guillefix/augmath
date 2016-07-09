import React from 'react';
import ReactDOM from 'react-dom';
import Tools from './Tools.js';
import EquationsPanel from './EquationsPanel.js';

export default class App extends React.Component {
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
      			    <button id="tb-undo" className="btn btn-default">Undo</button>
      			    <button id="tb-redo" className="btn btn-default">Redo</button>
      			  </div>
      			<button type="button" className="btn btn-default " id="tb-flip_equation">
  					Flip equation
  				  </button>
  				<button type="button" className="btn btn-default " id="tb-change_side">
  					Change side
  				</button>

  				<div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-move_up">
  							<span className="glyphicon glyphicon-arrow-up"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_left">
  						<span className="glyphicon glyphicon-arrow-left"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_right">
  						<span className="glyphicon glyphicon-arrow-right"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_down">
  							<span className="glyphicon glyphicon-arrow-down"></span>
  					</button>
  				</div>

  				<div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-distribute-in">
  						Distribute in
  					</button>
  					<button type="button" className="btn btn-default" id="tb-collect-out">
  						Collect out
  					</button>
  				</div>

          <div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-split">
  						Split out
  					</button>
  					<button type="button" className="btn btn-default" id="tb-merge">
  						Merge in
  					</button>
  				</div>

  				<button type="button" className="btn btn-default" id="tb-eval">
  					Evaluate/Simplify
  				</button>
  				<button type="button" className="btn btn-default" id="tb-operate">
  					Operate
  				</button>
          <button type="button" className="btn btn-default" id="tb-cancel-out">
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
