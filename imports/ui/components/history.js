import React from 'react';
import ReactDOM from 'react-dom'
import katex from 'katex';
import classNames from 'classnames';
import {updateIndex} from '../../redux/actions/action-creators';

// import {equation, history} from './App.js';

export default class History extends React.Component {
  componentDidMount() {
    const { store } = this.context;
    store.subscribe(this.forceUpdate.bind(this))
  }
  render() {
    const { store } = this.context;
    const { mathHist, recording, current_index } = store.getState()
    return (
      <div id="history">
        <div id="history_list" className="list-group">
          {mathHist.map((ms, i) =>
            <HistoryEl dispatch={store.dispatch} current_index={current_index} recording={recording} key={i} mathStr={ms.mathStr} index={i.toString()} />
          ).reverse()}
        </div>
      </div>
    )
  }
}
History.contextTypes = {
  store: React.PropTypes.object
};

class HistoryEl extends React.Component {
  componentDidMount() {
    katex.render(this.props.mathStr, ReactDOM.findDOMNode(this.refs.hist_el), { displayMode: true });
  }
  componentDidUpdate(prevProps, prevState) {
    katex.render(this.props.mathStr, ReactDOM.findDOMNode(this.refs.hist_el), { displayMode: true });
  }
  showButtons() {
    $(ReactDOM.findDOMNode(this.refs.buttons)).show()
  }
  hideButtons() {
    $(ReactDOM.findDOMNode(this.refs.buttons)).hide()
  }
  render() {
    const { recording, current_index, index, dispatch } = this.props;
    // console.log(this.props);
    return (
      <a className={classNames("list-group-item",{"recording" : recording, "active": current_index===parseInt(index)})} onMouseOver={this.showButtons.bind(this)} onMouseOut={this.hideButtons.bind(this)}>
        <p ref="hist_el" className="list-group-item">...</p>
        <div className="his_buttons" ref="buttons">
          <br/>
          <button type="button" className="btn btn-default" onClick={dispatch.bind(null, updateIndex(parseInt(index)))}>
            <span className="glyphicon glyphicon-chevron-left"></span>
          </button>
          &nbsp;Latex:<input size="20" defaultValue={this.props.mathStr}/>
        </div>
      </a>
    )
  }
}



//OLD HISTORY FUNCTIONS

// //undo
// export function undo() {
//   if (history.current_index > 0) {
//     if (recording_index > 0) {recording_index--;}
//     select_in_history(history.current_index-1);
//   }
// }
//
// //redo
// export function redo() {
//   if (history.current_index < equation.math_str.length-1) {
//     if (recording_index < equation.math_str_rec.length-1) {recording_index++;}
//     select_in_history(history.current_index+1);
//   }
// }

// export function select_in_history(index) {
//   let new_index = history.current_index
//   if (recording) {
//     recording_index-=(equation.math_str.length-1-index);
//     math_str_rec = math_str_rec.slice(0, recording_index-1);
//     manipulation_rec = manipulation_rec.slice(0, recording_index-1);
//     selected_nodes_id_rec = selected_nodes_id_rec.slice(0, recording_index-1);
//     for (history.current_index; history.current_index > index; history.current_index--) {
//       $("#step"+history.current_index.toString()).parent().removeClass("recording-active");
//       $("#step"+history.current_index.toString()).parent().removeClass("recording");
//     }
//   } else {
//     new_index=index;
//   }
//   // active_in_history(index);
//   prepare(equation.math_str[index], new_index);
// }
// export function add_to_history(index, place) {
//   var his_html = '<a class="list-group-item" onmouseover="$(this).stop().children(\'.his_buttons\').show()" onmouseout="$(this).stop().children(\'.his_buttons\').hide()"><p id="'+'step'+index.toString()+'" class="list-group-item">...</p><div class="his_buttons"><br><button type="button" class="btn btn-default" onclick="select_in_history('+index.toString()+')"><span class="glyphicon glyphicon-chevron-left"></span></button>&nbsp;Latex:<input size="20" value="'+equation.math_str[index]+'"/></div></a>';
//   if (place>-1) {
//     $("#history_list").children(":has(#step"+place+")").before(his_html);
//   } else {
//     $("#history_list").append(his_html);
//   }
//   var his_el = document.getElementById('step'+index.toString());
//   // console.log(math_str[index]);
//   katex.render(equation.math_str[index], his_el, { displayMode: true });
//   if (recording) {
//     $(his_el).parent().addClass("recording");
//   }
// }
// export function active_in_history(index) {
//   $("#history_list").children().removeClass("active");
//   $("#history_list").children().removeClass("recording-active");
//   var cl;
//   if (recording) {
//     $("#step"+index.toString()).parent().addClass("recording");
//     cl = "recording-active";
//   } else {
//     cl = "active";
//   }
//   $("#step"+index.toString()).parent().addClass(cl);
// }

// export function remove_from_history(index) {
//   $("#step"+index.toString()).parent().remove();
// }
