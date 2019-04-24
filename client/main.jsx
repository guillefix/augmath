import '../imports/startup/accounts-config.js';

import jQuery from 'jquery';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import store from '../imports/redux/store';
import App from '../imports/ui/App.js';

let globalTesting;
globalTesting = false
// globalTesting = true

if (globalTesting) import '../imports/tests'

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
    };
})(jQuery);

Meteor.startup(() => {

  // console.log(store.getState());

  ReactDOM.render(
    <Provider store={store}>
      <App />
    </Provider>, document.getElementById('app'));

  $(function() {
    $("#tools > div").accordion({
      header: "h4",
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

  if (globalTesting) {
    $("body").append('<div class="container-fluid"><div id="qunit"></div></div>')
  }

});
