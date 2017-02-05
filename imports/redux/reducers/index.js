//import { combineReducers } from 'redux';
import { clear_math } from '../../maths/functions'

let subsArray = (arr, index, el) => {
  if (typeof el === "undefined") return [ ...arr.slice(0, index), ...arr.slice(index+1)]
  else return [ ...arr.slice(0, index), el, ...arr.slice(index+1)]
};

let updateIndexMathHist = (mathHist, equations, index) => [...mathHist.slice(0,-1), {mathStr: equations[index], current_eq: index}];

const rootReducer = (state = {}, action) => {
  let newState;
  if (state.recording.doingRecording
      && (action.type === "ADD_TO_EQUATIONS"
        // || action.type === "ADD_TO_HISTORY"
        || action.type === "UPDATE_INDEX"
        || action.type === "MANIPULATION"
        || action.type === "UPDATE_ZOOM"
        || action.type === "SELECT_NODE"
        || action.type === "CHANGE_STEP_DURATION"
        || action.type === "SELECT_EQUATION")) {
    newState = { ...state, recording: { ...state.recording,
      recordedActions: [ ...state.recording.recordedActions, action ]}}
  }
  // else if (state.recording.doingPlaying && action.type !== "UPDATE_STATE") {
  //   if (state.recording.recordedStates.length >= state.recording.maxRecordedStates) {
  //     newState = { ...state, recording: { ...state.recording,
  //       recordedStates: [ ...state.recording.recordedStates.slice(1), state ]}}
  //   } else {
  //     newState = { ...state, recording: { ...state.recording,
  //       recordedStates: [ ...state.recording.recordedStates, state ]}}
  //   }
  // }
  else {
    newState = { ...state }
  }
  switch(action.type) {
    case "ADD_TO_HISTORY":
      // console.log("adding to history", state, action);
      cl_math = clear_math(action.mathStr);
      let eqIndex;
      if (typeof action.eqIndex !== "undefined") {
        eqIndex = action.eqIndex;
      } else {
        eqIndex = newState.mathHist[newState.current_index].current_eq;
      }
      newObj = {mathStr: cl_math, current_eq: eqIndex};
      return { ...newState,
        mathHist: [ ...newState.mathHist.slice(0, action.index), newObj, ...newState.mathHist.slice(action.index+1)],
        equations: [ ...newState.equations.slice(0, eqIndex), cl_math, ...newState.equations.slice(eqIndex+1)],
        current_index: action.index,
        doing_manip: false,
        selectedNodes: []}
    case "UPDATE_INDEX":
      console.log("updating index", action.index);
      if (action.index > newState.mathHist.length-1 || action.index < 0) {
        return state
      } else {
        let newEqIndex = newState.mathHist[action.index].current_eq;
        let newEq = newState.mathHist[action.index].mathStr;
        return { ...newState,
          current_index: action.index,
          equations: subsArray(newState.equations, newEqIndex, newEq)}
      }
    case "MANIPULATION":
      console.log("manipulating", action.manip);
      return { ...newState, manip: action.manip, doing_manip: true, manip_data: action.manip_data}
    case "UPDATE_SELECT":
      console.log("update select", action.newSelectVars);
      return { ...newState,
        ...action.newSelectVars,
        selectedNodes: []}
    case "UPDATE_ZOOM":
      // console.log("updazing zoom", action.newZoom);
      return { ...newState, eqZoom: action.newZoom}
    case "ADD_TO_EQUATIONS":
      console.log("adding to equations", action.eq);
      cl_math = clear_math(action.eq);
      let new_eq = newState.equations.length;
      return { ...newState,
        equations: [ ...newState.equations, cl_math],
        mathHist: [...newState.mathHist, {mathStr: cl_math, current_eq: new_eq}],
        current_index: newState.current_index+1}
    case "SELECT_NODE":
      console.log("selecting node", action.nodeId);
      let nodes = state.selectedNodes;
      let id = action.nodeId;
      let index = nodes.indexOf(id);
      let currEq = action.nodeId.split('/')[0];
      if (state.multi_select && nodes.length > 0 && currEq === nodes[0].split('/')[0]) {
        if (index === -1) {
          newState = { ...newState,
            selectedNodes: [...nodes, id]}
        } else {
          newState = { ...newState,
            selectedNodes: subsArray(nodes, index)};
        }
      } else {
        if (index === -1) {
          console.log("hi");
          newState = { ...newState,
            selectedNodes: [action.nodeId]}
        } else {
          newState = { ...newState,
            selectedNodes: []};
        }
      }
      return { ...newState,
        mathHist: updateIndexMathHist(newState.mathHist,newState.equations,parseInt(currEq))}
    case "RESET_SELECTED":
      return { ...newState,
        selectedNodes: []}
    case "UPDATE_DRAGDROP_MODE":
      return { ...newState,
        dragDrop: action.newMode}
    case "CHANGE_STEP_DURATION":
      return { ...newState,
        step_duration: action.newStepDur}
    case "SELECT_EQUATION":
      return { ...newState,
        mathHist: updateIndexMathHist(newState.mathHist,newState.equations,action.newEqIndex)}
      break;
    case "BEGIN_RECORDING":
      return { ...newState,
        recording: { ...newState.recording, doingRecording: true, recordedStates: [newState]}
      }
      break;
    case "STOP_RECORDING":
      return { ...newState,
        recording: { ...newState.recording, doingRecording: false}
      }
      break;
    case "BEGIN_PLAYING":
      return { ...newState.recording.recordedStates[0],
        recording: { ...newState.recording, doingRecording: false, doingPlaying: true}
      }
      break;
    case "STOP_PLAYING":
      return { ...newState,
        recording: { ...newState.recording, doingPlaying: false, recordedStates: []}
      }
      break;
    // case "UPDATE_STATE":
    //   console.log("UPDATE STATE ACTION!");
    //   return { ...action.state}
    //   break;
    case "LOAD_RECORDING":
      return { ...newState,
        recording: action.recObj}
      break;
    default:
        return state;
  }
};

export default rootReducer
