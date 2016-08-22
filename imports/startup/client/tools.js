import React from 'react';
import ReactDOM from 'react-dom';
// import * as manip from '../../maths/manipulations.js';
import * as hist from './history';
import * as act from './actions/action-creators';

export default class Tools extends React.Component {
  componentDidMount() {
  $("#depth").numbers({
    min: 0,
    step: 1,
    integer: true,
    growth: 10,
  });
  }
  render() {
    const { store } = this.context;
    const { dispatch } = store;
    return <div>
      <ul id="tools" className="list-group text-center">
  			<h4>Selection</h4>
  			<div>
  				<li className="list-group-item">
  					<span>Manipulative:
  					<select className="traverse" id="mtype" value={this.props.mtype} onChange={(e) => {dispatch(act.updateSelect({mtype: e.target.value}, true))}}>
  						<option value="term">Term</option>
  						<option value="factor">Factor</option>
  						<option value="power">Power</option>
  						<option value="base">Base</option>
  						<option value="numerator">Numerator</option>
  						<option value="denominator">Denominator</option>
  						<option value="available">Available (binom)</option>
  						<option value="chosen">Chosen (binom)</option>
  						<option value="sups">Superscript</option>
  						<option value="subs">Subscript</option>
  					</select>
  				</span>
  				</li>
  				<li className="list-group-item">
  					<span>Select multiple <input type="checkbox" name="multi_select" id="multi_select" onChange={()=>{
                let state = store.getState();
                dispatch(act.updateSelect({multi_select: !state.multi_select}))}}/></span>
  					<br/>
  					<span>Select variable <input type="checkbox" name="var_select" id="var_select" onChange={()=>{
                let state = store.getState();
                dispatch(act.updateSelect({var_select: !state.var_select}))}}/></span>
  				</li>
  				<li className="list-group-item" ref="depth_parent">
  					<span> Depth: &nbsp;
              <span className="adjustable_number TKAdjustableNumber" id="depth" onMouseDown={ (e) => {
                  let el = e.target;
                  let props = this.props;
                  $(document).mouseup(()=>{
                    dispatch(act.updateSelect({depth: parseInt(el.innerHTML)}, false))
                    $(document).off("mouseup");
                  });
                }}>{this.props.depth}</span>
  					</span>
  				</li>
  			</div>
  			<h4>More manipulations</h4>
  			<div>
  				<li className="list-group-item">
  					<label>Append to both sides: <input id="add_both_sides" size="20" placeholder="Type LaTeX here" onKeyUp={ (e) => {
                if (e.keyCode == 13) {
                    const state = store.getState();
                    dispatch(act.manipulate("add_both_sides", e.target.value))
                }
            }}/></label>
  				</li>
  				<li className="list-group-item">
  					<label>Replace selection with: <input id="replace" size="20" ref={(ref) => this.replaceSelectInput = ref} placeholder="Type LaTeX here" onKeyUp={(e)=> {if (e.keyCode == 13) dispatch(act.manipulate("replace", e.target.value))}} /></label>
  					<span>Replace individually <input type="checkbox" name="replace_ind" id="replace_ind" onChange={()=>{
                let state = store.getState();
                dispatch(act.updateSelect({replace_ind: !state.replace_ind}))}}/></span>
  				</li>
  				<button type="button" className="list-group-item" id="remove" onClick={dispatch.bind(null, act.manipulate("remove"))}>
  					Remove
  				</button>
  				<button type="button" className="list-group-item" id="unbracket" onClick={dispatch.bind(null, act.manipulate("unbracket"))}>
  					Unbracket
  				</button>
  			</div>
  			<h4>Recording (not working)</h4>
  			<div>
  				<li className="list-group-item">
  					<span>Recording <input type="checkbox" name="recording" id="recording"/></span>
  				</li>
  				<button type="button" className="list-group-item" id="make_json">
  					Save JSON
  				</button>
  				<button type="button" className="list-group-item" id="play">
  					Play
  				</button>
  				<button type="button" className="list-group-item" id="prev_step">
  					Previous Step
  				</button>
  				<button type="button" className="list-group-item" id="next_step">
  					Next Step
  				</button>
  			</div>
        <h4>Settings</h4>
  			<div>
  				<button type="button" className="list-group-item" id="make_json">
  					<label htmlFor="zoom-slider">Zoom</label> <input name="zoom-slider" id="zoom-slider" type="range" min="1" max="100" step="3" defaultValue="14" onChange={(e)=>dispatch(act.updateZoom(e.target.value))}/>
  				</button>
  			</div>
  		</ul>
    </div>
  }
}

Tools.contextTypes = {
  store: React.PropTypes.object
};


//Old
/*
<li className="list-group-item">
  <button type="button" className="btn btn-default" id="undo" onClick={()=>{
      const state = store.getState();
      dispatch(Actions.updateIndex(state.current_index-1))
    }}>
    Undo
  </button>
  <button type="button" className="btn btn-default" id="redo" onClick={()=>{
      const state = store.getState();
      dispatch(Actions.updateIndex(state.current_index+1))
    }}>
    Redo
  </button>
</li>
<li className="list-group-item">
  <button type="button" className="btn btn-default" id="flip_equation" onClick={dispatch.bind(null, act.manipulate("flip_equation"))}>
    Flip equation
  </button>
  <button type="button" className="btn btn-default" id="change_side" onClick={dispatch.bind(null, act.manipulate("change_sign"))}>
    Change side
  </button>
</li>
<li className="list-group-item">
  <button type="button" className="btn btn-default" id="move_up" onClick={dispatch.bind(null, act.manipulate("move_up"))}>
      <span className="glyphicon glyphicon-arrow-up"></span>
  </button>
  <div className="row">
    <button type="button" className="btn btn-default" id="move_left" onClick={dispatch.bind(null, act.manipulate("move_left"))}>
      <span className="glyphicon glyphicon-arrow-left"></span>
    </button>
    <span>Move selection</span>
    <button type="button" className="btn btn-default" id="move_right" onClick={dispatch.bind(null, act.manipulate("move_right"))}>
      <span className="glyphicon glyphicon-arrow-right"></span>
    </button>
  </div>
  <button type="button" className="btn btn-default" id="move_down" onClick={dispatch.bind(null, act.manipulate("move_down"))}>
      <span className="glyphicon glyphicon-arrow-down"></span>
  </button>
</li>
<li className="list-group-item">
  <button type="button" className="btn btn-default" id="distribute-in" onClick={dispatch.bind(null, act.manipulate("distribute_in"))}>
    Distribute in
  </button>
  <button type="button" className="btn btn-default" id="collect-out" onClick={dispatch.bind(null, act.manipulate("collect_out"))}>
    Collect out
  </button>
</li>
<button type="button" className="list-group-item" id="eval" onClick={dispatch.bind(null, act.manipulate("evaluate"))}>
  Evaluate/Simplify
</button>
<button type="button" className="list-group-item" id="operate" onClick={dispatch.bind(null, act.manipulate("operate"))}>
  Operate
</button>
*/
