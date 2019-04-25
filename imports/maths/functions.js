import jQuery from 'jquery';
import katex from '../katex.min.js';
// import TreeModel from '../TreeModel-min.js';
import {symbols} from './symbols.js';
import Bro from 'brototype';
import Algebrite from 'algebrite';
import algebra from 'algebra.js'
import math from 'mathjs'
import {LaTeXtoMathML} from 'latextomathml'

import TreeModel from '../TreeModel-min.js';

let convertMathML = require('mathml-to-asciimath');

//USEFUL FUNCTIONS

//remove and create events handlers that happen when user clicks a manipulative
// export function remove_events(type, depth) {
//   // console.log("test");
//   var $selectable = $();
//   math_root.walk(function (node) {
//     if (node.model.id !== "0" && node.type === type && getIndicesOf("/", node.model.id).length === depth) {
//       $selectable = $selectable.add(node.model.obj);
//       }
//   });
//   $selectable.off();
// }


//get all the indices of searchStr within str
export function getIndicesOf(searchStr, str) { //should fix the getIndicesOf to work with regexes
    var startIndex = 0, searchStrLen = searchStr.length;
    var index, indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

//ignore matches due to LaTeX sintax
export function cleanIndices(arr, str) {
  var indices = getIndicesOf("\\frac", str); //should fix the getIndicesOf to work with regexes
  indices = indices.concat(getIndicesOf("\\sqrt", str)); //should add all of the ones in symbols.js
  indices = indices.concat(getIndicesOf("\\text", str));
  indices = indices.concat(getIndicesOf("\\int", str));
  indices = indices.concat(getIndicesOf("\\hat", str));
  indices = indices.concat(getIndicesOf("\\pi", str));
  for (var i=0; i < arr.length; i++) {
    for (var j=0; j < indices.length; j++) {
      if (arr[i] >= indices[j] && arr[i] <= indices[j]+4) {
        arr.splice(i, 1);
      }
    }
  }
  return arr;
}

//convert a string from LaTeX to the format used by Algebrite. TODO: THIS SHOULD BE IMPROVED A LOT. OR JUST STORE AN ASCIIMATH COPY OF MATH_STR...
export function latex_to_ascii(str) {
  // str = str.replace(/\\sqrt\{([-a-z0-9]+)\}/g, "sqrt($1)");
  // str = str.replace(/\}\{/g, ")/(").replace(/\\frac{/g, "(").replace(/\}/g, ")");
  // str = str.split("").join("*");
  // str = str.replace(/\*?\+\*?/g, "+")
  //   .replace(/[ \*]+/g, "*")
  //   .replace(/([0-9])\*([0-9])/g, "$1$2")
  //   .replace(/\\cdot/g, "*")
  //   .replace(/\*?-\*?/g, "-")
  //   .replace(/\*?=\*?/g, "=")
  //   .replace(/\*?\(\*?/g, "(")
  //   .replace(/\*?\)\*?/g, ")")
  //   .replace(/\*?\/\*?/g, "/")
  //   .replace(/\(\+/g, "(")
  //   .replace(/\*\^\*\{\*(\-?[0-9]+)\)/g, "^($1)")
  //   .replace(/\^\*\{\*(\-?[0-9]+)\)/g, "^($1)")
  //   .replace(/\*\^\*\{(\-?[0-9]+)\)/g, "^($1)");
  str = str.replace(/\\cdot /g, "") //latextomath (or the other one, doesn't work with \\cdot...)
  console.log(str)
  str = convertMathML(LaTeXtoMathML(str)).replace(/ \(/g,"(");
  str = str.replace(/([0-9]) ([0-9])/g, "$1$2")
  str = str.replace(/⟨ /g, "langle");
  str = str.replace(/ ⟩/g, "rangle");
  //needed to edit mo-helpers.js from mathml-to-asciimath package, to make it work.
  // console.log(str);
  return str;
}

//convert a string in Algebrite ascii format to latex

export function ascii_to_latex(str) {
  // var exp = new algebra.Expression(str);
  // console.log(exp);
  // let result = exp.toTex()
  //   .replace(/\^([a-z0-9])/g, "^{$1}")
  //   .replace(/\^\(([-a-z0-9]+)\)/g, "^{$1}")
  //   .replace(/([a-z0-9])\/([a-z0-9])/g,"\\frac{$1}{$2}");
  // if (str.slice(0,1) === "-") result = "-" + result;
  // else if (str.slice(0,1) === "+") result = "+" + result;

  str = math.parse(str).toTex();
  str = str.replace(/\{([a-z0-9\(\) ]+)\}\^/g, "$1^")
  str = str.replace(/\\left/g, "")
  str = str.replace(/\\right/g, "")
  str = str.replace(/~/g, "")
  str = str.replace(/^ /, "")
  str = str.replace(/ $/, "")
  str = str.replace(/\^\{\(([\-a-z0-9]+)\)\}/, "^{$1}")
  return str;
}

//evaluate an expression with Algebrite
export function eval_expression(expression) {
  // console.log("eval_expression", expression);
  var new_term;
  expression = latex_to_ascii(expression) //doesn't work with some expressions, as usual
  console.log("expression", expression);
  if (expression.search(/[a-z\(\)]/) > -1) {
    var new_str = Algebrite.simplify(expression).toString();
    console.log("new_str", new_str);
    new_term = ascii_to_latex(new_str)
              .replace(/langle/g, "\\langle ")
              .replace(/rangle/g, "\\rangle ")
              .replace(/\{\\mathrm\{([a-z]+)\}\}/g, "$1");
              // .replace(/^( *)(\+)+/g, "");
    // console.log("new_term", new_term);

  } else {
    new_term = ("+" + math.eval(expression).toString());
              // .replace(/^( *)(\+)+/g, "");
  }
  console.log(new_term);
  return new_term;
}

//Rationalize expression

export function rationalize(str) {
  var ascii_str = latex_to_ascii(str);
  ascii_str = ascii_str.replace(/e/g, "ee"); //becase Algebrite annoyingly thinks all es are exponentials..
  var new_exp = Algebrite.rationalize(ascii_str);
  var new_str = "\\frac{" + Algebrite.numerator(new_exp).toString() + "}{" + Algebrite.denominator(new_exp).toString() + "}";
  new_str = new_str.replace(/ee/g, "e").replace(/ /g, "");
  return ascii_to_latex(new_str);
}

//get the total width of a set of elements
export function tot_width(obj, bool, include_op) {
  var width=0;
  obj.each(function(i) {
    width += $(this).outerWidth(bool); //bool is includeMargin
  })
  if (include_op === true) {
    if (obj.first().text() !== "+" && obj.first().text() !== "−") {
      width += $(".base").find(".mbin").first().outerWidth(bool);
    }
  }
  return width;
}

//__Mathematical and notational functions__

//change sign of some nodes
export function change_sign(nodes) {
  // console.log("changing side");
  var text="";
  for (let i=0; i<nodes.length; i++) {
    if (nodes[i].text.slice(0, 1) === "+") {
      text += nodes[i].text.replace("+", "-");
    } else if (nodes[i].text.slice(0, 1) === "-") {
      text += nodes[i].text.replace("-", "+");
    } else {
      text += "-" + nodes[i].text;
    }
  }
  return text.replace(/^\+/, "");
}

//change sign of exponent of some nodes
export function exponentiate(nodes, overall, power, distInFrac) {
  // console.log("exponentiating", power, nodes)
  if (typeof distInFrac === 'undefined') { distInFrac = false; }
  var new_text="";
  for (var i=0; i<nodes.length; i++) {
    if (nodes[i].type !== "factor") { throw "Called exponentiate with something that isn't a factor" }
    switch (nodes[i].type2) {
      case "exp":
      case "group_exp":
        // console.log("called exponentiate with exp or group_exp", nodes[i]);
        var new_pow;
        if (power === "-1") { //if power is -1 then change sign of power
          new_pow = change_sign(nodes[i].children[1].children);
        }
        else {
          // console.log("power", power, "nodes[i].children[1]", nodes[i].children[1].text);
          new_pow = math.eval(power + "*" + nodes[i].children[1].text);
        }
        if (new_pow === "1") {
          new_pow = "";
        }
        if (nodes[i].type2 === "exp") {
          new_text+= (overall ? nodes[i].text : nodes[i].children[0].text + "^{" + new_pow + "}");
        } else if (nodes[i].type2 === "group_exp") {
          new_text+= (overall ? nodes[i].text : add_brackets(nodes[i].children[0].text) + "^{" + new_pow + "}");
        }
        break;
      case "frac":
        var new_frac_text;
        if (distInFrac) {
          new_frac_text = "\\frac{"+exponentiate(nodes[i].children[0].children[0].children, false, power)+"}{"+exponentiate(nodes[i].children[1].children[0].children, false, power)+"}";
        }
        else {
          new_frac_text = add_brackets(nodes[i].text) + "^{"+power+"}";
        }
        new_text+= (overall ? nodes[i].text : new_frac_text);
        break;
      case "sqrt":
        new_text+=nodes[i].text.slice(6, -1) + (overall ? "" : "^{" + power + "\\frac{1}{2}}");
        break;
      default:
        new_text+=nodes[i].text + (overall ? "" : "^{" + power + "}");
    }
  }
  return overall ? add_brackets(new_text) + "^{" + power + "}" : new_text;
}

//TODO: Use exponentiate to extend features of changin side for power

export function multiply(nodes) {
  // console.log(nodes);
  let text = "";
  let signs = "";
  for (var i=0; i<nodes.length; i++) {
    // console.log(text, nodes[i]);
    // console.log("hi");
    if ((nodes[i].type === "numerator" || nodes[i].type === "denominator" || nodes[i].type === "body") && nodes[i].children.length > 1) {
      text += "(" + nodes[i].text + ")";
    } else if (nodes[i].text.search(/[+-]/) === 0) {
      signs += nodes[i].text.slice(0, 1);
      let no_sign = nodes[i].text.slice(1, nodes[i].text.length);
      // console.log(text, no_sign);
      if (/^[0-9]+.*/.test(no_sign) && /.*[0-9]+$/.test(text) ) {
        text += "\\cdot " + no_sign;
      } else {
        text += no_sign;
      }
    } else if (nodes[i].text === "1" && nodes.length > 1) {
      text += "";
    } else if (/^[0-9]+.*/.test(nodes[i].text) && /.*[0-9]+$/.test(text) ){
      text += "\\cdot " + nodes[i].text;
    } else {
      text += nodes[i].text;
    }
  }
  let sign = signs.replace(/\+/g, '--').replace(/(--)+-/g, '-').replace(/--/g, '+');
  let result = sign + text
  return result;
}

//flip fraction
export function flip_fraction(nodes) {
  if (!Array.isArray(nodes)) nodes = [nodes];
  console.log("flipping_fracs", nodes)
  var new_text="";
  for (var i = 0; i < nodes.length; i++) {
    // if (!(nodes[i].type === "factor" || nodes[i].type === "body")) { throw "Called flip_fraction with something that isn't a factor" }
    switch (nodes[i].type2) {
      case "frac":
        if (nodes[i].children[0].text === "1") {
          new_text += nodes[i].children[1].text;
        } else {
          new_text += "\\frac{" + nodes[i].children[1].text + "}{" + nodes[i].children[0].text + "}";
        }
        break;
      default:
        console.log("kekekekek");
        new_text += "\\frac{1}{" + nodes[i].text + "}";
    }
  }
  return new_text;
}

export function add_brackets(str) {
  if (str.charAt(0) === "(" && str.charAt(str.length-1) === ")") {
    if (str.slice(1,-1).indexOf(")") > str.slice(1,-1).indexOf("(")) {
        return str
    }
  } else {
    return "(" + str + ")";
  }
}


//Check properties

//check if all nodes are of a given type or type 2 (if two=1)
export function are_of_type(nodes, type, two) {
  var two = two || 0;
  var result = true;
    for (var i=0; i<nodes.length; i++) {
      if (Bro(nodes[i]).iCanHaz("type"+"2".repeat(two)) !== type) {result = false}
    }
  return result;
}

export function any_of_type(nodes,type, two) {
  var two = two || 0;
  var result = false;
    for (var i=0; i<nodes.length; i++) {
      if (Bro(nodes[i]).iCanHaz("type"+"2".repeat(two)) === type) {result = true}
    }
  return result;
}

//check if all nodes share some ancestor
export function have_same_ancestors(nodes, depth) {
  var result = true;
  var ancestor = "parent"+".parent".repeat(depth-1);
  for (var i=0; i<nodes.length-1; i++) {
    if (Bro(nodes[i]).iCanHaz(ancestor) !== Bro(nodes[i+1]).iCanHaz(ancestor)) {result = false}
  }
  return result;
}

//check if all nodes are of same type or type 2 (if two=1)
export function have_same_type(nodes, two) {
  var two = two || 0;
  var type = "type"+"2".repeat(two);
  var result=true;
  for (var i=0; i<nodes.length-1; i++) {//making sure all elemnts are of the same type
    if (Bro(nodes[i]).iCanHaz(type) !== Bro(nodes[i+1]).iCanHaz(type)) {result = false}
  }
  return result;
}

export function have_same_text(nodes) {
  var result = true;
  for (var i=0; i<nodes.length-1; i++) {//making sure all elemnts have the same text
    if (nodes[i].text !== nodes[i+1].text) {result = false}
  }
  return result;
}

//check if terms have single factor
export function have_single_factor(nodes) {
  var result = true;
  for (var i=0; i<nodes.length; i++) {//making sure all elemnts have one factor
    var child_cnt = 1;
    if (nodes[i].children[0] !== undefined) {
      if (nodes[i].children[0].type2 === "op") {
        child_cnt++;
      }
    }
    if (nodes[i].children.length !== child_cnt) {result = false}
  }
  return result;
}

//check if all term nodes have the same denominator
export function have_same_denom(nodes) {
  var result = true;
  for (var i=0; i<nodes.length-1; i++) {
    var index1 = nodes[i].children.length-1;
    var index2 = nodes[i+1].children.length-1;
    var facttype1 = Bro(nodes[i]).iCanHaz("children."+index1.toString()+".type2");
    var facttype2 = Bro(nodes[i+1]).iCanHaz("children."+index2.toString()+".type2");
    if (facttype1 === "frac" && facttype1 === "frac") {
      if (nodes[i].children[index1].children[1].text !== nodes[i+1].children[index2].children[1].text) {result = false;}
    }
  }
  return result && have_single_factor(nodes);
}

//check if all terms are the same (ignoring whether sign is present)
export function are_same_terms(nodes) {
  var result = true;
  for (var i=0; i<nodes.length-1; i++) {
    var term_text1 = nodes[i].text,
        term_text2 = nodes[i+1].text;
    if (nodes[i].type === "term" && nodes[i+1].type === "term") {
      if (Bro(nodes[i]).iCanHaz("children.0.type2") === "op") {
        term_text1 = term_text1.slice(1);
      }
      if (Bro(nodes[i+1]).iCanHaz("children.0.type2") === "op") {
        term_text2 = term_text2.slice(1);
      }
    }

    if (term_text1 !== term_text2) {result = false}
  }
  return result;
}

//check if all nodes coincide in some custom property

export function have_same_prop(nodes, prop, ignore_undefined = false) {
  let result = true;
  if (ignore_undefined) {
    for (var i = 0; i < nodes.length-1; i++) {
      if (Bro(nodes[i]).iCanHaz(prop) !== Bro(nodes[i+1]).iCanHaz(prop)) {
        result = false;
      }
    }
  } else {
    for (var i = 0; i < nodes.length-1; i++) {
      if (Bro(nodes[i]).iCanHaz(prop) === undefined || Bro(nodes[i]).iCanHaz(prop) !== Bro(nodes[i+1]).iCanHaz(prop)) {
        result = false;
      }
    }
  }
  return result;
}

export function have_same_log_base(nodes) {
  let result = true;
  for (var i = 0; i < nodes.length-1; i++) {
    if (typeof nodes[i] === "undefined" || nodes[i].type2 !== "log" || (nodes[i].children.length === 2 && nodes[i+1].children.length === 2 && nodes[i].children[0].text !== nodes[i+1].children[0].text) || (nodes[i].children.length !== nodes[i+1].children.length)) {
      result = false;
    }
  }
  return result;
}

// function equiv_nodes(node1, node2) {
//
// }

//get previous node
export function get_prev(math_root, nodes) {
  if (!Array.isArray(nodes)) {nodes = [nodes];}
  var node = nodes[0];
  var array = node.model.id.split("/");
  array[array.length-1] = (parseInt(array[array.length-1])-1).toString();
  var new_id = array.join("/");
  var chosen_node;
  math_root.walk(function (node) {
    if (node.model.id === new_id) {chosen_node = node; return false;}
  });
  return chosen_node;
}

//get next node
export function get_next(math_root, nodes) {
  if (!Array.isArray(nodes)) {nodes = [nodes];}
  var node = nodes[nodes.length-1];
  var array = node.model.id.split("/");
  array[array.length-1] = (parseInt(array[array.length-1])+1).toString();
  var new_id = array.join("/");
  var chosen_node;
  math_root.walk(function (node) {
    if (node.model.id === new_id) {chosen_node = node; return false;}
  });
  return chosen_node;
}

//get all next nodes
export function get_all_next(math_root, node) {
  var next_nodes = [];
  var array = node.model.id.split("/");
  var init = parseInt(array[array.length-1], 10);
  var max = node.parent.children.length;
  for (var i = init+1; i <= max; i++) {
    array[array.length-1] = i;
    var new_id = array.join("/");
    math_root.walk(function (node) {
      if (node.model.id === new_id) {next_nodes.push(node); return false;}
    });
  };
  return next_nodes;
}

//get all previous nodes
export function get_all_prev(math_root, node) {
  var prev_nodes = [];
  var array = node.model.id.split("/");
  var init = parseInt(array[array.length-1], 10);
  // var max = node.parent.children.length;
  for (var i = init-1; i >= 0; i--) {
    array[array.length-1] = i;
    var new_id = array.join("/");
    math_root.walk(function (node) {
      if (node.model.id === new_id) {prev_nodes.push(node); return false;}
    });
  };
  return prev_nodes;
}

//get related ids
export function get_prev_id(id) {
  let arr = id.split("/");
  arr[arr.length-1] = (parseInt(arr[arr.length-1])-1).toString();
  return arr.join("/");
}

export function get_next_id(id) {
  let arr = id.split("/");
  arr[arr.length-1] = (parseInt(arr[arr.length-1])+1).toString();
  return arr.join("/");
}

export function get_child_id(id) {
  let arr = id.split("/");
  arr = [...arr, "1"];
  return arr.join("/");
}

export function get_parent_id(id) {
  let arr = id.split("/");
  return arr.slice(0,-1).join("/");
}

//does it have a visible sign?
export function has_op(obj) {
  if (obj.first().text() === "+" || obj.first().text() === "−") {
    return true;
  } else {
    return false;
  }
}

// TREE -> LATEX. Create a LaTeX string from a tree, and substitute the text of node_arr with that contained in str_arr. Useful for manipulations
export function parse_mtstr(root, node_arr, str_arr) {
  var poly_str = "";
  var i = 0, j = 0;
  //childs of the root node are terms
  while (i < root.children.length) {
    var term_text="";
    var child = root.children[i];
    let node_selected = false;
    for (var k=0; k<node_arr.length; k++) {
      if (child.model.id === node_arr[k].model.id) {
        node_selected = true;
        term_text = str_arr[k];
        break;
      }
    }
    if (node_selected) {i++; poly_str+=term_text; continue;}
    j = 0;
    //grandchildren are factors
    while (j < child.children.length) {
      var factor_text="";
      var frac_text = [], exp_text = [], binom_text = [], diff_text = "", int_text = [];
      var grandchild = child.children[j];
      node_selected = false;
      for (var k=0; k<node_arr.length; k++) {
        if (grandchild.model.id === node_arr[k].model.id) {
          node_selected = true;
          factor_text = str_arr[k];
          break;
        }
      }
      if (node_selected) {j++; term_text+=factor_text; continue;}
      if (grandchild.type === "rel") {
        poly_str+=grandchild.text;
      } else if (grandchild.type2 === "op") {
        term_text+=grandchild.text;
      } else if (grandchild.type === "text") {
        term_text+="\\text{" + grandchild.text.replace(/[^\x00-\x7F]/g, " ") + "}"; //change strange whitespaces to standard whitespace
      } else {
        switch (grandchild.type2) {
          case "normal":
            factor_text+=grandchild.text;
            break;
          case "group":
            let openText = grandchild.openText;
            let closeText = grandchild.closeText;
            factor_text = openText + (openText[0]==="\\" ? " " : "") + parse_mtstr(grandchild, node_arr, str_arr) + closeText;
            break;
          case "diff":
          case "frac":
            frac_text[0] = parse_mtstr(grandchild.children[0], node_arr, str_arr);
            frac_text[1] = parse_mtstr(grandchild.children[1], node_arr, str_arr);
            for (var l=0; l<2; l++) {
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[l].model.id === node_arr[k].model.id) {
                  frac_text[l] = str_arr[k];
                  break;
                }
              }
            }
            factor_text = "\\frac{" + frac_text[0] + "}{" + frac_text[1] + "}";
            break;
          case "diff":
            diff_text = parse_mtstr(grandchild.children[0], node_arr, str_arr);
            for (var k=0; k<node_arr.length; k++) {
              if (grandchild.children[0].model.id === node_arr[k].model.id) {
                frac_text[0] = str_arr[k];
                break;
              }
            }
            factor_text = "\\frac{d}{d" + diff_text + "}"
            break;
          case "binom":
            binom_text[0] = parse_mtstr(grandchild.children[0], node_arr, str_arr);
            binom_text[1] = parse_mtstr(grandchild.children[1], node_arr, str_arr);
            for (var l=0; l<2; l++) {
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[l].model.id === node_arr[k].model.id) {
                  binom_text[l] = str_arr[k];
                  break;
                }
              }
            }
            factor_text = "\\binom{" + binom_text[0] + "}{" + binom_text[1] + "}"
            break;
          case "int":
            int_text[0] = parse_mtstr(grandchild.children[0], node_arr, str_arr);
            int_text[1] = parse_mtstr(grandchild.children[1], node_arr, str_arr);
            for (var l=0; l<2; l++) {
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[l].model.id === node_arr[k].model.id) {
                  int_text[l] = str_arr[k];
                  break;
                }
              }
            }
            factor_text = "\\int_{" + int_text[1] + "}^{" + int_text[0] + "}"
            break;
          case "sqrt":
            factor_text = "\\sqrt{" + parse_mtstr(grandchild, node_arr, str_arr) + "}";
            break;
          case "exp":
            exp_text[0] = parse_mtstr(grandchild.children[0], node_arr, str_arr);
            exp_text[1] = parse_mtstr(grandchild.children[1], node_arr, str_arr);
            for (var l=0; l<2; l++) {
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[l].model.id === node_arr[k].model.id) {
                  exp_text[l] = str_arr[k];
                  break;
                }
              }
            }
            factor_text = exp_text[0] + "^{" + exp_text[1] + "}";
            break;
          case "group_exp":
            openText = grandchild.openText;
            closeText = grandchild.closeText;
            exp_text[0] = parse_mtstr(grandchild.children[0], node_arr, str_arr);
            exp_text[1] = parse_mtstr(grandchild.children[1], node_arr, str_arr);
            for (var l=0; l<2; l++) {
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[l].model.id === node_arr[k].model.id) {
                  exp_text[l] = str_arr[k];
                  break;
                }
              }
            }
            factor_text = openText + exp_text[0] + closeText + "^{" + exp_text[1] + "}";
            break;
          case "subs":
            exp_text[0] = parse_mtstr(grandchild.children[0], node_arr, str_arr);
            exp_text[1] = parse_mtstr(grandchild.children[1], node_arr, str_arr);
            for (var l=0; l<2; l++) {
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[l].model.id === node_arr[k].model.id) {
                  exp_text[l] = str_arr[k];
                  break;
                }
              }
            }
            factor_text = exp_text[0] + "_{" + exp_text[1] + "}";
            break;
          case "subsexp":
            exp_text[0] = parse_mtstr(grandchild.children[0], node_arr, str_arr);
            exp_text[1] = parse_mtstr(grandchild.children[1], node_arr, str_arr);
            exp_text[2] = parse_mtstr(grandchild.children[2], node_arr, str_arr);
            for (var l=0; l<3; l++) {
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[l].model.id === node_arr[k].model.id) {
                  exp_text[l] = str_arr[k];
                  break;
                }
              }
            }
            factor_text = exp_text[0] + "_{" + exp_text[1] + "}" + "^{" + exp_text[2] + "}";
            break;
          case "log":
            let log_text = [];
            // console.log(grandchild);
            if (grandchild.children.length === 1) {
              log_text[0] = parse_mtstr(grandchild.children[0], node_arr, str_arr); //only body
            } else if (grandchild.children.length === 2) {
              log_text[1] = parse_mtstr(grandchild.children[0], node_arr, str_arr); //base
              log_text[0] = parse_mtstr(grandchild.children[1], node_arr, str_arr); //body
            }
            for (var l=0; l<log_text.length; l++) {
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[l].model.id === node_arr[k].model.id) {
                  log_text[l] = str_arr[k];
                  break;
                }
              }
            }
            let base_txt = "_{" + log_text[1] + "}"
            factor_text = "\\log" + base_txt.repeat(log_text.length-1) + "{" + log_text[0] + "}";
            break;
          case "matrix":
            let text = grandchild.text;
            for (var k=0; k<node_arr.length; k++) {
              if (grandchild.model.id === node_arr[k].model.id) {
                text = str_arr[k];
                break;
              }
            }
            factor_text = text;
            break;
          default:
            //this should mean it is a function with some special name, like sin, cos.
            if (grandchild.children.length === 1) {
              let arg_text = parse_mtstr(grandchild.children[0], node_arr, str_arr); //argument of fun
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[0].model.id === node_arr[k].model.id) {
                  arg_text = str_arr[k];
                  break;
                }
              }
              factor_text = "\\" + grandchild.type2 + "{" + arg_text + "}";
            }
            else if (grandchild.children.length === 2) {
              let low_lim_text = "";
              let up_lim_text = "";
              low_lim_text = parse_mtstr(grandchild.children[0], node_arr, str_arr); //lower_limit
              up_lim_text = parse_mtstr(grandchild.children[1], node_arr, str_arr); //upper_limit
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[0].model.id === node_arr[k].model.id) {
                  low_lim_text = str_arr[k];
                  break;
                } else if (grandchild.children[1].model.id === node_arr[k].model.id) {
                  up_lim_text = str_arr[k];
                  break;
                }
              }
              factor_text = "\\" + grandchild.type2 + "_{"+ low_lim_text + "}"  + "^{"+ up_lim_text + "}";
            } else if (grandchild.children.length === 3) {
              let low_lim_text = "";
              let up_lim_text = "";
              let arg_text = parse_mtstr(grandchild.children[0], node_arr, str_arr); //argument of fun
              low_lim_text = parse_mtstr(grandchild.children[1], node_arr, str_arr); //lower_limit
              up_lim_text = parse_mtstr(grandchild.children[2], node_arr, str_arr); //upper_limit
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[0].model.id === node_arr[k].model.id) {
                  arg_text = str_arr[k];
                  break;
                } else if (grandchild.children[1].model.id === node_arr[k].model.id) {
                  low_lim_text = str_arr[k];
                  break;
                } else if (grandchild.children[2].model.id === node_arr[k].model.id) {
                  up_lim_text = str_arr[k];
                  break;
                }
              }
              let arg_text2 = "{"+arg_text+"}";
              if (arg_text.length === 0) arg_text2 = "";
              factor_text = "\\" + grandchild.type2 + "_{"+ low_lim_text + "}"  + "^{"+ up_lim_text + "}" + arg_text2;
            }
            break;

        }
        term_text+=factor_text;
      }
      j++;
    };
    i++;
    poly_str+=term_text;
    //console.log(poly_str);
  };

  return poly_str;
}

//do some preparation to str_arr before calling parse_mtstr
export function replace_in_mtstr(root, nodes, str_arr) {
  // console.log("root", root);
  if (nodes.__proto__.length !== 0) { //if not an array
    nodes = [nodes];
  }
  if (typeof str_arr === "string") { //replace a bunch of nodes with a single text is interpreted as replacing the first and erasing the others (works well for sibling nodes..)
    var str = str_arr;
    str_arr = [];
    for (let i=0; i<nodes.length; i++) {
      if (i === 0) {str_arr.push(str);}
      else {str_arr.push("");}
    }
  }
  return parse_mtstr(root, nodes, str_arr);
}

//HTML -> TREE
//This creates a tree by going through the terms in an expression, and going through its factors. Factors that can contain whole expressions within them are then recursively analyzed in the same way.
//This is tied to the way KaTeX renders maths. A good thing would be to do this for MathML, as it's likely to be a standard in the future.
export function parse_poly(root, poly, parent_id, is_container) {
  let tree = new TreeModel();
  var poly_str = "", factor_text = "";
  var term_cnt = 0;
  var factor_cnt = 0;
  var i = 0;
  var factor_obj, factor, op, term_obj=$(), factor_id, term_id, inside, nom_str, denom_str, prev_factor_id, inside_text, base_obj, power_obj, base, power, child1, child2, close_group_text;
  var numerator, denominator;
  var term = tree.parse({id: parent_id.toString() + "/" + (term_cnt+1).toString()});
  term.text = "";
  term.type = "term";
  root.addChild(term);
  // console.log(poly);
  var things = is_container ? poly.children() : poly;
  //console.log(things, is_container);
  while (i < things.length) {
    var thing = things.filter(":eq("+i+")");
    // console.log(i,"thing", thing.text());
    factor_obj = thing;
    factor_id = parent_id.toString() + "/" + (term_cnt+1).toString() + "/" + (factor_cnt+1).toString();
    term_id = parent_id.toString() + "/" + (term_cnt+1).toString();
    //GROUPED elements by brackets
    if (thing.is(".mopen"))
    {
      do {
        factor_obj = factor_obj.add(factor_obj.next());
      } while (!(factor_obj.filter(".mopen").length-factor_obj.filter(".mclose").length === 0));
      factor = tree.parse({id: factor_id, obj: factor_obj});
      factor.type = "factor";
      factor.type2 = "group";
      term.addChild(factor);
      term_obj = term_obj.add(factor_obj);
      factor_cnt++;
      i += factor_obj.length;
      inside = factor_obj.not(factor_obj.first()).not(factor_obj.last());
      //check it's not grouped exponential
      if (!factor_obj.last().is(".mclose:has(.msupsub)")) {
        inside_text = parse_poly(factor, inside, factor_id, false);
        let open_group_text = factor_obj.first().text();
        close_group_text = factor_obj.last().text();
        if (open_group_text === "⟨") open_group_text = "\\langle ";
        if (close_group_text === "⟩") close_group_text = "\\rangle ";
        factor.text = open_group_text + inside_text + close_group_text;
        factor.openText = open_group_text;
        factor.closeText = close_group_text;
      }
      factor_text = factor.text;
    }
    //if not grouped, deal with individual element

    //if number, group numbers into factor
    if (/^\d$/.test(thing.text()))
    {
      //console.log("if number, group numbers into factor");
      factor_text = "";
      factor_text+=factor_obj.text();
      while (i+factor_obj.length < things.length && /^\d$/.test(factor_obj.last().next().text())) {
        factor_obj = factor_obj.add(factor_obj.last().next());
        factor_text+=factor_obj.last().text();
      }
      factor = tree.parse({id: factor_id, obj: factor_obj});
      factor.type = "factor";
      factor.type2 = "normal";
      factor.text = factor_text;
      term.addChild(factor);
      term_obj = term_obj.add(factor_obj);
      factor_cnt++;
      i += factor_obj.length;
    }
    //operators that begin new term
    else if ((thing.text().trim() === "+"
      || thing.text().trim() === "−"
      || thing.text().trim() === "="
      || thing.text().trim() === ">"
      || thing.text().trim() === "<"
      || thing.text().trim() === "≠"
      || thing.text().trim() === "→"
      || thing.text().trim().charCodeAt(0) === 8764 //"∼"
      || thing.text().trim().charCodeAt(0) === 126 //"~". wow so different
        ))
    {
      //console.log("operator that begins new term");
      term.model.obj = term_obj;
      op = tree.parse({id: factor_id, obj: thing});
      if (factor_cnt > 0) { // if we have already some factors in the current term, actually start a new one, otherwise no.
        poly_str+=term.text;
        factor_cnt = 0;
        term_cnt++;
        factor_id = parent_id.toString() + "/" + (term_cnt+1).toString() + "/" + (factor_cnt+1).toString();
        op = tree.parse({id: factor_id, obj: thing});
        term_id = parent_id.toString() + "/" + (term_cnt+1).toString();
        term = tree.parse({id: term_id});
        term_obj = $();
        term.text = "";
        term.type = "term";
        root.addChild(term);
        factor_text = "";
      }
      if (thing.is(".mbin")
        || thing.text() === "+"
        || thing.text() === "−")
      {
        term.addChild(op);
        op.type = "factor";
        op.type2 = "op";
        op.text = (thing.text() === "−") ? "-" : "+"
        term_obj = term_obj.add(thing);
        term.text+=op.text;
        factor_cnt++;
      }
      else if (thing.is(".mrel"))
      {
        term.type = "rel";
        term.model.obj = thing;
        term.addChild(op);
        op.type = "rel";
        op.text = thing.text();
        if (thing.text() === "≠") op.text = "\\neq ";
        else if (thing.text().trim().charCodeAt(0) === 8764 || thing.text().trim().charCodeAt(0) === 126) op.text = "\\sim ";
        else if (thing.text() === "→") op.text = "\\to ";
        term.text+=op.text;
        poly_str+=term.text;

        term_cnt++;
        factor_cnt = 0;
        factor_id = parent_id.toString() + "/" + (term_cnt+1).toString() + "/" + (factor_cnt+1).toString();
        term_id = parent_id.toString() + "/" + (term_cnt+1).toString();
        term = tree.parse({id: term_id});
        root.addChild(term);
        term_obj = $();
        term.text = "";
        term.type = "term";
      }
      i++;
    }
    //multiplication operator
    else if (thing.is(".mbin") && (thing.text() === "⋅" || thing.text() === "×"))
    {
      //console.log("multiplication operator");
      factor = tree.parse({id: factor_id, obj: factor_obj});
      factor.type = "factor";
      factor.type2 = "op";
      if (thing.text() === "⋅") {
        factor.optype = "mult";
        factor.text = "\\cdot ";
      } else if (thing.text() === "×") {
        factor.optype = "vecmult";
        factor.text = "\\times ";
      }
      factor_text = factor.text;
      term.addChild(factor);
      term_obj = term_obj.add(thing);
      factor_cnt++;
      i++;
    }
    //logs
    else if (thing.is(".mop") && (thing.children().filter(".mop").text() === "log" || thing.text() === "log"))
    {
      //console.log("logs");
      factor_obj.css("position", "relative"); //so that animations work with log element..
      factor_obj = factor_obj.add(thing.next());
      factor = tree.parse({id: factor_id, obj: factor_obj});
      factor.type = "factor";
      factor.type2 = "log";
      term.addChild(factor);
      term_obj = term_obj.add(factor_obj);
      factor_cnt++;
      i=i+2; //because logs include the next HTML element too, as the body of the log!
    }
    //other functions
    else if (thing.is(".mop"))
    {
      //console.log("other functions");
      condNotArg = thing.is(":has(.msupsub)") && thing.children(".op-symbol").length !== 0 || thing.is(".mop.op-limits");

      //because functions except those that satisfy the condition include the next HTML element too, as the body of the log!
      //and some things are different
      factor_obj.css("position", "relative"); //so that animations work with log element..
      i=i+1;
      let arg = tree.parse({id: factor_id + "/" + "1"});
      // console.log("condNotArg",condNotArg);
      if (!condNotArg) {
        arg.type = "body";
        if (!thing.next().is(".mopen")) {
          arg_obj = thing.next();
          let is_container = arg_obj.children().length > 0 && arg_obj.is(".textstyle.uncramped");
          // console.log("is_container",is_container);
          arg.text = parse_poly(arg, arg_obj, factor_id + "/" + "1", is_container);
          i=i+1;
          arg.model.obj = arg_obj;
        } else {
          arg_obj = factor_obj.next();
          do {
            arg_obj = arg_obj.add(arg_obj.next());
          } while (!(arg_obj.filter(".mopen").length-arg_obj.filter(".mclose").length === 0));

          inside = arg_obj.not(arg_obj.first()).not(arg_obj.last());
          i += arg_obj.length;
          arg.model.obj = arg_obj;
          //check it's not grouped exponential
          if (!arg_obj.last().is(".mclose:has(.msupsub)")) {
            arg.text = parse_poly(arg, inside, factor_id, false);
          } else {
            inside_factor = tree.parse({id: factor_id + "/1/1", obj: base_obj});
            inside_factor.type="grouped_exp";
            base_obj = inside;
            base = tree.parse({id: factor_id + "/1/1/1", obj: base_obj});
            base.type = "base";
            base.text = parse_poly(base, inside, factor_id + "/" + "1", false);
            power_obj = factor_obj.last().find(".msupsub").first();
            power = tree.parse({id: factor_id + "/1/1/2", obj: power_obj});
            power.type = "power";
            inside = power_obj.find(".mord").first();
            power.text = parse_poly(power, inside, factor_id + "/" + "2", true);
            inside_factor.addChild(base);
            inside_factor.addChild(power);
            inside_factor.text = "(" + base.text + ")" + "^{" + power.text + "}";
            arg.addChild(inside_factor);
            arg.text = inside_factor.text;
          }
        }
        factor_obj = factor_obj.add(arg_obj);
        if (arg.text.length>1)
        factor.text = fun_text + "{(" + arg.text + ")}";
        else
        factor.text = fun_text + "{" + arg.text + "}";
      }
      factor = tree.parse({id: factor_id, obj: factor_obj});

      let fun_text = "\\" + thing.text();
      if (fun_text  === "\\∫") fun_text = "\\int";
      factor.addChild(arg);

      factor.type = "factor";
      factor.type2 = thing.text();
      if (thing.text()  === "∫") factor.type2 = "int";
      term.addChild(factor);
      term_obj = term_obj.add(factor_obj);
      factor_cnt++;
    }
    //normal factors, and other things (treat them as factors, as a default behavior for unknown things)
    //prev selector: if (!(/^\d$/.test(thing.text())) && (!thing.is(".mbin, .mopen, .mclose, .mrel, .mop") || thing.text() === "!"))
    else if (thing.text() !== "" && (!thing.is(".mclose,.mopen") || thing.text() === "!"))
    {
      // console.log("normal", thing.text());
      //treat as factor
      factor = tree.parse({id: factor_id, obj: factor_obj});
      factor.type = "factor";
      factor.type2 = "normal";
      if (!thing.is(":has(*)")) //if thing doesn't have children. If it does, we deal with them below!
      {
        factor.text = thing.text();
        if (factor.text === "−")
        {
          // console.log("minus sign");
          factor.type2 = "op";
          factor.text = "-";
        }
        else if (factor.text === "+")
        {
          factor.type2 = "op";
          factor.text = "+";}
        factor_text = factor.text;
        // //console.log(factor.text);
      }
      else if (thing.children().length === 1 && thing.children().first().hasClass("mathbf")) {
        factor.type2 = "matrix";
        factor.text = "\\mathbf{"+thing.children().first().text()+"}";
        factor_text = factor.text;
      }
      term.addChild(factor);
      term_obj = term_obj.add(thing);
      factor_cnt++;
      i++;
    }
    //empty span
    else if (thing.text() === "") {
      i++;
      continue;
    }
    // //console.log("going to parse children");

    // console.log("factor_text",factor_text);

    //PARSING CHILDREN: deal with things with children, recursivelly.
    if (factor_obj.is(":has(*)")) {
      //fractions, and Leibniz diffs
      if (thing.is(".mfrac") || (thing.children(".mfrac").length !== 0)) //&& thing.children(".mfrac").children(".vlist").children().length === 4
      {
        //console.log("fraction");
        factor.type2 = "frac";
        denominator = thing.closest_n_descendents(".mord", 2).first();
        numerator = thing.closest_n_descendents(".mord", 2).last();
        child1 = tree.parse({id: factor_id + "/" + "1", obj: numerator});
        child1.type = "numerator";
        child2 = tree.parse({id: factor_id + "/" + "2", obj: denominator});
        child2.type = "denominator";
        factor.addChild(child1);
        factor.addChild(child2);
        nom_str = parse_poly(child1, numerator, factor_id + "/" + "1", true);
        child1.text = nom_str;
        denom_str = parse_poly(child2, denominator, factor_id + "/" + "2", true);
        child2.text = denom_str;
        factor.text = "\\frac{" + nom_str + "}{" + denom_str + "}";
        if (nom_str.search(/^d(\^\{[1-9]+\})*$/) === 0 && denom_str.search(/^d[a-z](\^\{[1-9]+\})*$/) === 0) {
          factor.type2 = "diff";
          // var variable = thing.closest_n_descendents(".mord", 2).first().children();
          // variable = variable.not(variable.first());
          // var var_str = parse_poly(factor, variable, factor_id, false);
          // factor.text = "\\frac{d}{d" + var_str + "}";
        }
      }
      //square roots
      else if (thing.is(".sqrt"))
      {
        factor.type2 = "sqrt";
        inside = thing.find(".mord").first();
        factor.text = "\\sqrt{" + parse_poly(factor, inside, factor_id, true) + "}";
      }
      //exponentials, and sub and superscripts
      else if (thing.is(":has(.msupsub)") && !thing.is(".mop") && !thing.is(".accent") && thing.children(".mfrac").length === 0 && thing.children(".op-symbol").length === 0)
      {
        //console.log("exponential");
        base_obj = thing.find(".mord").first();
        base = tree.parse({id: factor_id + "/" + "1", obj: base_obj});
        base.type = "base";
        base.text = parse_poly(base, base_obj, factor_id + "/" + "1", false);
        factor.addChild(base);
        factor.text = base.text
        // let arr = thing.closest_n_descendents(".vlist",1).children(":not(.baseline-fix)");
        let supsub = thing.children(".msupsub");

        factor.type2 = "";
        if (supsub.is(".sub, .supsub")) {
          var sub_obj;
          if (supsub.is(".sub")) sub_obj = supsub.closest_n_descendents(".mord", 1).first();
          else sub_obj = supsub.closest_n_descendents(".mord", 2).first();
          let sub = tree.parse({id: factor_id + "/" + (i+2).toString(), obj: sub_obj});
          sub.type = "subscript";
          sub.text = parse_poly(sub, sub_obj, factor_id + "/" + (i+2).toString(), true);
          factor.addChild(sub);
          factor.type2 += "subs";
          factor.text += "_{"+sub.text+"}"
        }
        if (supsub.is(".sup, .supsub")) {
          let sup_obj;
          if (supsub.is(".sup")) sup_obj = supsub.closest_n_descendents(".mord", 1).first();
          else sup_obj = supsub.closest_n_descendents(".mord", 2).last();
          let power = tree.parse({id: factor_id + "/" + (i+2).toString(), obj: sup_obj});
          power.type = "power";
          power.text = parse_poly(power, sup_obj, factor_id + "/" + (i+2).toString(), true);
          factor.addChild(power);
          factor.type2 += "exp";
          factor.text += "^{"+power.text+"}";
        }
        // // for (let i = 0; i < arr.length; i++) {
        // //   //TODO: This feels very ad-hoc, but it is because their html structure varies quite a lot...
        //   inside2 = $(arr[i]).find("*:only-child:has(.mord:has(:not(.mord, .mfrac)), .mfrac:has(:not(.mord, .mfrac))), *:only-child:has(.mord:not(:has(*)), .mfrac:not(:has(*)))").first()
        //   if ($(arr[i]).css("top").slice(0,1) === "-") // superscript/exp
        //   {
        //     let power = tree.parse({id: factor_id + "/" + (i+2).toString(), obj: $(arr[i])});
        //     power.type = "power";
        //     power.text = parse_poly(power, inside2, factor_id + "/" + (i+2).toString(), true);
        //     factor.addChild(power);
        //     factor.type2 += "exp";
        //     factor.text += "^{"+power.text+"}";
        //   } else
        //   {
        //     let sub = tree.parse({id: factor_id + "/" + (i+2).toString(), obj: $(arr[i])});
        //     sub.type = "subscript";
        //     sub.text = parse_poly(sub, inside2, factor_id + "/" + (i+2).toString(), true);
        //     factor.addChild(sub);
        //     factor.type2 += "subs";
        //     factor.text += "_{"+sub.text+"}"
        //   }
        // // }
      }
      //exponentiated group
      else if (!factor_obj.first().is(".mop") && factor_obj.last().is(".mclose:has(.vlist)"))
      {
        factor.type2 = "group_exp";
        base_obj = inside;
        base = tree.parse({id: factor_id + "/" + "1", obj: base_obj});
        base.type = "base";
        base.text = parse_poly(base, inside, factor_id + "/" + "1", false);
        power_obj = factor_obj.last().find(".vlist").first();
        power = tree.parse({id: factor_id + "/" + "2", obj: power_obj});
        power.type = "power";
        inside = power_obj.find(".mord").first();
        let open_group_text = factor_obj.first().text();
        // let close_group_text = factor_obj.eq(-2).text();
        if (open_group_text === "(") {
          close_group_text = ")";
        } else if (open_group_text === "⟨") {
          open_group_text = "\\langle ";
          close_group_text = "\\rangle ";
        } else if (open_group_text === "[") {
          close_group_text = "]";
        } else if (open_group_text === "|") {
          close_group_text = "|";
        } else if (open_group_text === "<") {
          close_group_text = ">";
        } else {
          close_group_text = open_group_text;
        }
        // if (close_group_text === "⟩") close_group_text = "\\rangle ";
        power.text = parse_poly(power, inside, factor_id + "/" + "2", true);
        factor.addChild(base);
        factor.addChild(power);
        factor.openText = open_group_text;
        factor.closeText = close_group_text;
        factor.text = open_group_text + base.text + close_group_text + "^{" + power.text + "}";
      }
      //text
      else if (thing.is(".text"))
      {
        factor.type = "text";
        factor.text = thing.text();
      }
      //accents and vectors
      else if (thing.is(".accent"))
      {
        //vector
        if (thing.closest_n_descendents(".accent-body", 1).hasClass("accent-vec")) {
          factor.type2 = "vector";
          factor.text = "\\vec{" + thing.closest_n_descendents(".mord", 1).text().replace(/[^\x00-\x7F]/g, "") + "}";
        } else { //some accent
          if (thing.closest_n_descendents(".accent-body", 1).text()==="^") { //hat
            factor.type2 = "normal";
            factor.text = "\\hat{" + thing.text().replace(/[^\x00-\x7F]/g, "").slice(0, -1) + "}";
          } else if (thing.closest_n_descendents(".accent-body", 1).text()==="~") {
            factor.type2 = "normal";
            factor.text = "\\tilde{" + thing.text().replace(/[^\x00-\x7F]/g, "").slice(0, -1) + "}";
          }
        }
      }
      //binomial coefficient
      else if (thing.children(".mfrac").length !== 0 && thing.children(".mfrac").children(".vlist").children().length === 3)
      {
        factor.type2 = "binom";
        denominator = thing.closest_n_descendents(".mord", 2).first();
        numerator = thing.closest_n_descendents(".mord", 2).last();
        child1 = tree.parse({id: factor_id + "/" + "1", obj: numerator});
        child1.type = "available";
        child2 = tree.parse({id: factor_id + "/" + "2", obj: denominator});
        child2.type = "chosen";
        factor.addChild(child1);
        factor.addChild(child2);
        nom_str = parse_poly(child1, numerator, factor_id + "/" + "1", true);
        child1.text = nom_str;
        denom_str = parse_poly(child2, denominator, factor_id + "/" + "2", true);
        child2.text = denom_str;
        factor.text = "\\binom{" + nom_str + "}{" + denom_str + "}"
      }
      //operator: integrals and others
      else if (thing.is(":has(.vlist)") && thing.children(".op-symbol").length !== 0)
      {
        //integral
        if (thing.children().first().text() === "∫")
        {
          factor.type2 = "int";
          var upper_limit = thing.children().last().closest_n_descendents(".mord", 2).last();
          var lower_limit = thing.children().last().closest_n_descendents(".mord", 2).first();
          child1 = tree.parse({id: factor_id + "/" + "1", obj: upper_limit});
          child1.type = "sup";
          child2 = tree.parse({id: factor_id + "/" + "2", obj: lower_limit});
          child2.type = "sub";
          factor.addChild(child1);
          factor.addChild(child2);
          up_str = parse_poly(child1, upper_limit, factor_id + "/" + "1", true);
          child1.text = up_str;
          low_str = parse_poly(child2, lower_limit, factor_id + "/" + "2", true);
          child2.text = low_str;
          factor.text = "\\int_{" + low_str + "}^{" + up_str + "}"
        }
        else
        {
          let fun_text = thing.children().first().text();
          if (fun_text.includes("∑")) {fun_text = "sum";}
          else if (fun_text.includes("∏")) {fun_text = "prod";}
          factor.type2 = fun_text;
          fun_text = "\\" + fun_text;
          let low_lim_obj = thing.children(":nth-child(2)").children(":nth-child(1)").closest_n_descendents(".mord", 1);
          let up_lim_obj = thing.children(":nth-child(2)").children(":nth-child(2)").closest_n_descendents(".mord", 1);
          // let arg_obj = thing.next();
          // let arg = tree.parse({id: factor_id + "/" + "1", obj: arg_obj});
          let low_lim = tree.parse({id: factor_id + "/" + "1", obj: low_lim_obj});
          let up_lim = tree.parse({id: factor_id + "/" + "2", obj: up_lim_obj});
          // arg.type = "arg";
          // arg.type2 = "body";
          low_lim.type = "arg";
          low_lim.type2 = "limit";
          up_lim.type = "arg";
          up_lim.type2 = "limit";
          // arg.text = parse_poly(arg, arg_obj, factor_id + "/" + "1", arg_obj.children().length > 0);
          //console.log("low_lim_obj.children().length > 0", low_lim_obj.children().length > 0);
          low_lim.text = parse_poly(low_lim, low_lim_obj, factor_id + "/" + "1", low_lim_obj.children().length > 0);
          up_lim.text = parse_poly(up_lim, up_lim_obj, factor_id + "/" + "2", up_lim_obj.children().length > 0);
          // factor.addChild(arg);
          factor.addChild(low_lim);
          factor.addChild(up_lim);
          factor.text = fun_text + "_{"+ low_lim.text + "}"  + "^{"+ up_lim.text + "}" // + "{" + arg.text + "}";
        }
      }
      //logs
      else if (thing.is(".mop") && (thing.children().filter(".mop").text() === "log" || thing.text() === "log"))
      {
        base_obj = thing.children().filter(".msupsub").closest_n_descendents(".mord", 1).first();
        let log_text = "\\log"
        let bodyIndex = 1;
        if (base_obj.length > 0) {
          base = tree.parse({id: factor_id + "/" + "1", obj: base_obj});
          base.type = "base";
          base.text = parse_poly(base, base_obj, factor_id + "/" + "1", true);
          factor.addChild(base);
          log_text += "_{" + base.text + "}";
          bodyIndex = 2;
        }
        let body_obj = thing.next();
        let body = tree.parse({id: factor_id + "/" + bodyIndex.toString(), obj: body_obj});
        body.type = "body";
        let is_container = body_obj.children().length > 0 && body_obj.is(".mord");
        body.text = parse_poly(body, body_obj, factor_id + "/" + bodyIndex.toString(), is_container);
        factor.addChild(body);
        factor.text = log_text + "{" + body.text + "}";
      }
      //op with limits, should add \lims?
      else if (thing.is(".mop.op-limits"))
      {
        let fun_text = thing.children().first().children(":nth-child(2)").text();
        if (fun_text.includes("∑")) {fun_text = "sum";}
        else if (fun_text.includes("∏")) {fun_text = "prod";}
        factor.type2 = fun_text;
        fun_text = "\\" + fun_text;
        let low_lim_obj = thing.children().first().children(":nth-child(1)").closest_n_descendents(".mord", 1);
        let up_lim_obj = thing.children().first().children(":nth-child(3)").closest_n_descendents(".mord", 1);
        // let arg_obj = thing.next();
        // let arg = tree.parse({id: factor_id + "/" + "1", obj: arg_obj});
        let low_lim = tree.parse({id: factor_id + "/" + "1", obj: low_lim_obj});
        let up_lim = tree.parse({id: factor_id + "/" + "2", obj: up_lim_obj});
        // arg.type = "arg";
        // arg.type2 = "body";
        low_lim.type = "arg";
        low_lim.type2 = "limit";
        up_lim.type = "arg";
        up_lim.type2 = "limit";
        // arg.text = parse_poly(arg, arg_obj, factor_id + "/" + "1", arg_obj.children().length > 0);
        low_lim.text = parse_poly(low_lim, low_lim_obj, factor_id + "/" + "1", low_lim_obj.children().length > 0);
        up_lim.text = parse_poly(up_lim, up_lim_obj, factor_id + "/" + "2", up_lim_obj.children().length > 0);
        // factor.addChild(arg);
        factor.addChild(low_lim);
        factor.addChild(up_lim);
        factor.text = fun_text + "_{"+ low_lim.text + "}"  + "^{"+ up_lim.text + "}" // + "{" + arg.text + "}";
      }

      factor_text = factor.text;
    }
    //change symbols unicode to latex
    for (let symbol in symbols.math) {
        if (factor_text === symbols.math[symbol].replace && factor_text !== "k") { //k is a special case. there is a special symbol in latex, but user will often not mean that..
          factor.text = symbol + " ";
          factor_text = factor.text;
        }
    }
    // console.log(term_id,factor_text);
    term.text+=factor_text;
    if (i === things.length) {term.model.obj = term_obj; poly_str+=term.text;}
  };
  root.text = poly_str;
  return poly_str;
}

export function clear_math(math) {
  let new_str = math.replace(/\\frac{}/g, "\\frac{1}")
        // .replace(/ /g, "") some operators require the space, for exampl a \cdot b
        .replace(/\+/g, '--').replace(/(--)+-/g, '-').replace(/--/g, '+')
        .replace(/\(\+/g, "(")
        .replace(/^\+/, "")
        .replace(/=$/, "=0")
        .replace(/=+/, "=")
        .replace(/=[\+]/g, "=")
        .replace(/[\+\-]=/g, "=")
        .replace(/0\+/g, "")
        .replace(/0-/g, "-")
        .replace(/^=/, "0=")
        .replace(/\^{}/g, "")
        .replace(/\\log\_\{\}/g, "\\log")
        .replace(/\{\+/g, "{")
        .replace(/\(\+/g, "(");
  if (new_str.indexOf("\\frac")!==-1) {
    let new_root = math_str_to_tree(new_str);
    new_root.walk(function (node) {
      if (node.type2 === "frac" && node.children[1].text === "") {
        new_str = replace_in_mtstr(new_root,node, node.children[0].text);
        new_root = math_str_to_tree(new_str);
      }
    });
  }
  return new_str
}

export function math_str_to_tree(math) {
  $("body").append($('<p id="temppppppp"></p>'))
  let math_el = document.getElementById("temppppppp");
  // console.log(math_el);
  $(math_el).hide();
  // console.log(math);
  katex.render(math, math_el, { displayMode: true });

  var root_poly = $("#temppppppp .base");

  let tree = new TreeModel();

  let root = tree.parse({});
  // console.log(math_root);
  root.model.id = "0";
  root.model.obj = root_poly;
  //KaTeX offers MathML semantic elements on the HTML, could that be used?

  parse_poly(root, root_poly, 0, true);

  $(math_el).remove();

  return root;
}

export function tree_to_math_str(math_el) {
  let root_poly = $(math_el).find(".base");

  let tree = new TreeModel();

  let math_root = tree.parse({});
  math_root.model.id = "-1";
  math_root.model.obj = root_poly;

  return parse_poly(math_root, root_poly, "-1", true);
}

export function compare_trees(tree1, tree2) {
  let children1 = tree1.children;
  let children2 = tree2.children;
  let subs = [];
  if (children1.length === 0)
    return {same: true, subs: [[tree1, tree2]]};
  else if (children1.length !== children2.length || children1.type !== children2.type || children1.type2 !== children2.type2)
    return {same: false, subs};
  else {
    for (var i = 0; i < children1.length; i++) {
      let comp = compare_trees(children1[i], children2[i]);
      if (comp.same) {
        subs = [ ...subs, ...(comp.subs)];
      } else {
        return {same: false, subs}
      }
    }
    return {same: true, subs}
  }
}
