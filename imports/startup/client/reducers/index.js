//import { combineReducers } from 'redux';
import { clear_math } from '../../../maths/functions'


const rootReducer = (state = {}, action) => {
  if (action.type === "UPDATE_EQUATION") {
    console.log("updating equation", state, action);
    return { ...state,
      mathHist: [ ...state.mathHist, clear_math(action.mathStr)],
      current_index: ++state.current_index,
      doing_manip: false}
  } else if  (action.type === "ADD_TO_HISTORY") {
    // console.log("adding to history", state, action);
    return { ...state,
      mathHist: [ ...state.mathHist.slice(0, action.index), clear_math(action.mathStr), ...state.mathHist.slice(action.index+1)],
      current_index: action.index,
      doing_manip: false}
  } else if (action.type === "UPDATE_INDEX") {
    // console.log("updating index", action.index);
    if (action.index > state.mathHist.length-1 || action.index < 0) {
      return state
    } else {
      return { ...state, current_index: action.index}
    }
  } else if (action.type === "MANIPULATION") {
    console.log("manipulating", action.manip);
    return { ...state, manip: action.manip, doing_manip: true, manip_data: action.manip_data}
  } else if (action.type === "UPDATE_SELECT") {
    // console.log("update select", action.newSelectVars);
    return { ...state, ...action.newSelectVars}
  } else if (action.type === "UPDATE_ZOOM") {
    // console.log("updazing zoom", action.newZoom);
    return { ...state, eqZoom: action.newZoom}
  } else {
    return state;
  }
};

export default rootReducer
