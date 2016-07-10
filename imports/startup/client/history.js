import katex from 'katex';
import {prepare, remove_events, create_events, select_node} from "../../maths/functions";


//HISTORY

export function select_in_history(index) {
  if (recording) {
    recording_index-=(math_str.length-1-index);
    math_str_rec = math_str_rec.slice(0, recording_index-1);
    manipulation_rec = manipulation_rec.slice(0, recording_index-1);
    selected_nodes_id_rec = selected_nodes_id_rec.slice(0, recording_index-1);
    for (current_index; current_index > index; current_index--) {
      $("#step"+current_index.toString()).parent().removeClass("recording-active");
      $("#step"+current_index.toString()).parent().removeClass("recording");
    }
  } else {
    current_index=index;
  }
  active_in_history(index);
  prepare(math_str[index]);
}
export function add_to_history(index, place) {
  var his_html = '<a class="list-group-item" onmouseover="$(this).stop().children(\'.his_buttons\').show()" onmouseout="$(this).stop().children(\'.his_buttons\').hide()"><p id="'+'step'+index.toString()+'" class="list-group-item">...</p><div class="his_buttons"><br><button type="button" class="btn btn-default" onclick="select_in_history('+index.toString()+')"><span class="glyphicon glyphicon-chevron-left"></span></button>&nbsp;Latex:<input size="20" value="'+math_str[index.toString()]+'"/></div></a>';
  if (place>-1) {
    $("#history_list").children(":has(#step"+place+")").before(his_html);
  } else {
    $("#history_list").append(his_html);
  }
  var his_el = document.getElementById('step'+index.toString());
  katex.render(math_str[index], his_el, { displayMode: true });
  if (recording) {
    $(his_el).parent().addClass("recording");
  }
}
export function active_in_history(index) {
  $("#history_list").children().removeClass("active");
  $("#history_list").children().removeClass("recording-active");
  var cl;
  if (recording) {
    $("#step"+index.toString()).parent().addClass("recording");
    cl = "recording-active";
  } else {
    cl = "active";
  }
  $("#step"+index.toString()).parent().addClass(cl);
}
export function remove_from_history(index) {
  $("#step"+index.toString()).parent().remove();
}

//undo
export function undo() {
  if (current_index > 0) {
    if (recording_index > 0) {recording_index--;}
    select_in_history(current_index-1);
  }
}

//redo
export function redo() {
  if (current_index < math_str.length-1) {
    if (recording_index < math_str_rec.length-1) {recording_index++;}
    select_in_history(current_index+1);
  }
}
