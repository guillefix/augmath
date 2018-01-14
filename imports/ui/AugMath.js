import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import Equation from './components/intmath/equation.js'
import store from '../redux/store';


//Components
// import Tools from './components/tools/tools.js';
// import EquationsPanel from './components/equations-panel.js';
// import MathInput from './components/intmath/mathinput.js';
// import MQInput from './components/intmath/mqinput.js';
// import MathArea from './components/intmath/matharea.js';
// import Toolbar from './components/tools/toolbar.js';
// import AccountsUIWrapper from './components/AccountsUIWrapper.jsx';

import * as Actions from '../redux/actions/action-creators';

class EqWrapper extends React.Component {
  constructor() {
    super();
  }
  componentDidMount() {
    this.unsubscribe = store.subscribe(this.forceUpdate.bind(this));
  }
  render() {
    const {store} = this.context;
    const state = store.getState();
    const index = state.mathHist[state.current_index].current_eq;
    const mathStr = state.mathHist[state.current_index].mathStr
    let equations = state.equations;
    let eqNum = equations.length;
    let selectedNodes = state.selectedNodes;
    let dragDrop = state.dragDrop;
    return (
      <Equation mtype={state.mtype} depth={state.depth} selectedNodes={selectedNodes} dragDrop={dragDrop} eqZoom={state.eqZoom} math={mathStr} eqNum={eqNum} index={index} selected={state.mathHist[state.current_index].current_eq === index}/>
    )
  }
}
EqWrapper.contextTypes = {
  store: React.PropTypes.object
};

let AugMathify = function(node, index, mathStr) {
  // const {store} = this.context;
  const { dispatch } = store;
  const state = store.getState();
  let equations = state.equations;
  let eqNum = equations.length;
  let selectedNodes = state.selectedNodes;
  let dragDrop = state.dragDrop;
  let sel = selectedNodes.filter(x => parseInt(x.split('/')[0]) === index);
  dispatch(Actions.addToHist(mathStr,state.current_index, index));
  ReactDOM.render(
    <Provider store={store}><EqWrapper/></Provider>, node);
}

let Manipulate = function(manip) {
  const { dispatch } = store;
  dispatch(Actions.manipulate(manip))
}



// export default { AugMathify,Manipulate }

module.exports = {
  AugMathify,
  Manipulate
}

// AugMath = {
//   AugMathify,
//   Manipulate
// }

//
function setUpKeyControls(dispatch, store) {
  //Key controls
  $(document).on( "keyup", function (e) {
      if (e.keyCode == 39) { //right
        const state = store.getState();
        const selectedNodes = state.selectedNodes;
        if (selectedNodes.length > 0) {
          let arr = selectedNodes[0].split("/");
          arr[arr.length-1] = (parseInt(arr[arr.length-1])+1).toString();
          let newNodeId = arr.join("/");
          dispatch(Actions.selectNode(newNodeId));
          }
      } else if (e.keyCode == 37) { //left
        const state = store.getState();
        const selectedNodes = state.selectedNodes;
        if (selectedNodes.length > 0) {
          let arr = selectedNodes[0].split("/");
          arr[arr.length-1] = (parseInt(arr[arr.length-1])-1).toString();
          let newNodeId = arr.join("/");
          dispatch(Actions.selectNode(newNodeId));
          }
      } else if (e.keyCode == 40) { //down
        const state = store.getState();
        const selectedNodes = state.selectedNodes;
        if (selectedNodes.length > 0) {
            let arr = selectedNodes[0].split("/");
            arr = [...arr, "1"];
            let newNodeId = arr.join("/");
            dispatch(Actions.selectNode(newNodeId));
        }
      } else if (e.keyCode == 38) { //up
        const state = store.getState();
        const selectedNodes = state.selectedNodes;
        if (selectedNodes.length > 0) {
            let arr = selectedNodes[0].split("/");
            arr = arr.slice(0,-1);
            let newNodeId = arr.join("/");
            dispatch(Actions.selectNode(newNodeId));
        }
      } else if (e.keyCode == 77 && e.ctrlKey) { //ctrl+m for multiselect
        const state = store.getState();
        dispatch(Actions.updateSelect({multi_select: !state.multi_select}));
        // console.log(thisApp.state.multi_select);
      }
  });

}
