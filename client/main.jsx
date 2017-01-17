import '../imports/startup/accounts-config.js';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import store from '../imports/redux/store';
import App from '../imports/ui/App.js';

import jQuery from 'jquery';

// import {convertMathML} from 'mathml-to-asciimath';
//
// import Algebrite from 'algebrite';

// import '../imports/tests'

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

  // console.log(store.getState());

  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>, document.getElementById('app'));

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

});

//Old

// //RECORD/PLAY control
// $("#recording").on("click", function () {
//   recording = document.getElementById("recording").checked;
//   if (recording) {
//     math_str_rec = [math_str[current_index]];
//     manipulation_rec.unshift({});
//     selected_nodes_id_rec.unshift([]);
//     // active_in_history(current_index);
//   }
// });
// $("#play").on("click", function () {
//   playing = true;
//   document.getElementById("recording").checked = false;
//   recording = document.getElementById("recording").checked;
//   recording_index = 0;
//   if (math_str.length === 0 && math_str_rec.length !== 0) {math_str = math_str_rec;}
//   init_index = math_str.length-math_str_rec.length;
//   // select_in_history(init_index);
//   recording_index++; //recording_index will always be one ahead of the current math_str displayed as that is the appropriate manipulation to apply.
// });
// $("#next_step").on("click", function () {
//   if (recording_index>selected_nodes_id_rec.length-1) {return;}
//   selected_nodes = [];
//   $selected = $();
//   var ids = selected_nodes_id_rec[recording_index];
//   for (i=0; i<ids.length; i++) {
//     var selected_node = math_root.first(function (node) {
//           return node.model.id === ids[i];
//       });
//     selected_nodes.push(selected_node);
//     selected_node.selected = true;
//     $selected = $selected.add(selected_node.model.obj);
//
//   }
//   selected_text = "";
//   math_root.walk(function (node) {
//     if (node.selected) {selected_text += node.text;}
//   });
//   equals_position = $equals.offset();
//   selected_width = tot_width($selected, true);
//   selected_position = $selected.offset();
//   $selected.toggleClass("selected");
//   switch (manipulation_rec[recording_index].manipulation) {
//       case 1:
//         change_side();
//         break;
//       case 2:
//         move_up();
//         break;
//       case 3:
//         eval();
//         break;
//       case 4:
//         move_right();
//         break;
//       case 5:
//         move_left();
//         break;
//       case 6:
//         move_down();
//         break;
//       case 7:
//         add_both_sides(manipulation_rec[recording_index].arg);
//         break;
//       case 8:
//         split_all();
//         break;
//       case 9:
//         unbracket();
//         break;
//       case 10:
//         replace(manipulation_rec[recording_index].arg)
//         break;
//       case 11:
//         remove();
//         break;
//       case 12:
//         distribute_in();
//         break;
//       case 13:
//         pull();
//         break;
//       case 14:
//         operate();
//         break;
//       case 15:
//         flip_equation();
//         break;
//       default:
//         break;
//   }
// });
//
// $("#prev_step").on("click", function () {//FIX THIS
//   if (!(recording_index>0)) {return;}
//   recording_index--;
//   // select_in_history(init_index+recording_index);
// });
//
// $("#make_json").on("click", function () {
//   console.log("selected_nodes_id_rec");
//   console.log(JSON.stringify(selected_nodes_id_rec));
//   console.log("math_str_rec");
//   console.log(JSON.stringify(math_str_rec));
//   console.log("manipulation_rec");
//   console.log(JSON.stringify(manipulation_rec));
// });
//
// function add_to_manip_rec(integer, argument) {
//   manipulation_rec.push({manipulation:integer, arg:argument});
// }
