import React from 'react';
import ReactDOM from 'react-dom'
import katex from '/imports/katex.min.js';
// import classNames from 'classnames';
import {updateIndex} from '../../redux/actions/action-creators';

import History from './history'
import EquationListComponent from './equation-list'
import RecordingsListComponent from './recordings-list'

import { Equations } from '../../api/collections.js';
import { Meteor } from 'meteor/meteor';


export default class EquationsPanel extends React.Component {
  constructor() {
    super();
    this.state = { showAddEq: false, searchString: "", recSearchString: ""};
  }
  hideAddEq() {
    this.setState({ showAddEq: false })
  }
  render() {
    const { store } = this.context;
    const state = store.getState();
    let mathList = state.mathHist.filter( x => x.current_eq === state.current_eq );
    let mathStr = mathList[mathList.length - 1].mathStr;
    let thisComp = this;
    return (
      <div id="tabs">
        <ul>
          <li><a href="#equations">Equations</a></li>
          <li><a href="#history">History</a></li>
          <li><a href="#recordings">Recordings</a></li>
        </ul>
        <div id="equations">
          <div>
            <input type="text" className="form-control" id="search-eq" placeholder="Search..." onKeyDown={(e)=>{
                if (e.keyCode == 13) {
                  thisComp.setState( {searchString: e.target.value });
                  // console.log("search for equation with " + this.searchString)
                }
              }}/> &nbsp;
            <button className="btn btn-default" onClick={()=>{
                thisComp.setState({ showAddEq: true })
              }}><span className="glyphicon glyphicon-plus" aria-hidden="true"></span></button>
          </div>
          { this.state.showAddEq ? <SaveEquation hideMe={this.hideAddEq.bind(this)} mathStr={mathStr}/> : null }
          <br/>
          <EquationListComponent query={this.state.searchString}/>
        </div>
        <History />
        <div id="recordings">
          <input type="text" className="form-control" id="search-rec" placeholder="Search..." onKeyDown={(e)=>{
              if (e.keyCode == 13) {
                thisComp.setState( {recSearchString: e.target.value });
              }
            }}/>
          <RecordingsListComponent query={this.state.recSearchString}/>
        </div>
      </div>
    )
  }
}

EquationsPanel.contextTypes = {
  store: React.PropTypes.object
};

class SaveEquation extends React.Component {
  handleSubmit(e) {
    e.preventDefault();
    const name = ReactDOM.findDOMNode(this.refs.name).value.trim();
    const math = ReactDOM.findDOMNode(this.refs.math).value.trim();
    Equations.insert({
      math,
      name,
      owner: Meteor.userId(),
      username: Meteor.user().username,
      createdAt: new Date(), // current time
    });
    ReactDOM.findDOMNode(this.refs.math).value = '';
    ReactDOM.findDOMNode(this.refs.name).value = '';
    this.props.hideMe();
  }
  render() {
    return (
      <form onSubmit={this.handleSubmit.bind(this)}>
        <label htmlFor="add-eq-latex">Latex: </label>
        <input type="text" className="form-control" ref="math" id="add-eq-latex" defaultValue={this.props.mathStr} />

        <label htmlFor="add-eq-desc">Name: </label>
        <input type="text" className="form-control" ref="name" id="add-eq-desc" placeholder="Add description..." />

        <div>Tags (comming soon) </div>
        <br/>
        <input type="submit" className="btn btn-primary" value="Submit"/> &nbsp;
        <button className="btn btn-default" onClick={(e)=>{
            e.preventDefault();
            this.props.hideMe();
          }}>Cancel</button>
      </form>
    )
  }
}
