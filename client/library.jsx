import jQuery from 'jquery';

var $ = require('jquery');
window.jQuery = $;
window.$ = $;

import "jquery-ui"
var verdict = require('verdict.js');
// import "./lib/katex.min.js"
// import "./lib/qunit-2.0.0.js"
// import 'qunitjs'


import React from 'react';
import ReactDOM from 'react-dom';
// import AugMath from '../imports/ui/AugMath.js';

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


// module.exports = {
//   AugMath
// }

$( document ).ready(() => {
  AugMath.AugMathify(document.getElementById("app"),0,"x^{2}+a=0");

  window.AugMath = AugMath
  // window.jQuery = jQuery
  $("body").append('<div id="qunit"></div>')



})

// import "../imports/tests.js"
