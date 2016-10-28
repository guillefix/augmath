import React from 'react';
import ReactDOM from 'react-dom';
import * as Actions from '../../actions/action-creators';
import Equation from './equation.js'

export default class MathArea extends React.Component {
  render() {
    const {store} = this.context;
    const state = store.getState();
    let equations = state.equations;
    let eqNum = equations.length;
    let selectedNodes = state.selectedNodes;
    return (
      <div className="row">
        <div className="math-container">
          {equations.map((x, i) => {
            let sel = selectedNodes.filter(x => parseInt(x.split('/')[0]) === i)
            // console.log("math", i, x);
            return <Equation mtype={this.props.mtype} depth={this.props.depth} selectedNodes={sel} eqZoom={this.props.eqZoom} math={x} eqNum={eqNum} index={i} key={i} selected={state.current_eq === i} ref={state.current_eq === i ? "math" : undefined}/>
          }).reverse()}
  			</div>
      </div>
    )
  }
}
MathArea.contextTypes = {
  store: React.PropTypes.object
};
