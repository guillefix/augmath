import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.js';
import {prepare, remove_events, create_events, select_node} from "../../maths/functions";

import jQuery from 'jquery';
import katex from 'katex';
import TreeModel from '../../TreeModel-min.js';
import {symbols} from '../../maths/symbols.js';
import {active_in_history, select_in_history, add_to_history, remove_from_history} from './history';
// import Algebrite from 'algebrite';

// import './tests'

/*
                      __  __       _   _
     /\              |  \/  |     | | | |
    /  \  _   _  __ _| \  / | __ _| |_| |__
   / /\ \| | | |/ _` | |\/| |/ _` | __| '_ \
  / ____ \ |_| | (_| | |  | | (_| | |_| | | |
 /_/    \_\__,_|\__, |_|  |_|\__,_|\__|_| |_|
                 __/ |
                |___/
Augmenting how we *do* maths using Computers
*/


Meteor.startup(() => {

  ReactDOM.render(<App />, document.getElementById('app'));

  //jQuery plugins
  (function($) {
      $.fn.closest_n_descendents = function(filter, n) {
          var $found = $(),
              $currentSet = this; // Current place
          while ($currentSet.length) {
              $found = $currentSet.filter(filter);
              if ($found.length === n) break;  // At least one match: break loop
              // Get all children of the current set
              $currentSet = $currentSet.children();
          }
          return $found; // Return first match of the collection
      }
  })(jQuery);

  console.log("test");

  window.math_str_el = $("#MathInput input");
  let MQ = MathQuill.getInterface(2);
  window.mathquill = MQ.MathField($('#mathquill')[0]);

  $("#mathquill").on("keyup",function (e) {
      if (e.keyCode == 13) {
          prepare(mathquill.latex().replace(/[^\x00-\x7F]/g, "")
            .replace(/\^([a-z0-9])/g, "^{$1}")
            .replace(/\\left/g, "")
            .replace(/\\right/g, ""));
      }
  });
  $("#mathquill").on("focusout", function () {math_str_el.val(mathquill.latex().replace(/[^\x00-\x7F]/g, "")
    .replace(/\^([a-z0-9])/g, "^{$1}")
    .replace(/\\left/g, "")
      .replace(/\\right/g, ""))});
  math_str_el.on("change", function () {mathquill.latex(math_str_el.get()[0].value)});
  math_str_el.hide();
  $("#show_latex").on("click", function () {math_str_el.toggle(); math_str_el.is(":visible") ? $("#show_latex").text("Hide LaTeX") : $("#show_latex").text("Show LaTeX")});
  math_str_el.keyup(function (e) {
      if (e.keyCode == 13) {
          console.log(math_str_el.get()[0].value)
          prepare(math_str_el.get()[0].value);
          console.log(math_str_el.get()[0].value)
      }
  });

  //SELECTION control

  $(function() {
    $("#tools").accordion({
      collapsible: true,
      heightStyle: "content"
    });
    $( "#tabs" ).tabs();
  });

  var manip_el = $("#manip"), depth_el = $("#depth");
  manip_el.on("change", function () {
    remove_events(manip, depth);
    manip = this.value;
    create_events(manip, depth);
    if (manip === "factor") {
      depth_el[0].value = "2";
      remove_events(manip, depth);
      depth = parseInt(depth_el[0].value, 10);
      create_events(manip, depth);
    } else if (manip === "power"
      || manip === "available"
      || manip === "chosen"
      || manip === "numerator"
      || manip === "denominator"
      || manip === "sup"
      || manip === "sub") {
      depth_el[0].value = "3";
      remove_events(manip, depth);
      depth = parseInt(depth_el[0].value, 10);
      create_events(manip, depth);
    } else if (manip === "term") {
      depth_el[0].value = "1";
      remove_events(manip, depth);
      depth = parseInt(depth_el[0].value, 10);
      create_events(manip, depth);
    }
  });
  depth_el.on("change", function () {remove_events(manip, depth); depth = parseInt(this.value, 10); create_events(manip, depth);});
  $("#multi_select").on("click", function () {multi_select = document.getElementById("multi_select").checked;});
  $("#replace_ind").on("click", function () {replace_ind = document.getElementById("replace_ind").checked;});
  $("#var_select").on("click", function () {var_select = document.getElementById("var_select").checked; if (var_select) {multi_select = false;}});
  $(document).on( "keyup", function (e) { //right
      if (e.keyCode == 39) {
        if (selected_nodes && selected_nodes.length > 0) {
          var index = parseInt(selected_nodes[0].model.id.split("/")[selected_nodes[0].model.id.split("/").length-1]); //no +1 because the tree index is 1 based not 0 based
            var new_node = selected_nodes[0].parent.children[index] || undefined;
            if (new_node) {
              if (new_node.type !== selected_nodes[0].type) {
                remove_events(manip, depth);
                manip = new_node.type;
                manip_el.val(manip);
                create_events(manip, depth);
              }
              select_node(new_node);
            }
          }
      }
  });
  $(document).on( "keyup", function (e) { //left
      if (e.keyCode == 37) {
        if (selected_nodes && selected_nodes.length > 0) {
          var index = parseInt(selected_nodes[0].model.id.split("/")[selected_nodes[0].model.id.split("/").length-1])-2;
            var new_node = selected_nodes[0].parent.children[index] || undefined;
            if (new_node) {
              if (new_node.type !== selected_nodes[0].type) {
                remove_events(manip, depth);
                manip = new_node.type;
                manip_el.val(manip);
                create_events(manip, depth);
              }
              select_node(new_node);
            }
          }
      }
  });
  $(document).on( "keyup", function (e) { //down
      if (e.keyCode == 40) {
        if (selected_nodes && selected_nodes.length > 0) {
          if (selected_nodes[0].children.length > 0) {
            remove_events(manip, depth);
            var new_node = selected_nodes[0].children[0];
            manip = new_node.type;
            manip_el.val(manip);
            depth++;
            depth_el.val(depth);
            create_events(manip, depth);
            select_node(new_node);
          }
        }
      }
  });
  $(document).on( "keyup", function (e) { //up
      if (e.keyCode == 38) {
        if (selected_nodes && selected_nodes.length > 0) {
          if (selected_nodes[0].parent !== math_root) {
            var new_node = selected_nodes[0].parent;
            remove_events(manip, depth);
            manip = new_node.type;
            manip_el.val(manip);
            depth--;
            depth_el.val(depth);
          create_events(manip, depth);
            select_node(new_node);
          }
        }
      }
  });

  $(document).on( "keyup", function (e) { //ctrl+m for multiselect
      if (e.keyCode == 77 && e.ctrlKey) {
        $("#multi_select").prop("checked", !multi_select);
        multi_select = document.getElementById("multi_select").checked;
      }
  });

  //to prevent event bubbling when in input
  $('input').on('keyup', function (e) {
      if(!e.ctrlKey && !e.altKey && !e.metaKey) {
          if(e.keyCode==37 || e.keyCode==39 || e.keyCode==40 || e.keyCode==38) {
              e.stopPropagation();
          }
      }
      return true;
  });

  //RECORD/PLAY control
  $("#recording").on("click", function () {
    recording = document.getElementById("recording").checked;
    if (recording) {
      math_str_rec = [math_str[current_index]];
      manipulation_rec.unshift({});
      selected_nodes_id_rec.unshift([]);
      active_in_history(current_index);
    }
  });
  $("#play").on("click", function () {
    playing = true;
    document.getElementById("recording").checked = false;
    recording = document.getElementById("recording").checked;
    recording_index = 0;
    if (math_str.length === 0 && math_str_rec.length !== 0) {math_str = math_str_rec;}
    init_index = math_str.length-math_str_rec.length;
    select_in_history(init_index);
    recording_index++; //recording_index will always be one ahead of the current math_str displayed as that is the appropriate manipulation to apply.
  });
  $("#next_step").on("click", function () {
    if (recording_index>selected_nodes_id_rec.length-1) {return;}
    selected_nodes = [];
    $selected = $();
    var ids = selected_nodes_id_rec[recording_index];
    for (i=0; i<ids.length; i++) {
      var selected_node = math_root.first(function (node) {
            return node.model.id === ids[i];
        });
      selected_nodes.push(selected_node);
      selected_node.selected = true;
      $selected = $selected.add(selected_node.model.obj);

    }
    selected_text = "";
    math_root.walk(function (node) {
      if (node.selected) {selected_text += node.text;}
    });
    equals_position = $equals.offset();
    selected_width = tot_width($selected, true);
    selected_position = $selected.offset();
    $selected.toggleClass("selected");
    switch (manipulation_rec[recording_index].manipulation) {
        case 1:
          change_side();
          break;
        case 2:
          move_up();
          break;
        case 3:
          eval();
          break;
        case 4:
          move_right();
          break;
        case 5:
          move_left();
          break;
        case 6:
          move_down();
          break;
        case 7:
          add_both_sides(manipulation_rec[recording_index].arg);
          break;
        case 8:
          split_all();
          break;
        case 9:
          unbracket();
          break;
        case 10:
          replace(manipulation_rec[recording_index].arg)
          break;
        case 11:
          remove();
          break;
        case 12:
          distribute_in();
          break;
        case 13:
          pull();
          break;
        case 14:
          operate();
          break;
        case 15:
          flip_equation();
          break;
        default:
          break;
    }
  });

  $("#prev_step").on("click", function () {//FIX THIS
    if (!(recording_index>0)) {return;}
    recording_index--;
    select_in_history(init_index+recording_index);
  });

  $("#make_json").on("click", function () {
    console.log("selected_nodes_id_rec");
    console.log(JSON.stringify(selected_nodes_id_rec));
    console.log("math_str_rec");
    console.log(JSON.stringify(math_str_rec));
    console.log("manipulation_rec");
    console.log(JSON.stringify(manipulation_rec));
  });

  function add_to_manip_rec(integer, argument) {
    manipulation_rec.push({manipulation:integer, arg:argument});
  }

  function add_equation(eq) {
    var eq_number = equations.push(eq)-1;
    var eq_html = '<a class="list-group-item" onmouseover="$(this).stop().children(\'.eq_buttons\').show()" onmouseout="$(this).stop().children(\'.eq_buttons\').hide()"><p id="'+'eq'+eq_number.toString()+'" class="list-group-item">...</p><div class="eq_buttons"><br><button type="button" class="btn btn-default" onclick="prepare(equations['+eq_number.toString()+'])"><span class="glyphicon glyphicon-chevron-left"></span></button><button type="button" class="btn btn-default" onclick="$(this).parent().parent().remove()"><span class="glyphicon glyphicon-remove"></span></button>&nbsp;Latex:<input size="20" value="'+equations[+eq_number.toString()]+'"/></div></a>';
    $("#eq_list").prepend(eq_html);
    var eq_el = document.getElementById('eq'+eq_number.toString()); katex.render(equations[eq_number], eq_el, { displayMode: true });
  }

  $("#add_eq").keyup(function (e) {
      if (e.keyCode == 13) {
        var eq = $("#add_eq").get()[0].value;
          add_equation(eq);
      }
  });
  $("#keep").on("click", function () {
    var eq = math_str_el.get()[0].value;
      add_equation(eq);
  });

  //initial render
  var initial_math_str = "\\frac{v^{2}}{r}=\\frac{GMm}{r^{2}}";
  prepare(initial_math_str)
});
