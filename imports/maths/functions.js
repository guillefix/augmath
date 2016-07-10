import jQuery from 'jquery';
import katex from 'katex';
import TreeModel from '../TreeModel-min.js';
import {symbols} from './symbols.js';
import {add_to_history, active_in_history, remove_from_history, select_in_history} from '../startup/client/history';
import Bro from 'brototype';
// import Algebrite from 'algebrite';
import algebra from 'algebra.js'

//USEFUL FUNCTIONS

//remove and create events handlers that happen when user clicks a manipulative
export function remove_events(type, depth) {
  console.log("test");
  var $selectable = $();
  math_root.walk(function (node) {
    if (node.model.id !== "0" && node.type === type && getIndicesOf("/", node.model.id).length === depth) {
      $selectable = $selectable.add(node.model.obj);
      }
  });
  $selectable.off();
}

export function select_node(node) {
  $this = node.model.obj;
  $this.toggleClass("selected");
  node.selected = !node.selected;
  if (!multi_select) {
    math_root.walk(function (node2) {
      if (node2 !== node) {node2.selected = false;}
    });
    $(".base *").filter(".selected").not($this).toggleClass("selected");
  }
  if (var_select) {
    math_root.walk(function (node2) {
      if (node.selected && !node2.selected && node2.text === node.text) {
        node2.selected = true;
        node2.model.obj.toggleClass("selected");
      }
    });
  }
  selected_nodes = [];
  selected_text = "";
  math_root.walk(function (node) {
    if (node.selected) {selected_nodes.push(node); selected_text += node.text;}
  });
  if (var_select) {
    selected_text = node.text;
  }
  $selected = $(".selected");
  selected_width = tot_width($selected, true);
  selected_position = $selected.offset();
  var replace_el = document.getElementById("replace");
  replace_el.value = selected_text;
}

export function create_events(type, depth) {
  var  index;
  //reset stuff
  math_root.walk(function (node) {
    node.selected = false;
  });
  $(".selected").toggleClass("selected");
  selected_nodes = [];
  selected_text = "";
  //DRAG AND DROP. Goes here because I should group stuff depending on which manipulative is selectable really
  $(".base").attr('id', 'sortable');
  $("#sortable").sortable({
    forceHelperSize: true,
    placeholder: "sortable-placeholder"
        });
  $( "#sortable" ).droppable({
      drop: function( event, ui ) {

        window.setTimeout(rerender, 50); //probably not a very elegant solution

        function rerender() {
          var root_poly = $("#math .base");

          tree = new TreeModel();

          math_root = tree.parse({});
          math_root.model.id = "0";
          //KaTeX offers MathML semantic elements on the HTML, could that be used?

          parse_poly(math_root, root_poly, 0, true);

          var newmath = parse_mtstr(math_root, [], []);

          prepare(newmath);
        }

      }
    });

  math_root.walk(function (node) {
    if (node.model.id !== "0" && node.type === type && getIndicesOf("/", node.model.id).length === depth) {
        node.model.obj.on("click", function() {select_node(node);});
        node.model.obj.css({"display":"inline-block"});
      }
  });
  //Draggable.create(".mord", {type:"x,y", edgeResistance:0.65, throwProps:true});
}
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
  str.replace(/\\sqrt\{([-a-z0-9]+)\}/g, "sqrt($1)");
  str = str.replace(/\}\{/g, ")/(").replace(/\\frac{/g, "(").replace(/\}/g, ")");
  str = str.split("").join("*");
  str = str.replace(/\*?\+\*?/g, "+")
    .replace(/([0-9])\*([0-9])/g, "$1$2")
    .replace(/\*?-\*?/g, "-")
    .replace(/\*?=\*?/g, "=")
    .replace(/\*?\(\*?/g, "(")
    .replace(/\*?\)\*?/g, ")")
    .replace(/\*?\/\*?/g, "/")
    .replace(/\(\+/g, "(")
    .replace(/\*\^\*\{\*(\-?[0-9]+)\)/g, "^($1)")
    .replace(/\^\*\{\*(\-?[0-9]+)\)/g, "^($1)")
    .replace(/\*\^\*\{(\-?[0-9]+)\)/g, "^($1)");
  return str;
}

//convert a string in Algebrite ascii format to latex

export function ascii_to_latex(str) {
  var exp = new algebra.Expression(str);
  return exp.toTex().replace(/\^([a-z0-9])/g, "^{$1}").replace(/\^\(([-a-z0-9]+)\)/g, "^{$1}");
}

//evaluate an expression with Algebrite
export function eval_expression(expression) {
  var new_term;
  expression = latex_to_ascii(expression) //doesn't work with some expressions, as usual
  if (expression.search(/[a-z\(\)]/) > -1) {
    var new_str = Algebrite.simplify(expression).toString();
    new_term = ascii_to_latex(new_str);
    // try {
    //   new_term = CQ(expression).simplify().toLaTeX().replace("\\cdot", ""); //removing cdot format
    // }
    // catch(err) {
    //   console.log("Error (from CQ): " + err);
    //   console.log("Expression is : " + expression);
    //   new_term = CQ(expression).simplify().toString().replace(/\*{2}(\d+)/, "^{$1}").replace(/\*/g, "")
    //                           .replace(/([a-z0-9]+)\/([a-z0-9]+)/, "\\frac{$1}{$2}");
    // }
    // finally {
    // }

  } else {
    new_term = math.eval(expression).toString();
  }
  return new_term;
}

//Rationalize expression

export function rationalize(str) {
  var ascii_str = latex_to_ascii(str);
  ascii_str = ascii_str.replace(/e/g, "ee"); //becase Algebrite annoyingly thinks all es are exponentials..
  // console.log("HIIIIII",ascii_str)
  var new_exp = Algebrite.rationalize(ascii_str);
  var new_str = "\\frac{" + Algebrite.numerator(new_exp).toString() + "}{" + Algebrite.denominator(new_exp).toString() + "}";
  new_str = new_str.replace(/ee/g, "e").replace(/ /g, "");
  // console.log("HIIIIII",new_str)
  return ascii_to_latex(new_str);
}

//get the total width of a set of elements
export function tot_width(obj, bool, include_op) {
  var width=0;
  obj.each(function(i) {
    width += $(this).outerWidth(includeMargin=bool);
  })
  if (include_op === true) {
    if (obj.first().text() !== "+" && obj.first().text() !== "−") {
      width += $(".base").find(".mbin").first().outerWidth(includeMargin=bool);
    }
  }
  return width;
}

//__Mathematical and notational functions__

//change sign of some nodes
export function change_sign(nodes) {
  var text="";
  for (i=0; i<nodes.length; i++) {
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
  // console.log("exponentiating")
  if (typeof distInFrac === 'undefined') { distInFrac = false; }
  var new_text="";
  for (var i=0; i<nodes.length; i++) {
    if (nodes[i].type !== "factor") { throw "Called exponentiate with something that isn't a factor" }
    switch (nodes[i].type2) {
      case "exp":
      case "group_exp":
        var new_pow;
        if (power === "-1") { //if power is -1 then change sign of power
          new_pow = change_sign(nodes[i].children[1].children);
        }
        else {
          new_pow = math.eval(power + "*" + nodes[i].children[1]);
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

export function multiply_grouped_nodes(nodes) {
  var result = "";
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].children.length > 1) {
      result += "(" + nodes[i].text + ")";
    } else {
      result += nodes[i].text;
    }
  }
  return result;
}

//flip fraction
export function flip_fraction(nodes) {
  // console.log("flipping_fracs")
  var new_text="";
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].type !== "factor") { throw "Called flip_fraction with something that isn't a factor" }
    switch (nodes[i].type2) {
      case "frac":
        if (nodes[i].children[0].text === "1") {
          new_text += nodes[i].children[1].text;
        } else {
          new_text += "\\frac{" + nodes[i].children[1].text + "}{" + nodes[i].children[0].text + "}";
        }
        break;
      default:
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
    var term_text1 = selected_nodes[i].text,
        term_text2 = selected_nodes[i+1].text;
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
//

// function equiv_nodes(node1, node2) {
//
// }

//get previous node
export function get_prev(nodes) {
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
export function get_next(nodes) {
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
export function get_all_next(node) {
  var next_nodes = [];
  var array = node.model.id.split("/");
  var init = parseInt(array[array.length-1], 10);
  var max = node.parent.children.length;
  for (var i = init+1; i <= max; i++) {
    array[array.length-1] = i;
    var new_id = array.join("/");
    var node;
    math_root.walk(function (node1) {
      if (node1.model.id === new_id) {node = node1; return false;}
    });
    next_nodes.push(node);
  };
  return next_nodes;
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
  //console.log(node_arr);
  while (i < root.children.length) {
    var term_text="";
    var child = root.children[i];
    //console.log("child")
    //console.log(child);
    node_selected = false;
    for (var k=0; k<node_arr.length; k++) {
      if (child.model.id === node_arr[k].model.id) {
        node_selected = true;
        term_text = str_arr[k];
        break;
      }
    }
    if (node_selected) {i++; poly_str+=term_text; continue;}
    //console.log(child.children);
    j = 0;
    while (j < child.children.length) {
      var factor_text="";
      var frac_text = [], exp_text = [], binom_text = [], diff_text = "", int_text = [];
      var grandchild = child.children[j];
      //console.log("grandchild");
      //console.log(grandchild);
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
            factor_text = "(" + parse_mtstr(grandchild, node_arr, str_arr) + ")";
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
            exp_text[0] = grandchild.children[0].text;
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
            exp_text[0] = parse_mtstr(grandchild.children[0], node_arr, str_arr);
            exp_text[1] = parse_mtstr(grandchild.children[1], node_arr, str_arr);
            //console.log(grandchild.children);
            for (var l=0; l<2; l++) {
              for (var k=0; k<node_arr.length; k++) {
                if (grandchild.children[l].model.id === node_arr[k].model.id) {
                  exp_text[l] = str_arr[k];
                  break;
                }
              }
            }
            factor_text = "(" + exp_text[0] + ")" + "^{" + exp_text[1] + "}";
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
export function replace_in_mtstr(nodes, str_arr) {
  if (nodes.__proto__.length !== 0) {
    nodes = [nodes];
  }
  if (typeof str_arr === "string") {
    var str = str_arr;
    str_arr = [];
    for (i=0; i<nodes.length; i++) {
      if (i === 0) {str_arr.push(str);}
      else {str_arr.push("");}
    }
  }
  return parse_mtstr(math_root, nodes, str_arr);
}

//MANIPULATIVES
//HTML -> TREE
//This creates a tree by going through the terms in an expression, and going through its factors. Factors that can contain whole expressions within them are then recursively analyzed in the same way.
//This is tied to the way KaTeX renders maths. A good thing would be to do this for MathML, as it's likely to be a standard in the future.
export function parse_poly(root, poly, parent_id, is_container) {
  var poly_str = "";
  var term_cnt = 0;
  var factor_cnt = 0;
  var i = 0;
  var factor_obj, factor, op, term_obj=$(), factor_id, term_id, inside, nom_str, denom_str, prev_factor_id, inside_text, base_obj, power_obj, base, power, child1, child2;
  var numerator, denominator;
  var term = tree.parse({id: parent_id.toString() + "/" + (term_cnt+1).toString()});
  term.text = "";
  term.type = "term";
  root.addChild(term);
  var things = is_container ? poly.children() : poly;
  while (i < things.length) {
    var thing = things.filter(":eq("+i+")");
    factor_obj = thing;
    factor_id = parent_id.toString() + "/" + (term_cnt+1).toString() + "/" + (factor_cnt+1).toString();
    term_id = parent_id.toString() + "/" + (term_cnt+1).toString();
    //deal with elements GROUPED by brackets
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
      if (!factor_obj.last().is(".mclose:has(.vlist)")) { //check it's not grouped exponential
        inside_text = parse_poly(factor, inside, factor_id, false);
        factor.text = "(" + inside_text + ")";
      }
      factor_text = factor.text;
    }
    //if not grouped, deal with individual element
    //if number, group numbers into factor
    if (/^\d$/.test(thing.text()))
    {
      factor_text = "";
      asd=0;
      factor_text+=factor_obj.text();
      while (/^\d$/.test(factor_obj.last().next().text())) {
        factor_obj = factor_obj.add(factor_obj.last().next());
        factor_text+=factor_obj.last().text();
        asd++;
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
    //normal factor
    if (!(/^\d$/.test(thing.text())) && (!thing.is(".mbin, .mopen, .mclose, .mrel") || thing.text() === "!"))
    {
      factor = tree.parse({id: factor_id, obj: factor_obj});
      factor.type = "factor";
      factor.type2 = "normal";
      if (!thing.is(":has(*)"))
      {
        factor.text = thing.text();
        if (factor.text === "−")
        {
          factor.type2 = "op";
          factor.text = "-";
        }
        else if (factor.text === "+")
        {
          factor.type2 = "op";
          factor.text = "+";}
        factor_text = factor.text;
        // console.log(factor.text);
      }
      term.addChild(factor);
      term_obj = term_obj.add(thing);
      factor_cnt++;
      i++;
    }
    //operators that begin new term
    else if (thing.is(".mbin, .mrel") && (thing.text() === "+" || thing.text() === "−" || thing.text() === "="))
    {
      term.model.obj = term_obj;
      poly_str+=term.text;
      term_cnt++;
      factor_cnt = 0;
      factor_id = parent_id.toString() + "/" + (term_cnt+1).toString() + "/" + (factor_cnt+1).toString();
      term_id = parent_id.toString() + "/" + (term_cnt+1).toString();
      op = tree.parse({id: factor_id, obj: thing});
      term = tree.parse({id: term_id});
      root.addChild(term);
      term_obj = $();
      term.text = "";
      factor_text = "";
      term.type = "term";
      if (thing.is(".mbin"))
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
    //other operators
    else if (thing.is(".mbin, .mrel") && (thing.text() === "⋅"))
    {
      factor = tree.parse({id: factor_id, obj: factor_obj});
      factor.type = "factor";
      factor.type2 = "op";
      factor.optype = "mult";
      factor.text = "\\cdot ";
      term.addChild(factor);
      term_obj = term_obj.add(thing);
      factor_cnt++;
      i++;
    }

    //PARSING CHILDREN: deal with things with children, recursivelly.
    if (factor_obj.is(":has(*)")) {
      if (thing.children(".mfrac").length !== 0 && thing.children(".mfrac").children(".vlist").children().length === 4) {//fractions. it had 'thing.is(".minner") ||''  in it but not sure why
        if (thing.text().search(/^\\frac\{d\}\{d[a-z]\}$/) === 1) {
          factor.type2 = "diff";
          var variable = thing.closest_n_descendents(".mord", 2).first().children();
          variable = variable.not(variable.first());
          var var_str = parse_poly(factor, variable, factor_id, false);
          factor.text = "\\frac{d}{d" + var_str + "}";
        } else {
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
        }
      } else if (thing.is(".sqrt")) {//square roots
        factor.type2 = "sqrt";
        inside = thing.find(".mord").first();
        factor.text = "\\sqrt{" + parse_poly(factor, inside, factor_id, true) + "}";
      } else if (thing.is(":has(.vlist)") && !thing.is(".accent") && thing.children(".mfrac").length === 0 && thing.children(".op-symbol").length === 0) {//exponentials
        base_obj = thing.find(".mord").first();
        power_obj = thing.closest_n_descendents(".vlist", 1);
        var inside2 = power_obj.find(".mord").first();
        base = tree.parse({id: factor_id + "/" + "1", obj: base_obj});
        base.type = "base";
        base.text = parse_poly(base, base_obj, factor_id + "/" + "1", false);
        power = tree.parse({id: factor_id + "/" + "2", obj: power_obj});
        power.type = "power";
        power.text = parse_poly(power, inside2, factor_id + "/" + "2", true);
        factor.addChild(base);
        factor.addChild(power);
        factor.type2 = "exp";
        factor.text = base.text + "^{" + power.text + "}";//needs the standard power format in latex
      } else if (factor_obj.last().is(".mclose:has(.vlist)")) {//exponentiated group
        factor.type2 = "group_exp";
        base_obj = inside;
        base = tree.parse({id: factor_id + "/" + "1", obj: base_obj});
        base.type = "base";
        base.text = parse_poly(base, inside, factor_id + "/" + "1", false);
        power_obj = factor_obj.last().find(".vlist").first();
        power = tree.parse({id: factor_id + "/" + "2", obj: power_obj});
        power.type = "power";
        inside = power_obj.find(".mord").first();
        power.text = parse_poly(power, inside, factor_id + "/" + "2", true);
        factor.addChild(base);
        factor.addChild(power);
        factor.text = "(" + base.text + ")" + "^{" + power.text + "}";
      } else if (thing.is(".text")) { //text
        factor.type = "text";
        factor.text = thing.text();
      } else if (thing.is(".accent")) { //accent
        factor.type2 = "normal";
        factor.text = "\\hat{" + thing.text().replace(/[^\x00-\x7F]/g, "").slice(0, -1) + "}"; //I guess there are more types of accent, but I'll add them latter.
      } else if (thing.children(".mfrac").length !== 0 && thing.children(".mfrac").children(".vlist").children().length === 3) {
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
      } else if (thing.is(":has(.vlist)") && thing.children(".op-symbol").length !== 0) {//operator
        if (thing.children().first().text() === "∫") {//integral
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

      }
      factor_text = factor.text;
    }
    for (symbol in symbols.math) {
        if (factor_text === symbols.math[symbol].replace && factor_text !== "k") { //k is a special case. there is a special symbol in latex, but user will often not mean that..
          factor.text = symbol + " ";
          factor_text = factor.text;
        }
    }
    term.text+=factor_text;
    if (i === things.length) {term.model.obj = term_obj; poly_str+=term.text;}
  };
  return poly_str;
}
//this function prepares and renders the function with LaTeX, it also calls parse_poly to create the tree
export function prepare(math) {


  math = math.replace(/\\frac{}/g, "\\frac{1}")
        // .replace(/ /g, "") some operators require the space, for exampl a \cdot b
        .replace(/\(\+/g, "(")
        .replace(/^\+/, "")
        .replace(/=$/, "=0")
        .replace(/=+/, "=")
        .replace(/0\+/g, "")
        .replace(/0-/g, "-")
        .replace(/^=/, "0=")
        .replace(/\^{}/g, "")
        .replace(/\+/g, '--').replace(/(--)+-/g, '-').replace(/--/g, '+');

  var math_el = document.getElementById("math");
  katex.render(math, math_el, { displayMode: true });
  math_str_el.val(math);
  mathquill.latex(math);

  var root_poly = $("#math .base");

  tree = new TreeModel();

  window.math_root = tree.parse({}); //make global with window.
  console.log(math_root);
  math_root.model.id = "0";
  //KaTeX offers MathML semantic elements on the HTML, could that be used?

  parse_poly(math_root, root_poly, 0, true);

  math_root.walk(function (node) {
    if (node.type2 === "frac" && node.children[1].text === "") {prepare(replace_in_mtstr(node, node.children[0].text));}
  });

  if (!playing) {
    if (current_index < math_str.length) {
      remove_from_history(current_index);
      math_str[current_index] = math;
      add_to_history(current_index, current_index-1);
    } else {
      current_index = math_str.push(math)-1;
      add_to_history(current_index, current_index-1);
    }
  }

  active_in_history(current_index);

  if (recording) {
    var ids = [];
    for (var i=0; i<selected_nodes.length; i++) {
      ids.push(selected_nodes[i].model.id);
    }
    selected_nodes_id_rec.push(ids);
    math_str_rec.push(math);
  }

  create_events(manip, depth);

  //repositioning equals so that it's always in the same place. put in fixed value.
  window.$equals = $("#math .base").find(".mrel");
  if ($equals.length !== 0) {
    window.new_equals_position = $equals.offset();
    if (equals_position.left !== 0) {h_eq_shift += equals_position.left-new_equals_position.left;}
    if (equals_position.top !== 0) {v_eq_shift += equals_position.top-new_equals_position.top;}
    math_el.setAttribute("style", "left:"+h_eq_shift.toString()+"px;"+"top:"+v_eq_shift.toString()+"px;");
    window.equals_position = $equals.offset();
  }
  //useful variables
  window.beginning_of_equation = math_root.children[0].model.obj.offset();
  window.width_last_term = tot_width(math_root.children[math_root.children.length-1].model.obj, true, true);
  window.end_of_equation = math_root.children[math_root.children.length-1].model.obj.offset();
  window.end_of_equation.left += width_last_term;
}
