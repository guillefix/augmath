import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.js';
import {prepare, select_node, create_events, remove_events} from "../../maths/functions";

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

Meteor.startup(() => {

  ReactDOM.render(<App />, document.getElementById('app'));

  //SELECTION control

  $(function() {
    $("#tools").accordion({
      collapsible: true,
      heightStyle: "content"
    });
    $( "#tabs" ).tabs();
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
});
