import React from 'react';
import ReactDOM from 'react-dom';
// import * as manip from '../../maths/manipulations.js';
import * as hist from '../history';
import * as act from '../../../redux/actions/action-creators';

import RecordPlayControl from './record-play-control.js';

export default class Tools extends React.Component {
  // constructor() {
  //   super();
  //   this.state = {selectedText: ""}
  // }
  componentDidMount() {
  $("#depth").numbers({
    min: 0,
    step: 1,
    integer: true,
    growth: 10,
  });
  const { store } = this.context;
  const state = store.getState();
  let thisComp = this;
  store.subscribe(() => {
    const state = store.getState();
    // thisComp.setState({selectedText: state.selectedText})
    thisComp.replaceSelectInput.value = state.selectedText;
  })
  }
  render() {
    const { store } = this.context;
    const { dispatch } = store;
    const state = store.getState();
    return <div>
      <ul id="tools" className="list-group text-center">
  			<div>
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
    					<span>Select multiple <input type="checkbox" checked={state.multi_select} name="multi_select" id="multi_select" onChange={()=>{
                  let state = store.getState();
                  dispatch(act.updateSelect({multi_select: !state.multi_select}))}}/></span>
    					<br/>
    					<span>Select variable <input type="checkbox" checked={state.var_select} name="var_select" id="var_select" onChange={()=>{
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
  			</div>
  			<div>
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
                <label>Replace selection with:
                  <br/>
                  <span id="replace-mathquill"
                    onKeyUp={ (e) => {
                      let MQ = MathQuill.getInterface(2);
                      let latex = MQ.MathField($('#replace-mathquill')[0]).latex();
                      if (e.keyCode === 13) dispatch(act.manipulate("replace", latex))
                      else $('#replace').val(latex)
                    }}>...</span>
                  <input id="replace" size="20" ref={(ref) => this.replaceSelectInput = ref}
                    placeholder="Type LaTeX here"
                    onChange={ (e) => {
                        let MQ = MathQuill.getInterface(2);
                        this.mathquill = MQ.MathField($('#replace-mathquill')[0]);
                        this.mathquill.latex(e.target.value)
                      }
                    }
                    onClick={ (e) => {
                        let MQ = MathQuill.getInterface(2);
                        this.mathquill = MQ.MathField($('#replace-mathquill')[0]);
                        this.mathquill.latex(e.target.value)
                      }
                    }
                    onKeyUp={(e)=> {
                      if (e.keyCode == 13) dispatch(act.manipulate("replace", e.target.value))}} />
                </label>
                <span>Replace individually <input type="checkbox" name="replace_ind" checked={state.replace_ind} id="replace_ind" onChange={()=>{
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
  			</div>
  			<RecordPlayControl />
  			<div>
          <h4>Settings</h4>
          <div>
            <button type="button" className="list-group-item" id="make_json">
              <label htmlFor="zoom-slider">Zoom</label> <input name="zoom-slider" id="zoom-slider" type="range" min="1" max="100" step="3" defaultValue="14" onChange={(e)=>dispatch(act.updateZoom(e.target.value))}/>
            </button>
            <div type="button" className="list-group-item" id="make_json">
              <label htmlFor="dragdropmode">Drag &amp; drop mode</label>
              <br/>
              <div className="btn-group" role="group" aria-label="dragdropmode">
                <button type="button" className={"btn btn-default"+(state.dragDrop === "apply" ? " active" : "")} onClick={dispatch.bind(null, act.updateddmode("apply"))}>Apply</button>
                <button type="button" className={"btn btn-default"+(state.dragDrop === "subs" ? " active" : "")} onClick={dispatch.bind(null, act.updateddmode("subs"))}>Subs</button>
                <button type="button" className={"btn btn-default"+(state.dragDrop === "move" ? " active" : "")} onClick={dispatch.bind(null, act.updateddmode("move"))}>Move</button>
              </div>
          </div>
          </div>
  			</div>
  		</ul>
    </div>
  }
}

Tools.contextTypes = {
  store: React.PropTypes.object
};
