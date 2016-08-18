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
  mathHist: [init_math_str],
  eqZoom: 14,
  recording: false,
  manip: null,
  manip_data: null,
  doing_manip: false
};

const store = createStore(rootReducer, defaultState);

//note that if store.getState() returns undefined it may be due to the rootReducer being incorrect, like missing a return statement.

let todos = (state=[], action) => state;

// export const history = syncHistoryWithStore(browserHistory, store);

export default store;
