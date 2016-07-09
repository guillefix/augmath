import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.js';

Meteor.startup(() => {
  ReactDOM.render(<App />, document.getElementById('app'));

  //undo
  document.getElementById("tb-undo").onclick = undo;
  document.getElementById("undo").onclick = undo;
  function undo() {
    if (current_index > 0) {
      if (recording_index > 0) {recording_index--;}
      select_in_history(current_index-1);
    }
  }

  //redo
  document.getElementById("tb-redo").onclick = redo;
  document.getElementById("redo").onclick = redo;
  function redo() {
    if (current_index < math_str.length-1) {
      if (recording_index < math_str_rec.length-1) {recording_index++;}
      select_in_history(current_index+1);
    }
  }

});
