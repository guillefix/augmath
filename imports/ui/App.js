import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';

//Components
import Tools from './components/tools/tools.js';
import EquationsPanel from './components/equations-panel.js';
import MathInput from './components/intmath/mathinput.js';
import MQInput from './components/intmath/mqinput.js';
import MathArea from './components/intmath/matharea.js';
import Toolbar from './components/tools/toolbar.js';
import AccountsUIWrapper from './components/AccountsUIWrapper.jsx';

import * as Actions from '../redux/actions/action-creators';
import {get_next_id, get_prev_id, get_child_id, get_parent_id } from '../maths/functions.js'


export default class App extends React.Component {
  constructor() {
    super();
    this.update = this.update.bind(this);
    let init_math_str = "\\frac{v^{2}}{r}=\\frac{GMm}{r^{2}}+3abcd";
    this.state = {
      mathStr: init_math_str, //mathStr is the UI math string, to keep MathQL and MathInput in sync
      mtype: "term",
      depth: 1,
      eqZoom: 14};
  }
  update(newStr) {
    this.setState({mathStr: newStr})
  }
  componentDidMount() {
    //Boilerplate
    const thisApp = this;
    const { store } = this.context;
    this.dispatch = store.dispatch;
    const dispatch = this.dispatch;
    const state = store.getState();

    //Update of the UI variables controlled by the App component.
    store.subscribe(() => {
      const state = store.getState();
      if (!state.doing_manip) {
        thisApp.setState({mtype: state.mtype,
          depth: state.depth,
          mathStr: state.mathHist[state.current_index].mathStr,
          eqZoom: state.eqZoom})
      }
    })

    setUpKeyControls.call(this,dispatch,store); //function is below
  }

  render() {
    const { store } = this.context;
    const state = store.getState();
    return (
      <div>
        <Nav/>
        <div className="container-fluid">
          <div className="col-md-3 toolbar">
            <Tools ref={(ref) => this.toolsPane = ref} mtype={this.state.mtype} depth={this.state.depth} />
          </div>
          <div className="col-md-6">
            <Toolbar />
            <MathInput mathStr={this.state.mathStr} update={this.update} index={state.current_index} dispatch={store.dispatch}/>

            <MathArea mtype={this.state.mtype} depth={this.state.depth} eqZoom={this.state.eqZoom} index={this.state.current_index}/>
          </div>
          <div className="col-md-3">
            <EquationsPanel />
          </div>
        </div>
      </div>
    );
  }
}
App.contextTypes = {
  store: React.PropTypes.object
};

let Nav = () => (
  <nav className="navbar navbar-default">
    <div className="container-fluid">
      <div className="navbar-header">
        <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
          <span className="sr-only">Toggle navigation</span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
        <a className="navbar-brand" href="#">AugMath</a>
      </div>
      <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
       <ul className="nav navbar-nav navbar-right">
         <li id="user-login">
           <AccountsUIWrapper />
         </li>
          <li>
            <a href="https://github.com/guillefix/augmath">
              GitHub
            </a>
          </li>
       </ul>
      </div>
    </div>
  </nav>
)

function setUpKeyControls(dispatch, store) {
  //Key controls
  $(document).on( "keyup", function (e) {
      if (e.keyCode == 76 && e.altKey) { //move right
          dispatch(Actions.manipulate("move_right"))
      } else if (e.keyCode == 72 && e.altKey) { //move left
          dispatch(Actions.manipulate("move_left"))
      } else if (e.keyCode == 74 && e.altKey) { //move down
          dispatch(Actions.manipulate("move_down"))
      } else if (e.keyCode == 75 && e.altKey) { //move up
          dispatch(Actions.manipulate("move_up"))
      } else if (e.keyCode == 39 || e.keyCode == 76) { //right
        const state = store.getState();
        const selectedNodes = state.selectedNodes;
        if (selectedNodes.length > 0) {
          dispatch(Actions.selectNode(get_next_id(selectedNodes[0])));
          }
      } else if (e.keyCode == 37 || e.keyCode == 72) { //left
        const state = store.getState();
        const selectedNodes = state.selectedNodes;
        if (selectedNodes.length > 0) {
          dispatch(Actions.selectNode(get_prev_id(selectedNodes[0])));
          }
      } else if (e.keyCode == 40 || e.keyCode == 74) { //down
        const state = store.getState();
        const selectedNodes = state.selectedNodes;
        if (selectedNodes.length > 0) {
          dispatch(Actions.selectNode(get_child_id(selectedNodes[0])));
        }
      } else if (e.keyCode == 38 || e.keyCode == 75) { //up
        const state = store.getState();
        const selectedNodes = state.selectedNodes;
        if (selectedNodes.length > 0) {
          dispatch(Actions.selectNode(get_parent_id(selectedNodes[0])));
        }
      } else if (e.keyCode == 77 && e.ctrlKey) { //ctrl+m for multiselect
        const state = store.getState();
        dispatch(Actions.updateSelect({multi_select: !state.multi_select}));
        // console.log(thisApp.state.multi_select);
      } else if (e.keyCode == 68) { //Change side
          dispatch(Actions.manipulate("change_side"))
      }
  });

}
