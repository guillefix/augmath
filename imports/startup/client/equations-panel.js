import React from 'react';
import ReactDOM from 'react-dom'
import katex from 'katex';
import classNames from 'classnames';
import {updateIndex} from './actions/action-creators';

import History from './history'


export default class EquationsPanel extends React.Component {
  render() {
    return (
      <div id="tabs">
        <ul>
          <li><a href="#equations">Equations</a></li>
          <li><a href="#history">History</a></li>
        </ul>
        <div id="equations">
          <p>Add: <input size="35" id="add_eq"/></p>
          <div id="eq_list" className="list-group">
          </div>
        </div>
        <History />
      </div>
    )
  }
}
