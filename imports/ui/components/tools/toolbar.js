import React from 'react';
import ReactDOM from 'react-dom';
import * as Actions from '../../../redux/actions/action-creators';

export default class Toolbar extends React.Component {
  render() {
    const { store } = this.context;
    const { dispatch } = store;
    return (
      <div className="row">
  			<div className="bottom-buffer btn-toolbar" role="toolbar">
      			  <div className="btn-group">
      			    <button id="tb-undo" className="btn btn-default" onClick={()=>{
                    const state = store.getState();
                    dispatch(Actions.updateIndex(state.current_index-1))
                  }}>Undo</button>
      			    <button id="tb-redo" className="btn btn-default" onClick={()=>{
                    const state = store.getState();
                    dispatch(Actions.updateIndex(state.current_index+1))
                  }}>Redo</button>
      			  </div>
      			<button type="button" className="btn btn-default " id="tb-flip_equation" onClick={dispatch.bind(null, Actions.manipulate("flip_equation"))}>
  					Flip equation
  				  </button>
  				<button type="button" className="btn btn-default " id="tb-change_side" onClick={dispatch.bind(null, Actions.manipulate("change_side"))}>
  					Change side
  				</button>

  				<div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-move_up" onClick={dispatch.bind(null, Actions.manipulate("move_up"))}>
  							<span className="glyphicon glyphicon-arrow-up"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_left" onClick={dispatch.bind(null, Actions.manipulate("move_left"))}>
  						<span className="glyphicon glyphicon-arrow-left"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_right" onClick={dispatch.bind(null, Actions.manipulate("move_right"))}>
  						<span className="glyphicon glyphicon-arrow-right"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_down" onClick={dispatch.bind(null, Actions.manipulate("move_down"))}>
  							<span className="glyphicon glyphicon-arrow-down"></span>
  					</button>
  				</div>

  				<div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-distribute-in" onClick={dispatch.bind(null, Actions.manipulate("distribute_in"))}>
  						Distribute in
  					</button>
  					<button type="button" className="btn btn-default" id="tb-collect-out" onClick={dispatch.bind(null, Actions.manipulate("collect_out"))}>
  						Collect out
  					</button>
  				</div>

          <div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-split" onClick={dispatch.bind(null, Actions.manipulate("split"))}>
  						Split out
  					</button>
  					<button type="button" className="btn btn-default" id="tb-merge" onClick={dispatch.bind(null, Actions.manipulate("merge"))}>
  						Merge in
  					</button>
  				</div>
          <br />
          <br />
  				<button type="button" className="btn btn-default" id="tb-eval" onClick={dispatch.bind(null, Actions.manipulate("evaluate"))}>
  					Evaluate/Simplify
  				</button>
  				<button type="button" className="btn btn-default" id="tb-operate" onClick={dispatch.bind(null, Actions.manipulate("operate"))}>
  					Operate
  				</button>
          <button type="button" className="btn btn-default" id="tb-cancel-out" onClick={dispatch.bind(null, Actions.manipulate("cancel_out"))}>
  					Cancel out
  				</button>
  			</div>
  		</div>
    );
  }
}
Toolbar.contextTypes = {
  store: React.PropTypes.object
};
