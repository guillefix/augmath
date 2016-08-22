//import { combineReducers } from 'redux';
import { clear_math } from '../../../maths/functions'

let subsArray = (arr, index, el) => {
  if (typeof el === "undefined") return [ ...arr.slice(0, index), ...arr.slice(index+1)]
  else return [ ...arr.slice(0, index), el, ...arr.slice(index+1)]
};

const rootReducer = (state = {}, action) => {
  switch(action.type) {
    case "ADD_TO_HISTORY":
      // console.log("adding to history", state, action);
      cl_math = clear_math(action.mathStr);
      newObj = {mathStr: cl_math, current_eq: state.current_eq};
      return { ...state,
        mathHist: [ ...state.mathHist.slice(0, action.index), newObj, ...state.mathHist.slice(action.index+1)],
        equations: [ ...state.equations.slice(0, state.current_eq), cl_math, ...state.equations.slice(state.current_eq+1)],
        current_index: action.index,
        doing_manip: false,
        selectedNodes: []}
    case "UPDATE_INDEX":
      // console.log("updating index", action.index);
      if (action.index > state.mathHist.length-1 || action.index < 0) {
        return state
      } else {
        let newEqIndex = state.mathHist[action.index].current_eq;
        let newEq = state.mathHist[action.index].mathStr;
        return { ...state,
          current_index: action.index,
          current_eq: newEqIndex,
          equations: subsArray(state.equations, newEqIndex, newEq)}
      }
    case "MANIPULATION":
      console.log("manipulating", action.manip);
      return { ...state, manip: action.manip, doing_manip: true, manip_data: action.manip_data}
    case "UPDATE_SELECT":
      console.log("update select", action.newSelectVars);
      return { ...state,
        ...action.newSelectVars,
        selectedNodes: []}
    case "UPDATE_ZOOM":
      // console.log("updazing zoom", action.newZoom);
      return { ...state, eqZoom: action.newZoom}
    case "ADD_TO_EQUATIONS":
      console.log("adding to equations", action.eq);
      cl_math = clear_math(action.eq);
      let new_eq = state.equations.length;
      return { ...state,
        current_eq: new_eq,
        equations: [ ...state.equations, cl_math],
        mathHist: [...state.mathHist, {mathStr: cl_math, current_eq: new_eq}],
        current_index: state.current_index+1}
    case "SELECT_NODE":
      console.log("selecting node", action.nodeId);
      let nodes = state.selectedNodes;
      let id = action.nodeId;
      let index = nodes.indexOf(id);
      let currEq = action.nodeId.split('/')[0];
      let newState;
      if (state.multi_select && nodes.length > 0 && currEq === nodes[0].split('/')[0]) {
        if (index === -1) {
          newState = { ...state,
            selectedNodes: [...nodes, action.nodeId]}
        } else {
          newState = { ...state,
            selectedNodes: subsArray(nodes, index)};
        }
      } else {
        if (index === -1) {
          newState = { ...state,
            selectedNodes: [action.nodeId]}
        } else {
          newState = { ...state,
            selectedNodes: []};
        }
        return { ...newState,
          current_eq: parseInt(currEq)}
      }
    case "RESET_SELECTED":
      return { ...state,
        selectedNodes: []}
    default:
        return state;
  }
};

export default rootReducer
