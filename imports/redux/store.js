import { createStore, compose } from 'redux';
// import { syncHistoryWithStore } from 'react-router-redux';
// import { browserHistory } from 'react-router';

//import the root reducer
import rootReducer from './reducers/index';

const init_math_str = "\\frac{v^{2}}{r}=\\frac{GMm}{r^{2}}+3abcd";

const defaultState = {
  mtype: "term",
  depth: 1,
  multi_select: false,
  var_select: false,
  replace_ind: false,
  current_index: 0,
  mathHist: [{mathStr: init_math_str, current_eq: 0}],
  eqZoom: 14,
  recording: false,
  manip: null,
  manip_data: null,
  doing_manip: false,
  equations: [init_math_str],
  current_eq: 0,
  selectedNodes: [],
  dragDrop: 'apply',
  step_duration: 700
};

const store = createStore(rootReducer, defaultState,
    window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );

//note that if store.getState() returns undefined it may be due to the rootReducer being incorrect, like missing a return statement.

let todos = (state=[], action) => state;

// export const history = syncHistoryWithStore(browserHistory, store);

export default store;
