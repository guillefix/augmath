import {replace_in_mtstr, tot_width, rationalize, eval_expression, ascii_to_latex, latex_to_ascii, getIndicesOf, cleanIndices, change_sign, exponentiate, multiply, flip_fraction, add_brackets, are_of_type, any_of_type, have_same_ancestors, have_same_type, have_same_text, have_single_factor, have_same_denom, are_same_terms, have_same_prop, have_same_log_base, get_prev, get_next, get_all_next, has_op, parse_mtstr, parse_poly, math_str_to_tree, clear_math} from "./functions";

// import Algebrite from 'algebrite';

import algebra from 'algebra.js'

import Bro from 'brototype';

import {symbols} from './symbols.js';

//MANIPULATIONS

//change side
export function change_side() {
  let math_root = this.math_root;
  let selection = this.selection;
  console.log("changing side");
  console.log(selection.$selected); //.nextAll(".mrel").length !== 0
  // console.log("helping vars", this);
  var new_term;
  // equals_position = $equals.offset();
  var selected_width = tot_width(selection.$selected, true, true);
  equals_node = math_root.first(function (node) {
    if (node.children.length > 0) {
        return node.children[0].type === "rel";
      }
  });
  for (var i=0; i<selection.selected_nodes.length-1; i++) {//making sure all elemnts are of the same parent
    if (selection.selected_nodes[i].parent !== selection.selected_nodes[i+1].parent) {return;}
  }

  // console.log("selection.$selected.prevAll(.mrel).length !== 0", selection.$selected);
  // console.log("selection.selected_nodes", selection.selected_nodes);

  //terms
  if (selection.selected_nodes[0].parent === math_root)
  {
    console.log("changing term of side");
    if (selection.$selected.prevAll(".mrel").length === 0) { //before eq sign
      offset = (this.eqCoords.end_of_equation.left-selection.selected_position.left);
      selection.$selected.first().prevAll().animate({left:selected_width}, step_duration);
      selection.$selected = $(".selected").add($(".selected").filter(".mop").children());
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:offset}, step_duration).promise().done(function() {
          selection.$selected = $(".selected").add($(".selected").find("*"));
          new_term = change_sign(selection.selected_nodes);
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, "")+"+"+new_term;
          resolve(new_math_str); //this should pass it to the promise
        });
      });

    } else { //after eq sign
      offset = (this.eqCoords.equals_position.left-selection.selected_position.left)-tot_width(selection.$selected, true, false);
      selection.$selected.prevAll(".mrel").first().prevAll().animate({left:-selected_width}, step_duration);
      selection.$selected.last().nextAll().animate({left:-tot_width(selection.$selected, true, false)}, step_duration);
      selection.$selected = $(".selected").add($(".selected").filter(".mop").children());
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:offset}, step_duration).promise().done(function() {
          selection.$selected = $(".selected").add($(".selected").find("*"));
          new_term = change_sign(selection.selected_nodes);
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, "");
          new_math_str = new_math_str.replace("=", "+"+new_term+"=");
          resolve(new_math_str); //this should pass it to the promise
        });
      });
    }
  }
  //operator (sign) TODO:should check it's actually a sign, by checking "text"
  else if (selection.selected_nodes[0].parent.parent === math_root
    && selection.selected_nodes[0].type2 === "op"
    && (selection.selected_nodes[0].text === "+" || selection.selected_nodes[0].text === "-")
    && selection.selected_nodes.length === 1
    //and it comes from a top leve term, plus there is only one term on the side of the selected sign:
    && ((selection.$selected.prevAll(".mrel").length !== 0
        && get_prev(math_root, [math_root.children[math_root.children.length-1]]).children[0].type === "rel")
      || (selection.$selected.nextAll(".mrel").length !== 0
        && get_next(math_root, [math_root.children[0]]).children[0].type === "rel")))
  {
    console.log("changing sign of side");
    var selected_width = tot_width(selection.$selected, true, true);
    if (selection.$selected.prevAll(".mrel").length === 0) { //before eq sign
      offset = (this.eqCoords.equals_position.left-selection.selected_position.left) + tot_width(equals_node.model.obj, true, true);
      $equals.nextAll().animate({left:tot_width(selection.$selected, true, false)}, step_duration);
      selection.$selected = $(".selected").add($(".selected").filter(".mop").children());
      return new Promise((resolve, reject) => {
          selection.$selected.animate({left:offset}, step_duration).promise().done(function() {
          var RHS_terms = math_root.children.slice(parseInt(equals_node.model.id.split("/")[1]));
          new_term = change_sign(RHS_terms);
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes.concat(RHS_terms), "")+new_term;
          resolve(new_math_str);
        });
      });

    } else { //after eq sign
      offset = (this.eqCoords.beginning_of_equation.left-selection.selected_position.left)-tot_width(selection.$selected, true, false);
      selection.$selected.last().nextAll().animate({left:-tot_width(selection.$selected, true, false)}, step_duration);
      selection.$selected = $(".selected").add($(".selected").filter(".mop").children());
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:offset}, step_duration).promise().done(function() {
          var LHS_terms = math_root.children.slice(0, parseInt(equals_node.model.id.split("/")[1])-1);
          new_term = change_sign(LHS_terms);
          new_math_str = new_term+replace_in_mtstr(math_root, selection.selected_nodes.concat(LHS_terms), "");
          resolve(new_math_str);
        });
      });
    }
  }
  //factors
  else if ((selection.selected_nodes[0].parent.type === "numerator"
    || (selection.selected_nodes[0].type === "factor" && selection.selected_nodes[0].model.id.split("/").length === 3)
    || (selection.selected_nodes[0].type === "factor" && selection.selected_nodes[0].model.id.split("/").length === 6 && selection.selected_nodes[0].parent.parent.type === "numerator")
    || selection.selected_nodes[0].type === "numerator")
    //and it comes from a top level term, plus there is only one term on the side of the selected sign:
    && (((selection.$selected.prevAll(".mrel").length === 1 || selection.$selected.parents(".mord").last().prevAll(".mrel").length === 1)
        && get_prev(math_root, [math_root.children[math_root.children.length-1]]).children[0].type === "rel")
      || ((selection.$selected.prevAll(".mrel").length === 0 || selection.$selected.parents(".mord").last().prevAll(".mrel").length === 0)
        && get_next(math_root, [math_root.children[0]]).children[0].type === "rel")))
  {
    console.log("changing factor of side");
    if (selection.selected_nodes[0].model.id.split("/")[1] < equals_node.model.id.split("/")[1]) { //before eq sign
      RHS_width = tot_width($equals.nextAll(), false, false);
      var after_eq = false, after_eq_nodes=[];
      for (var i=0; i<math_root.children.length; i++) {
        if (after_eq) {after_eq_nodes.push(math_root.children[i])}
        if (math_root.children[i].children[0].type === "rel") {after_eq = true;}
      }
      var include_in_frac = after_eq_nodes.length === 1
          && after_eq_nodes[0].children.length === 1
          && after_eq_nodes[0].children[0].type2 === "frac";
      h_offset = $equals.offset().left - selection.$selected.offset().left + tot_width($equals, true, false) + (RHS_width)/2;
      v_offset = selection.$selected.outerHeight(includeMargin=true)/2;
      if (include_in_frac) {v_offset = 0;}
      $equals.nextAll().animate({top:-v_offset, left:tot_width(selection.$selected, true, false)/2}, step_duration);
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:h_offset, top:v_offset}, step_duration).promise().done(function() {
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, "");
          math_HS = new_math_str.split("="); //HS=hand sides
          if (include_in_frac) {
            new_math_str = math_HS[0] + "=" + "\\frac{" + after_eq_nodes[0].children[0].children[0].text + "}{" + after_eq_nodes[0].children[0].children[1].text + selection.selected_text + "}";
          } else {
            new_math_str = math_HS[0] + "=" + "\\frac{" + math_HS[1] + "}{" + selection.selected_text + "}";
          }
          new_math_str = new_math_str.replace(/=$/, "=1").replace(/^=/, "1=");
          resolve(new_math_str);
        });
      });
    } else if (selection.selected_nodes[0].model.id.split("/")[1] > equals_node.model.id.split("/")[1]) { //after eq sign
      LHS_width = tot_width($equals.prevAll(), false, false);
      var before_eq = false, before_eq_nodes=[];
      for (var i=math_root.children.length-1; i>=0; i--) {
        if (before_eq) {before_eq_nodes.push(math_root.children[i])}
        if (math_root.children[i].children[0].type === "rel") {before_eq = true;}
      }
      var include_in_frac = before_eq_nodes.length === 1
          && before_eq_nodes[0].children.length === 1
          && before_eq_nodes[0].children[0].type2 === "frac";
      h_offset = selection.$selected.offset().left - $equals.offset().left + (LHS_width)/2;
      v_offset = selection.$selected.outerHeight(includeMargin=true)/2;
      if (include_in_frac) {v_offset = 0;}
      $equals.prevAll().animate({top:-v_offset, left:tot_width(selection.$selected, true, false)/2}, step_duration);
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:-h_offset, top:v_offset}, step_duration).promise().done(function() {
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, "");
          math_HS = new_math_str.split("="); //HS=hand sides
          if (include_in_frac) {
            new_math_str = "\\frac{" + before_eq_nodes[0].children[0].children[0].text + "}{" + before_eq_nodes[0].children[0].children[1].text + selection.selected_text + "}" + "=" + math_HS[1];
          } else {
            new_math_str = "\\frac{" + math_HS[0] + "}{" + selection.selected_text + "}" + "=" + math_HS[1];
          }
          new_math_str = new_math_str.replace(/=$/, "=1").replace(/^=/, "1=");
          resolve(new_math_str);
        });
      });
    }
  }
  //denominator
  else if (selection.selected_nodes[0].parent.type == "denominator"
    || selection.selected_nodes[0].type === "denominator"
    || (selection.selected_nodes[0].type === "factor" && selection.selected_nodes[0].model.id.split("/").length === 6 && selection.selected_nodes[0].parent.parent.type === "denominator"))
  {
    console.log("changing denominator of side");
    if (selection.selected_nodes[0].model.id.split("/")[1] < equals_node.model.id.split("/")[1]) { //before eq sign
      RHS_width = tot_width($equals.nextAll(), false, false);
      var after_eq = false, after_eq_nodes=[];
      for (var i=0; i<math_root.children.length; i++) {
        if (after_eq) {after_eq_nodes.push(math_root.children[i])}
        if (math_root.children[i].children[0].type === "rel") {after_eq = true;}
      }
      var include_in_frac = after_eq_nodes.length === 1
          && after_eq_nodes[0].children.length === 1
          && after_eq_nodes[0].children[0].type2 === "frac";
      h_offset = $equals.offset().left - selection.$selected.offset().left + tot_width($equals, true, false) + (RHS_width)/2;
      v_offset = selection.$selected.outerHeight(includeMargin=true)/2;
      if (include_in_frac) {v_offset*=2;}
      $equals.nextAll().animate({left: tot_width(selection.$selected, true, false)/2}, step_duration);
      if (include_in_frac) {
        $equals.prevAll().animate({top: selection.$selected.outerHeight(includeMargin=true)/2}, step_duration);
        v_offset+=selection.$selected.outerHeight(includeMargin=true)/2;
      }
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:h_offset, top:-v_offset}, step_duration).promise().done(function() {
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, "");
          math_HS = new_math_str.split("="); //HS=hand sides
          if (include_in_frac) {
            new_math_str = math_HS[0].replace(/\\frac{([ -~]+)}{}/, "$1") + "=" + "\\frac{" + after_eq_nodes[0].children[0].children[0].text + selection.selected_text + "}{" + after_eq_nodes[0].children[0].children[1].text + "}";
          } else if (after_eq_nodes.length > 1) {
            new_math_str = math_HS[0] + "=" + selection.selected_text + "(" + math_HS[1] + ")" ;
          } else {
            new_math_str = math_HS[0] + "=" + selection.selected_text + math_HS[1] ;
          }
          new_math_str = new_math_str.replace(/\\frac{([ -~]+)}{}/, "$1").replace(/=$/, "=1").replace(/^=/, "1=");
          resolve(new_math_str);
        });
      });
    } else if (selection.selected_nodes[0].model.id.split("/")[1] > equals_node.model.id.split("/")[1]) { //after eq sign
      LHS_width = tot_width($equals.prevAll(), false, false);
      var before_eq = false, before_eq_nodes=[];
      for (var i=math_root.children.length-1; i>=0; i--) {
        if (before_eq) {before_eq_nodes.push(math_root.children[i])}
        if (math_root.children[i].children[0].type === "rel") {before_eq = true;}
      }
      var include_in_frac = before_eq_nodes.length === 1
          && before_eq_nodes[0].children.length === 1
          && before_eq_nodes[0].children[0].type2 === "frac";
      h_offset = selection.$selected.offset().left - $equals.offset().left + (LHS_width)/2;
      v_offset = selection.$selected.outerHeight(includeMargin=true)/2;
      if (include_in_frac) {v_offset*=2;}
      $equals.prevAll().animate({left:tot_width(selection.$selected, true, false)/2}, step_duration);
      if (include_in_frac) {
        $equals.nextAll().animate({top: selection.$selected.outerHeight(includeMargin=true)/2}, step_duration);
        v_offset+=selection.$selected.outerHeight(includeMargin=true)/2;
      }
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:-h_offset, top:-v_offset}, step_duration).promise().done(function() {
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, "");
          math_HS = new_math_str.split("="); //HS=hand sides
          if (include_in_frac) {
            new_math_str = "\\frac{" + before_eq_nodes[0].children[0].children[0].text + selection.selected_text + "}{" + before_eq_nodes[0].children[0].children[1].text + "}" + "=" + math_HS[1].replace(/\\frac{([ -~]+)}{}/, "$1");
          } else {
            new_math_str = math_HS[0] + selection.selected_text + "=" + math_HS[1];
          }
          // console.log(new_math_str);
          new_math_str = new_math_str.replace(/=$/, "=1").replace(/^=/, "1=");
          // console.log(new_math_str);
          resolve(new_math_str);
        });
      });
    }
  }
  //power.
  //NEED TO ADD option for selecting factor or term within power, just like for fractions..
  else if (selection.selected_nodes[0].type === "power"
    && selection.selected_nodes.length === 1
    //and it comes from a top level term, plus there is only one term on the side of the selected sign:
    && ((selection.$selected.parent().prevAll(".mrel").length !== 0
        && get_prev(math_root, [math_root.children[math_root.children.length-1]]).children[0].type === "rel") //LHS
      || (selection.$selected.parent().nextAll(".mrel").length !== 0
        && get_next(math_root, [math_root.children[0]]).children[0].type === "rel")))
  {
    console.log("changing power of side");
    if (selection.$selected.parent().prevAll(".mrel").length === 0) { //before eq sign
      var offset = this.eqCoords.end_of_equation.left - this.eqCoords.equals_position.left;
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:offset}, step_duration).promise().done(function() {
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, "");
          math_HS = new_math_str.split("="); //HS=hand sides
          if (selection.selected_nodes[0].text === "2") {
            new_math_str = math_HS[0] + "=" + "\\sqrt{" + math_HS[1] + "}";
          } else {
            if (selection.selected_nodes[0].children.length === 1 && selection.selected_nodes[0].children[0].children.length ===1 && selection.selected_nodes[0].children[0].children[0].type2 === "frac") {
              new_math_str = math_HS[0] + "=" + add_brackets(math_HS[1]) + "^{" + flip_fraction([selection.selected_nodes[0].children[0].children[0]]) + "}";
            } else {
              new_math_str = math_HS[0] + "=" + add_brackets(math_HS[1]) + "^{" + "\\frac{1}{" + selection.selected_text + "}}"; //add brackets
            }
          }
          resolve(new_math_str);
        });
      });
    } else if (selection.$selected.parent().nextAll(".mrel").length === 0) { //after eq sign
      var offset = this.eqCoords.end_of_equation.left - this.eqCoords.equals_position.left;
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:-offset}, step_duration).promise().done(function() {
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, "");
          math_HS = new_math_str.split("="); //HS=hand sides
          if (selection.selected_nodes[0].text === "2") {
            new_math_str = "\\sqrt{" + math_HS[0] + "}" + "=" + math_HS[1];
          } else {
            if (selection.selected_nodes[0].children.length === 1 && selection.selected_nodes[0].children[0].children.length ===1 && selection.selected_nodes[0].children[0].children[0].type2 === "frac") {
              new_math_str = add_brackets(math_HS[0]) + "^{" + flip_fraction([selection.selected_nodes[0].children[0].children[0]]) + "}" + "=" + math_HS[1];
            } else {
              new_math_str = add_brackets(math_HS[0]) + "^{" + "\\frac{1}{" + selection.selected_text + "}}" + "=" + math_HS[1]; //add brackets
            }
          }
          resolve(new_math_str);
        });
      });
    }
  }
  //log/power base
  else if (selection.selected_nodes[0].type === "base" && selection.selected_nodes.length === 1
    //and it comes from a top level term, plus there is only one term on the side of the selected thing:
    && ((selection.selected_nodes[0].parent.model.obj.prevAll(".mrel").length !== 0
        && get_prev(math_root, [math_root.children[math_root.children.length-1]]).children[0].type === "rel")
      || (selection.selected_nodes[0].parent.model.obj.nextAll(".mrel").length !== 0
        && get_next(math_root, [math_root.children[0]]).children[0].type === "rel")))
  {
    //ANIMATION??
    console.log("changing base of side");
    let node = selection.selected_nodes[0];
    console.log(node.parent);
    let base_text = node.text;
    if (node.parent.type2 === "log") {
      if (node.children.length > 1 || node.children[0].children[0].type2 === "exp" || node.children[0].children[0].type2 === "group_exp") base_text = "(" + base_text + ")";
    } else if (node.parent.type2 === "exp" || node.parent.type2 === "group_exp") {
      if (node.children.length > 1) base_text = "(" + base_text + ")";
    }
    let body_text = node.parent.children[1].text;
    new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, "");
    math_HS = new_math_str.split("="); //HS=hand sides
    if (node.parent.model.obj.nextAll(".mrel").length !== 0) { //before eq sign
      let offset = this.eqCoords.end_of_equation.left - this.eqCoords.equals_position.left;
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:offset}, step_duration).promise().done(function() {
          let new_math_str;
          if (node.parent.type2 === "log") {
            new_math_str = body_text + "=" + base_text + "^{" + math_HS[1] + "}";
          } else if (node.parent.type2 === "exp" || node.parent.type2 === "group_exp") {
            new_math_str = body_text + "=\\log_{" + base_text + "}{" + math_HS[1] + "}";
          }
          resolve(new_math_str);
        });
      });
    } else if (node.parent.model.obj.prevAll(".mrel").length !== 0) { //after eq sign
      let offset = this.eqCoords.end_of_equation.left - this.eqCoords.equals_position.left;
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:-offset}, step_duration).promise().done(function() {
          let new_math_str;
          if (node.parent.type2 === "log") {
            new_math_str = base_text + "^{" + math_HS[0] + "}=" + body_text;
          } else if (node.parent.type2 === "exp" || node.parent.type2 === "group_exp") {
            new_math_str = "\\log_{" + base_text + "}{" + math_HS[0] + "}=" + body_text;
          }
          resolve(new_math_str);
        });
      });
    }
  }

  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(1);}
};

//move term within expression, or factor within term
export function move_right(){
  let math_root = this.math_root;
  let selection = this.selection;
  //moving factor or term
  if (selection.$selected.next().filter(".mrel").length === 0)
  {
    var include_op;
    if (selection.selected_nodes[0].type === "factor") {
      include_op = false;
    } else if (selection.selected_nodes[0].type === "term") {
      include_op = true;
    } else {
      return;
    }
    var selected_width = tot_width(selection.$selected, true, include_op);
    var selected_text_str, next_text_str;
    var next_node = get_next(math_root, selection.selected_nodes);
    var $selected_next = next_node.model.obj;
    var selected_next_width = tot_width($selected_next, true, include_op);
    //check if it's a multiplication operator, and if so, get next thing
    if (next_node.type2 === "op" && next_node.optype === "mult") {
      next_node = get_next(math_root, next_node)
      var width_diff = selected_next_width - selected_width;
      var $selected_next = next_node.model.obj;
      var selected_next_width = tot_width($selected_next.add($selected_next.prev()), true, include_op);
      var selected_width = selected_width + tot_width($selected_next.prev(), true, include_op);
      $selected_next.first().prev().animate({left:width_diff}, step_duration)
    }
    $selected_next.animate({left:-selected_width}, step_duration); //animation should take into account possibly missing operator
    return new Promise((resolve, reject) => {
      selection.$selected.animate({left:selected_next_width}, step_duration).promise().done(function() {
        if (!has_op(selection.$selected) && selection.selected_nodes[0].type === "term") {selected_text_str = "+" + selection.selected_text;} else {selected_text_str = selection.selected_text;}
        next_text = next_node.text;
        if (!has_op($selected_next) && selection.selected_nodes[0].type === "term") {next_text_str = "+" + next_text;} else {next_text_str = next_text;}
        new_math_str = replace_in_mtstr(math_root, [next_node].concat(selection.selected_nodes), [selected_text_str, next_text_str]);
        resolve(new_math_str);
      });
    });
  }
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(4);}
}

export function move_left() {
  let math_root = this.math_root;
  let selection = this.selection;
  //moving factor or term
  if (selection.$selected.prev().filter(".mrel").length === 0)
  {
    var include_op;
    if (selection.selected_nodes[0].type === "factor") {
      // console.log("moving factor left")
      include_op = false;
    } else if (selection.selected_nodes[0].type === "term") {
      // console.log("moving term right")
      include_op = true;
    } else {
      return;
    }
    var selected_width = tot_width(selection.$selected, true, include_op);
    var selected_text_str, prev_text_str;
    var prev_node = get_prev(math_root, selection.selected_nodes);
    var $selected_prev = prev_node.model.obj;
    var selected_prev_width = tot_width($selected_prev, true, include_op);
    //check if it's a multiplication operator, and if so, get prev thing
    if (prev_node.type2 === "op" && prev_node.optype === "mult") {
      prev_node = get_prev(math_root, prev_node)
      var $selected_prev = prev_node.model.obj;
      var width_diff = selected_prev_width - selected_width;
      var selected_prev_width = tot_width($selected_prev.add($selected_prev.next()), true, include_op);
      var selected_width = selected_width + tot_width($selected_prev.next(), true, include_op);
      $selected_prev.last().next().animate({left:-width_diff}, step_duration)

    }
    $selected_prev.animate({left:selected_width}, step_duration);
    return new Promise((resolve, reject) => {
      selection.$selected.animate({left:-selected_prev_width}, step_duration).promise().done(function() {
        if (!has_op(selection.$selected) && selection.selected_nodes[0].type === "term") {selected_text_str = "+" + selection.selected_text;} else {selected_text_str = selection.selected_text;}
        prev_text = prev_node.text;
        if (!has_op($selected_prev) && selection.selected_nodes[0].type === "term") { prev_text_str = "+" + prev_text;} else {prev_text_str = prev_text;}
        new_math_str = replace_in_mtstr(math_root, [prev_node].concat(selection.selected_nodes), [selected_text_str, prev_text_str]);
        resolve(new_math_str);
      });
    });
  }
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(5);}
}

//move up and down in a fraction
export function move_up() {
  let math_root = this.math_root;
  let selection = this.selection;
  var same_parents = have_same_ancestors(selection.selected_nodes, 1),
    same_type2 = have_same_type(selection.selected_nodes,1),
    same_type = have_same_type(selection.selected_nodes);

  // factors in single term in denominator
  if (selection.selected_nodes[0].type === "factor"
    && same_type
    && same_parents
    && !any_of_type(selection.selected_nodes,"frac", 1)
    && Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.type2") === "frac"
    && selection.selected_nodes[0].parent.parent.children.length === 1)
  {
    console.log("moving up factor");
    var numerator = selection.selected_nodes[0].parent.parent.parent.children[0];
    var new_nom_text = exponentiate(selection.selected_nodes, false, "-1");
    if (numerator.children.length === 1) {
      new_nom_text+=(numerator.text === "1" ? "" : numerator.text);
    } else {
      new_nom_text+="(" + numerator.text + ")";
    }
  }
  //single term in denominator
  else if (selection.selected_nodes[0].type === "term"
    && selection.selected_nodes.length === 1
    && Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.type2") === "frac"
    && selection.selected_nodes[0].parent.children.length === 1)
  {
    console.log("moving up term");
    var numerator = selection.selected_nodes[0].parent.parent.children[0];
    var new_nom_text = exponentiate(selection.selected_nodes[0].children, false, "-1");
    if (numerator.children.length === 1) {
      new_nom_text+=numerator.text;
    } else {
      new_nom_text+="(" + numerator.text + ")";
    }
  }
  //selecting denominator directly
  else if (selection.selected_nodes[0].type === "denominator"
    && selection.selected_nodes.length === 1
    && selection.selected_nodes[0].parent.type2 === "frac"
    && selection.selected_nodes[0].children.length === 1)
  {
    console.log("moving up denominator");
    var numerator = selection.selected_nodes[0].parent.children[0];
    var new_nom_text = "";
    if (selection.selected_nodes[0].children.length === 1) {
      new_nom_text = exponentiate(selection.selected_nodes[0].children[0].children, false, "-1");
    } else {
      new_nom_text="("+selection.selected_nodes[0]+")^{-1}";
    }
    if (numerator.children.length === 1) {
      new_nom_text+=numerator.text;
    } else {
      new_nom_text+="(" + numerator.text + ")";
    }
  }
  else if (selection.selected_nodes[0].type === "factor"
    && Bro(selection.selected_nodes[0]).iCanHaz("type2") === "frac"
    && Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.type2") === "frac"
    && selection.selected_nodes[0].parent.parent.children.length === 1)
  {
    console.log("moving up fraction");
    var numerator = selection.selected_nodes[0].parent.parent.parent.children[0];
    var new_nom_text = flip_fraction(selection.selected_nodes);
    if (numerator.children.length === 1) {
      new_nom_text+=(numerator.text === "1" ? "" : numerator.text);
    } else {
      new_nom_text+="(" + numerator.text + ")";
    }
  }
  var selected_width = tot_width(selection.$selected, true, false);
    var extra_selected_width = tot_width(math_root.first(function(node) {return node.type2 === "normal"}).model.obj, true, false)*1;
    var h_offset = selection.$selected.offset().left - numerator.model.obj.offset().left + selected_width/2 + extra_selected_width/2;
    var v_offset = selection.$selected.outerHeight()*1.5;
    numerator.model.obj.animate({left:selected_width/2+extra_selected_width/2}, step_duration);
    selection.$selected.last().nextAll().animate({left:-selected_width-extra_selected_width/2}, step_duration);
    selection.$selected.first().prevAll().animate({left:-extra_selected_width/2}, step_duration);
    return new Promise((resolve, reject) => {
      selection.$selected.animate({left:-h_offset, top:-v_offset}, step_duration).promise().done(function() {
        new_math_str = replace_in_mtstr(math_root, [numerator].concat(selection.selected_nodes), new_nom_text); //this just changes text of numerator and deletes selection.selected_nodes
        resolve(new_math_str);
      });
    });
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(2);}
}

export function move_down() {
  let math_root = this.math_root;
  let selection = this.selection;
  var same_parents = have_same_ancestors(selection.selected_nodes, 1);

  if (same_parents) {
    var new_denom_text = "";
    function move_down_frac(denominator) {
      console.log("moving down in fraction");
      if (denominator.children.length === 1) {
        new_denom_text+=denominator.text;
      } else {
        new_denom_text+="(" + denominator.text + ")";
      }
      var selected_width = tot_width(selection.$selected, true, false);
      var extra_selected_width = tot_width(math_root.first(function(node) {return node.type2 === "normal"}).model.obj, true, false)*1;
      var h_offset = selection.$selected.offset().left - denominator.model.obj.offset().left + selected_width/2 + extra_selected_width/2;
      var v_offset = selection.$selected.outerHeight()*1.5;
      denominator.model.obj.animate({left:selected_width/2+extra_selected_width/2}, step_duration);
      selection.$selected.last().nextAll().animate({left:-selected_width-extra_selected_width/2}, step_duration);
      selection.$selected.first().prevAll().animate({left:-extra_selected_width/2}, step_duration);
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:-h_offset, top:v_offset}, step_duration).promise().done(function() {
          new_math_str = replace_in_mtstr(math_root, [denominator].concat(selection.selected_nodes), new_denom_text);
          resolve(new_math_str);
        });
      });
    }
    //selected factor
    if (selection.selected_nodes[0].type === "factor"
    && selection.selected_nodes[0].parent.parent.parent
    && selection.selected_nodes[0].parent.parent.parent.type2 === "frac"
    && selection.selected_nodes[0].parent.parent.children.length === 1)
    {
      new_denom_text = exponentiate(selection.selected_nodes, false, "-1");
      var denominator = selection.selected_nodes[0].parent.parent.parent.children[1];
      return move_down_frac(denominator)
    }
    //selected term
    else if (selection.selected_nodes[0].type === "term"
    && selection.selected_nodes.length === 1
    && selection.selected_nodes[0].parent.parent
    && selection.selected_nodes[0].parent.parent.type2 === "frac"
    && selection.selected_nodes[0].parent.children.length === 1)
    {
      if (selection.selected_nodes[0].children.length === 1) {
        new_denom_text = selection.selected_nodes[0].text + "^{-1}";
      } else {
        new_denom_text = exponentiate(selection.selected_nodes[0].children, false, "-1");
      }
      var denominator = selection.selected_nodes[0].parent.parent.children[1];
      return move_down_frac(denominator)
    }
    //selected numerator
    else if (selection.selected_nodes[0].type === "numerator"
    && selection.selected_nodes.length === 1
    && selection.selected_nodes[0].parent
    && selection.selected_nodes[0].parent.type2 === "frac"
    && selection.selected_nodes[0].children.length === 1)
    {
      if (selection.selected_nodes[0].children.length === 1) {
        new_denom_text = selection.selected_nodes[0].text + "^{-1}";
      } else {
        new_denom_text = exponentiate(selection.selected_nodes[0].children[0].children, false, "-1");
      }
      var denominator = selection.selected_nodes[0].parent.children[1];
      return move_down_frac(denominator)
    }
    else
    {
      var selected_width = tot_width(selection.$selected, true, false);
      var extra_selected_width = tot_width(math_root.first(function(node) {return node.type2 === "normal"}).model.obj, true, false)*1;
      var h_offset = selected_width/2 + extra_selected_width/2;
      var v_offset = selection.$selected.outerHeight()*1.5;
      selection.$selected.last().nextAll().animate({left:-selected_width-extra_selected_width/2}, step_duration);
      selection.$selected.first().prevAll().animate({left:-extra_selected_width/2}, step_duration);
      return new Promise((resolve, reject) => {
        selection.$selected.animate({left:-h_offset, top:v_offset}, step_duration).promise().done(function() {
          new_nom_text = "";
          new_denom_text = exponentiate(selection.selected_nodes, false, "-1");
          var begin_i = (selection.selected_nodes[0].parent.children[0].type2 === "op") ? 1 : 0;
          for (var i = begin_i; i <selection.selected_nodes[0].parent.children.length; i++) {
            for (var k = selection.selected_nodes.length - 1; k >= 0; k--) {
              if (selection.selected_nodes[0].parent.children[i].model.id !== selection.selected_nodes[k].model.id) {
                new_nom_text+=selection.selected_nodes[0].parent.children[i].text;
              }
            };
          };
          new_text = "\\frac{"+new_nom_text+"}{"+new_denom_text+"}";
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes[0].parent.children.slice(begin_i), new_text);
          resolve(new_math_str);
        });
      });
    }
  }
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(6);}
}

// document.getElementById("split").onclick = split;
export function split() {
  let math_root = this.math_root;
  let selection = this.selection;
  var same_factor = true,
    same_parents = have_same_ancestors(selection.selected_nodes, 1),
    // same_grandparents = have_same_ancestors(selection.selected_nodes, 2),
    same_ggparents = have_same_ancestors(selection.selected_nodes, 3),
    same_type = have_same_type(selection.selected_nodes);
    // same_type2 = have_same_type(selection.selected_nodes,1)
  console.log(selection.selected_nodes);
  //split factors out of a fraction
  if (selection.selected_nodes[0].type === "factor"
      && same_type && same_ggparents
      && Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.type2") === "frac"
      && Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.children.0.children.length") === 1)
  {
    console.log("split factors out of a fraction");
    //ANIMATION?
    var numerator_text = "", denominator_text = "", numerator_text2 = "", denominator_text2 = "";
    var numerator_factors = selection.selected_nodes[0].parent.parent.parent.children[0].children[0].children;
    var denominator_factors;
    for (var j=0; j<numerator_factors.length; j++) {
      var do_continue = false;
      for (var k=0; k<selection.selected_nodes.length; k++) {
        if (numerator_factors[j].model.id === selection.selected_nodes[k].model.id) {do_continue = true;}
      }
      if (do_continue) {continue;}
      numerator_text2+=numerator_factors[j].text;
    }
    for (var i=0; i<selection.selected_nodes.length; i++) {
      if (selection.selected_nodes[i].parent.parent.type === "numerator") {
        numerator_text+=selection.selected_nodes[i].text;
      } else if (selection.selected_nodes[i].parent.parent.type === "denominator") {
        denominator_text+=selection.selected_nodes[i].text;
      }
    }
    if (denominator_text !== "" && denominator_text !== selection.selected_nodes[0].parent.parent.parent.children[1].text) {
      if (!(selection.selected_nodes[0].parent.parent.parent.children[1].children.length === 1)) {
        return;
      } else {
        var denominator_factors = selection.selected_nodes[0].parent.parent.parent.children[1].children[0].children;
        for (var j=0; j<denominator_factors.length; j++) {
          do_continue = false;
          for (var k=0; k<selection.selected_nodes.length; k++) {
            if (denominator_factors[j].model.id === selection.selected_nodes[k].model.id) {do_continue = true;}
          }
          console.log(denominator_factors);
          if (do_continue) {continue;}
          denominator_text2+=denominator_factors[j].text;
        }
      }
    } else if (denominator_text === "") {
      denominator_text2 = selection.selected_nodes[0].parent.parent.parent.children[1].text;
    } else if (denominator_text === selection.selected_nodes[0].parent.parent.parent.children[1].text) {
      denominator_text2 = "";
    }
    var new_text = "\\frac{" + numerator_text + "}{" + denominator_text + "}" + "\\frac{" + numerator_text2 + "}{" + denominator_text2 + "}";
    new_math_str = replace_in_mtstr(math_root, [selection.selected_nodes[0].parent.parent.parent], new_text);
    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }
  //split factors out of logs
  if (selection.selected_nodes[0].type === "factor"
      && same_type && same_ggparents
      && Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.type2") === "log"
      && (Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.children.length") === 1
          && Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.children.0.children.length") === 1
            ||
          Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.children.length") === 2
          && Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.children.1.children.length") === 1))
  {
    console.log("split factors out of a log");
    //ANIMATION?
    let log_fact = selection.selected_nodes[0].parent.parent.parent;
    let body_factors = log_fact.children[log_fact.children.length-1].children[0].children ;
    let body_text = multiply(body_factors.filter(x => {
      let result = true;
      for (var k=0; k<selection.selected_nodes.length; k++) {
        if (x.model.id === selection.selected_nodes[k].model.id) result = false;
      }
      return result;
    }));
    let body_text2 = multiply(selection.selected_nodes);
    let base_text = log_fact.children.length === 1 ? "" : log_fact.children[0].text;
    var new_text = "\\log_{" + base_text + "}{" + body_text + "}+ \\log_{" + base_text + "}{" + body_text2 + "}";
    let new_math_str;
    if (log_fact.parent.children.length === 1) {
      new_math_str = replace_in_mtstr(math_root, [log_fact.parent], new_text);
    } else if (log_fact.parent.children.length === 2 && (log_fact.parent.children[0].text === "-" || log_fact.parent.children[0].text === "+")) {
      let sign = log_fact.parent.children[0].text;
      new_text = sign + new_text;
      new_math_str = replace_in_mtstr(math_root, [log_fact.parent], new_text);
    } else {
      new_text = "(" + new_text + ")";
      new_math_str = replace_in_mtstr(math_root, [log_fact], new_text);
    }
    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }

}

// document.getElementById("merge").onclick = merge;
export function merge() {
  let math_root = this.math_root;
  let selection = this.selection;
  var same_factor = true,
    same_parents = have_same_ancestors(selection.selected_nodes, 1),
    // same_grandparents = have_same_ancestors(selection.selected_nodes, 2),
    // same_ggparents = have_same_ancestors(selection.selected_nodes, 3),
    same_type = have_same_type(selection.selected_nodes),
    same_type2 = have_same_type(selection.selected_nodes,1),
    same_log_base = have_same_log_base(selection.selected_nodes.map(x => x.children[x.children.length-1])),
    are_logs = are_of_type(selection.selected_nodes.map(x => x.children[x.children.length-1]), "log",1),
    same_grandparents = have_same_ancestors(selection.selected_nodes, 2);

    //merge fractions into fraction
    if (selection.selected_nodes[0].type2 === "frac" && same_parents && same_type)
    {
      console.log("merge fractions into fraction");
      //ANIMATION??
      let numerator_text = multiply(selection.selected_nodes.map(x => (x.type2 === "frac" ? x.children[0] : x)));
      let denominator_text = multiply(selection.selected_nodes.filter(x => x.type2 === "frac").map(x => x.children[1]));
      var new_text = "\\frac{" + numerator_text + "}{" + denominator_text + "}";
      let new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_text);
      return new Promise((resolve, reject) => {resolve(new_math_str)});
    }
    //merge logs into log
    if (are_logs && same_grandparents && same_type && same_log_base)
    {
      console.log("merge logs into log");
      //ANIMATION??
      let body_text = multiply(selection.selected_nodes.map(x => {
        let c = x.children;
        let first_fact = x.children[0].text;
        let gchild = c[c.length-1];
        let ggchild = gchild.children[gchild.children.length-1];
        if (first_fact === "-") {
          let new_text = flip_fraction({ ...ggchild, type2: "normal"});
          console.log("new_text", new_text);
          return {...ggchild, text: new_text};
        } else {
          return ggchild;
        }
      }))
      let base_text = "";
      let factor = selection.selected_nodes[0].children[selection.selected_nodes[0].children.length-1];
      if (factor.children === 2) base_text += factor.children[0].text;
      let new_text = "+\\log_{" + base_text + "}{" + body_text + "}";
      let new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_text);
      return new Promise((resolve, reject) => {resolve(new_math_str)});
    }
}

//distributing in stuff
export function distribute_in() {
  let math_root = this.math_root;
  let selection = this.selection;
  var same_factor = true,
    same_parents = have_same_ancestors(selection.selected_nodes, 1),
    same_grandparents = have_same_ancestors(selection.selected_nodes, 2),
    same_ggparents = have_same_ancestors(selection.selected_nodes, 3),
    same_type = have_same_type(selection.selected_nodes),
    same_type2 = have_same_type(selection.selected_nodes,1);
  var factor_text = [], bool = false, j = 0;
  for (var i=0; i<selection.selected_nodes.length-1; i++) {//making sure all factors are the same
    if (bool) {
      if (selection.selected_nodes[i].text !== factor_text[j]) {same_factor = false}
      j++;
    } else {
      factor_text.push(selection.selected_nodes[i].text);
    }
    if (selection.selected_nodes[i].parent !== selection.selected_nodes[i+1].parent) {bool = true; j = 0;}
  }

  var grouped = [];
  for (var i=0; i<selection.selected_nodes.length; i++) {//identifying grouped element
    if (selection.selected_nodes[i].type2 === "group") {
      grouped.push(selection.selected_nodes[i]);
    } else {
      factors_text+=selection.selected_nodes[i].text;
    }
  }

  //distribute in
  if (selection.selected_nodes[0].type === "factor" && same_type && same_parents && grouped.length > 0)
  {
    var factors_text = "";
      // console.log(selection.selected_nodes);
      for (var i=0; i<selection.selected_nodes.length-1; i++) { //THE last factor is the one over which I should distribute.
        factors_text+=selection.selected_nodes[i].text;
      }
    var grouped_node = grouped[grouped.length-1];
    // console.log("distribute in", factors_text, grouped_node);
    return new Promise((resolve, reject) => {
      selection.$selected.animate({"font-size": 0, opacity: 0}, step_duration) //IMPROVE ANIMATION (FOR EXAMPLE CLONE)
        .css('overflow', 'visible')
        .promise()
        .done(function() {
          var text = "";
          for (var i=0; i<grouped_node.children.length; i++) {
            let temp_node = {text: factors_text, children: [], type: "temp"}
            text += multiply([temp_node, grouped_node.children[i]])
          }
          if (selection.selected_nodes[0].parent.children.length > selection.selected_nodes.length) {
            var new_text = "(" + text + ")"
          } else {
            var new_text = text
          }
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_text);
          // console.log(text, new_math_str);
          resolve(new_math_str);
        });
      });
  }
  //split fractions into terms when selecting factors
  else if (selection.selected_nodes[0].type2 === "frac" && same_type2)
  {
    console.log("split fractions into terms when selecting factors");
    //ANIMATION? SHOULD CLONE THE denominator AND MOVE TO THE RIGHT PLACES
    var new_terms = [];
    for (var i=0; i<selection.selected_nodes.length; i++) {
      if (selection.selected_nodes[i].children[0].children.length > 1) {
        var new_term="";
        for (var j=0; j<selection.selected_nodes[i].children[0].children.length; j++) {
          new_term += "+" + "\\frac{" + selection.selected_nodes[i].children[0].children[j].text + "}{" + selection.selected_nodes[i].children[1].text + "}";
        }
        new_terms.push("(" + new_term + ")");
      } else {
        new_terms.push(selection.selected_nodes[i].text);
      }
    }
    new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_terms);
    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }
  //split fraction into terms when selecting terms
  else if (selection.selected_nodes[0].type === "term" && selection.selected_nodes.length === 1 //because I'm not checking the subsequent stuff for a multiselection
    && ((selection.selected_nodes[0].children.length === 1 && selection.selected_nodes[0].children[0].type2 === "frac")
        || (selection.selected_nodes[0].children.length === 2 && selection.selected_nodes[0].children[1].type2 === "frac" && selection.selected_nodes[0].children[0].type2 === "op")))
  {
      //ANIMATION? SHOULD CLONE THE denominator AND MOVE TO THE RIGHT PLACES
    var new_terms = [];
    var index = 0;
    if (selection.selected_nodes[0].children.length === 2 && selection.selected_nodes[0].children[1].type2 === "frac" && selection.selected_nodes[0].children[0].type2 === "op") {index = 1;}
    for (var i=0; i<selection.selected_nodes.length; i++) {
      if (selection.selected_nodes[i].children[index].children[0].children.length > 1) {
        var new_term="";
        for (var j=0; j<selection.selected_nodes[i].children[index].children[0].children.length; j++) {
          new_term += "+" + "\\frac{" + selection.selected_nodes[i].children[index].children[0].children[j].text + "}{" + selection.selected_nodes[i].children[index].children[1].text + "}";
        }
        new_terms.push("+(" + new_term + ")");
      } else {
        new_terms.push(selection.selected_nodes[i].text);
      }
    }
    new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_terms);
    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }
  //split square root. Need to make it work with fractions
  else if (selection.selected_nodes[0].type2 === "sqrt" && selection.selected_nodes[0].children.length === 1)
  {
    //ANIMATION??
    var factors = selection.selected_nodes[0].children[0].children;
    var text = "";
    for (var i=0; i<factors.length; i++) {
        text+="\\sqrt{" + factors[i].text + "}";
      }
    new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, text);
    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }
  //distribute power in
  else if (selection.selected_nodes.length === 1
    && Bro(selection.selected_nodes[0]).iCanHaz("children.0.children.length") === 1
    && (Bro(selection.selected_nodes[0]).iCanHaz("children.0.children.0.children.length") > 1
      || Bro(selection.selected_nodes[0]).iCanHaz("children.0.children.0.children.0.type2") === "frac")
    && (Bro(selection.selected_nodes[0]).iCanHaz("type2") === "exp"
      || Bro(selection.selected_nodes[0]).iCanHaz("type2") === "group_exp"))
  {
    console.log("distributing power in");
    //ANIMATION?
    var power_text = selection.selected_nodes[0].children[1].text;
    var base_factors = selection.selected_nodes[0].children[0].children[0].children;
    console.log("base_factors", base_factors, "power_text", power_text);
    var text = exponentiate(base_factors, false, power_text,true);
    new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, text);
    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }
  //split exponential with terms into exponentials
  else if (selection.selected_nodes.length === 1  && selection.selected_nodes[0].children.length > 1
    && selection.selected_nodes[0].type === "power")
  {
    console.log("split exponential with terms into exponentials");
    //ANIMATION?
    var base_text;
    if (selection.selected_nodes[0].parent.children[0].children.length === 1 && selection.selected_nodes[0].parent.children[0].children[0].children.length === 1) {
      base_text = selection.selected_nodes[0].parent.children[0].text;
    } else {
      base_text = "(" + selection.selected_nodes[0].parent.children[0].text + ")";
    }
    var text = ""
    var power_terms = selection.selected_nodes[0].children;
    for (var i=0; i<power_terms.length; i++) {
      text+=base_text + "^{" + power_terms[i].text + "}";
    }
    new_math_str = replace_in_mtstr(math_root, [selection.selected_nodes[0].parent], text);
    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }

  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(8);}
}

//merging stuff
export function collect_out() {
  let math_root = this.math_root;
  let selection = this.selection;
  var same_parents = have_same_ancestors(selection.selected_nodes, 1),
  same_grandparents = have_same_ancestors(selection.selected_nodes, 2),
  same_type = have_same_type(selection.selected_nodes),
  same_type2 = have_same_type(selection.selected_nodes,1),
  same_text = have_same_text(selection.selected_nodes),
  single_factor = have_single_factor(selection.selected_nodes),
  are_fracs = are_of_type(selection.selected_nodes.map(function(x) {var index = x.children.length-1; return Bro(x).iCanHaz("children."+index.toString())}), "frac",1),
  same_term = are_same_terms(selection.selected_nodes),
  same_factors = true;

  //Factors

  function create_fact_subs(term, fact_cnt) {
    //just defining this function because it's called twice below
    //TODO: NEED TO FIX IT IN CASE THE PARENT TERM HAS OPERATOR
    console.log("factor_texts", factor_texts)
    var op_shift = 0;
    if (term.children[0].type2 === "op") {
      op_shift = 1;
    }
    var term_factors = term.children.length - op_shift;
    if (term_factors > fact_cnt) {
      for (var k=0; k<fact_cnt; k++) {
        fact_subs.push("");
      }
    } else if (term_factors === fact_cnt) {
      fact_subs.push("1");
      for (var k=1; k<fact_cnt; k++) {
        fact_subs.push("");
      }
    }
    else {throw "Error in the loop that creates factors. Somehow there were more factors selected inside a term, than there are in the term..."}
  }
  var factor_texts = [], term_ids = [], fact_subs=[], fact_cnt=[]; //fact_subs is to know what I should replace the factors I will be removing with. See uses below..
  if (selection.selected_nodes[0].type==="factor" && same_type) {
    var j=0;
    factor_texts[j] = selection.selected_nodes[0].text;
    fact_cnt[j]=1;
    if (selection.selected_nodes[0].parent.parent.type==="denominator") {

    } else {
      console.log("selected nodes", selection.selected_nodes);
      term_ids.push(selection.selected_nodes[0].parent.model.id);
      for (i=0; i<selection.selected_nodes.length-1; i++) {
        if (selection.selected_nodes[i].parent === selection.selected_nodes[i+1].parent) {
          factor_texts[j] += selection.selected_nodes[i+1].text;
          fact_cnt[j]++;
        } else {
          create_fact_subs(selection.selected_nodes[i].parent, fact_cnt[j]);
          j++; //next factor
          factor_texts[j] = selection.selected_nodes[i+1].text;
          fact_cnt[j]=1;
          term_ids.push(selection.selected_nodes[i+1].parent.model.id);
        }
        console.log("fact_subs", fact_subs);
        last_node_in_loop = selection.selected_nodes[i+1];
      }
      create_fact_subs(last_node_in_loop.parent, fact_cnt[j]);
      //the above could be made more pretty I think..
    }
    for (var i=0; i<factor_texts.length-1; i++) { //checking if all factors are the same
      if (factor_texts[i] !== factor_texts[i+1]) {same_factors = false}
    }
    console.log("factors_text", factor_texts);
  }

  //

  //factor out
  if (selection.selected_nodes[0].type === "factor" && same_type && same_grandparents && same_factors && factor_texts.length > 1)
  {
    console.log("factor out");
    return new Promise((resolve, reject) => {
      selection.$selected.animate({"font-size": 0, opacity: 0}, step_duration) //AS USUAL, IMPROVE ANIMATION
        .css('overflow', 'visible')
        .promise()
        .done(function() {
          var selected_terms = [];
          let factor_selected_text = factor_texts[0];
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, fact_subs);
          var new_text = "";
          playing = true; //so that it doesn't go into history..
          math_root = math_str_to_tree(clear_math(new_math_str)); //I SHOULD CREATE A FUNCTION THAT PARSES A LATEX STRING INTO A MATH_ROOT IDEALLY...
          console.log("new math_root", math_root);
          playing = false;
          for (var k=0; k<term_ids.length; k++) {
            var term = math_root.first(function (node) {
              return node.model.id === term_ids[k]; //They will have the same id, because we have only removed children of them.
            });
            new_text += term.text;
            selected_terms.push(term);
          }
          new_text = "+" + factor_selected_text + "(" + new_text + ")";
          new_math_str = replace_in_mtstr(math_root, selected_terms, new_text);
          resolve(new_math_str);
        });
      });
  }
  //merge equal factors into exp
  else if (selection.selected_nodes[0].type === "factor" && same_parents && same_type && same_text)
  {
    console.log("merge equal factors into exp");
    //ANIMATION??
    new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, eval_expression(selection.selected_text));
    // new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, selection.selected_nodes[0].text + "^{" + selection.selected_nodes.length.toString() + "}");
    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }
  //merge equal terms into term
  else if (selection.selected_nodes[0].type === "term" && same_type && same_term && selection.selected_nodes.length > 1)
  {
    console.log("merge equal terms into term");
    var term_text = selection.selected_nodes[0].text;
    if (selection.selected_nodes[0].children[0].type2 === "op") {
      term_text = selection.selected_nodes[0].text.slice(1);
    }
    new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, "+" + selection.selected_nodes.length.toString() + term_text);

    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }
  //merge fraction terms into fraction
  else if (selection.selected_nodes[0].type === "term" && same_type && single_factor && are_fracs && have_same_denom(selection.selected_nodes) && selection.selected_nodes.length > 1)
  {
    console.log("merge fraction terms into fraction");

    //ANIMATION??
    var denominator_text = selection.selected_nodes[0].children[selection.selected_nodes[0].children.length-1].children[1].text;
    var numerator_text = "";
    for (var i=0; i<selection.selected_nodes.length; i++) {
      if (i > 0) {numerator_text+="+";}
      if (selection.selected_nodes[i].children[selection.selected_nodes[i].children.length-1].children[0].children.length > 1) {
        numerator_text+="(" + selection.selected_nodes[i].children[selection.selected_nodes[i].children.length-1].children[0].text + ")";
      } else {
        numerator_text+=selection.selected_nodes[i].children[selection.selected_nodes[i].children.length-1].children[0].text;
      }
    }
    var new_text = "+\\frac{" + numerator_text + "}{" + denominator_text + "}";
    new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_text);
    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }
  //merge terms into fraction
  else if (selection.selected_nodes[0].type === "term" && same_type && selection.selected_nodes.length > 1)
  {
    console.log("merge terms into fraction");
    var denominator_nodes = [];
    for (var i=0; i<selection.selected_nodes.length; i++) {//making sure all elements that are fractions have the same denominator
      if (have_single_factor([selection.selected_nodes[i]]) && selection.selected_nodes[i].children[selection.selected_nodes[i].children.length-1].type2 === "frac") {
        denominator_nodes.push(selection.selected_nodes[i].children[selection.selected_nodes[i].children.length-1].children[1]); //doing the selection.selected_nodes[i].children.length-1 in case there's an op.
      }
    }
    var denominator_text = multiply(denominator_nodes);
    var numerator_text = "";
    var j = 0;
    for (var i=0; i<selection.selected_nodes.length; i++) {
      if (i > 0) {numerator_text+="+";}
      if (have_single_factor([selection.selected_nodes[i]]) && selection.selected_nodes[i].children[selection.selected_nodes[i].children.length-1].type2 === "frac") {
        var temp_denom_nodes = denominator_nodes.slice();
        denominator_nodes.splice(j,1)
        var new_nodes = [selection.selected_nodes[i].children[selection.selected_nodes[i].children.length-1].children[0]].concat(denominator_nodes);
        denominator_nodes = temp_denom_nodes;
        numerator_text += multiply(new_nodes);
        j++;
      } else {
        numerator_text += selection.selected_nodes[i].text + denominator_text;
      }

    }
    console.log(numerator_text);
    //ANIMATION??
    var new_text = "+\\frac{" + numerator_text + "}{" + denominator_text + "}";
    // new_text = "+" + rationalize(selection.selected_text);
    new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_text);
    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }
  //merge exponentials
  else if ((selection.selected_nodes[0].type2 === "exp" || selection.selected_nodes[0].type2 === "group_exp")
  && same_parents && same_type)
  {
    console.log("merge exponentials");
    var same_base = true, same_power = true;
    for (var i=0; i<selection.selected_nodes.length-1; i++) {//making sure all elemnts are of the same base
      if (selection.selected_nodes[i].children[0].text !== selection.selected_nodes[i+1].children[0].text) {same_base = false}
    }
    for (var i=0; i<selection.selected_nodes.length-1; i++) {//making sure all elemnts are of the same base
      if (selection.selected_nodes[i].children[1].text !== selection.selected_nodes[i+1].children[1].text) {same_power = false}
    }
    if (same_base && !same_power) //with common base
    {
      console.log("merge exponentials with common base");
      //ANIMATION??
      var power_text = "", base_text="";
      if (selection.selected_nodes[0].children[0].children.length === 1) {
        base_text = selection.selected_nodes[0].children[0].text;
      } else {
        base_text = add_brackets(selection.selected_nodes[0].children[0].text);
      }
      for (var i=0; i<selection.selected_nodes.length; i++) {
        if (i > 0) {power_text+="+";}
        power_text+=selection.selected_nodes[i].children[1].text;
      }
      var new_text = base_text + "^{" + power_text + "}";
      new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_text);
      return new Promise((resolve, reject) => {resolve(new_math_str)});
    }
    else if (same_power && !same_base)  //with common power
    {
      console.log("merge exponentials with common power");
      //ANIMATION??
      var power_text = selection.selected_nodes[0].children[1].text, base_text="";
      for (var i=0; i<selection.selected_nodes.length; i++) {
        if (selection.selected_nodes[i].children[0].children.length === 1) {
          base_text+=selection.selected_nodes[i].children[0].text;
        } else {
          base_text+=add_brackets(selection.selected_nodes[i].children[0].text);
        }
      }
      var new_text = "(" + base_text + ")" + "^{" + power_text + "}";
      new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_text);
      return new Promise((resolve, reject) => {resolve(new_math_str)});
    }
  }
  //merge square roots into square root
  else if (selection.selected_nodes[0].type2 === "sqrt" && same_parents && same_type2)
  {
    console.log("merge square roots into square root");
    //ANIMATION??
    var new_text = "\\sqrt{"
    for (var i=0; i<selection.selected_nodes.length; i++) {//making sure all elemnts are fracs (for single elements)
      if (selection.selected_nodes[i].children.length === 1) {
        new_text+=selection.selected_nodes[i].children[0].text;
      } else {
        new_text+="(";
        for (var j=0; j<selection.selected_nodes[i].children.length; j++) {
          new_text+=selection.selected_nodes[i].children[j].text;
        }
        new_text+=")";
      }
    }
    new_text+="}";
    new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_text);
    return new Promise((resolve, reject) => {resolve(new_math_str)});
  }

  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(13);}
}

//unbracket
export function unbracket() {
  let math_root = this.math_root;
  let selection = this.selection;
  //animation?
  var new_term="";
  new_term += selection.selected_text.replace(/^\(|\)$/g, "");
  new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_term);
  return new Promise((resolve, reject) => {resolve(new_math_str)});
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(9);}
}

//evaulate simple sum or multiplication
export function evaluate() {
  let math_root = this.math_root;
  let selection = this.selection;
  for (var i=0; i<selection.selected_nodes.length-1; i++) { //making sure, all elements are of the same parent
    if (selection.selected_nodes[i].parent !== selection.selected_nodes[i+1].parent) {return;}
  }
  //equals position not too well animated
  return new Promise((resolve, reject) => {
    selection.$selected.animate({"font-size": 0, opacity: 0}, step_duration).css('overflow', 'visible').promise().done(function() {
      new_term = eval_expression(selection.selected_text); //only works for sqrts or fracs separately, but not together
      new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, new_term);
      resolve(new_math_str);
    });
  });
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(3);}
}

//operate with an operator
export function operate() {
  let math_root = this.math_root;
  let selection = this.selection;
  if (selection.selected_nodes.length === 1 && selection.selected_nodes[0].type2 === "diff") {
    console.log("differentiating");
    var variable = selection.selected_nodes[0].children[1].text.slice(1);
    var next_nodes = get_all_next(math_root, selection.selected_nodes[0]);
    let expression = "";
    for (var i = 0; i < next_nodes.length; i++) {
      expression+=next_nodes[i].text;
    };
    expression = latex_to_ascii(expression);
    // console.log(variable);
    //TODO: IMPROVE ANIMATION (LOOK AT THE MECHANICAL UNIVERSE)
    return new Promise((resolve, reject) => {
      selection.$selected.animate({"font-size": 0, opacity: 0}, step_duration).css('overflow', 'visible').promise().done(function() {
        // new_term = CQ(expression).differentiate(variable).toLaTeX().replace("\\cdot", "");
        // console.log("expression, variable", expression, variable);
        let new_term = Algebrite.run("d(" + expression + "," + variable + ")");
        new_term = ascii_to_latex(new_term);
        new_math_str = replace_in_mtstr(math_root, selection.selected_nodes.concat(next_nodes), new_term);
        resolve(new_math_str);
      });
    });
  } else {
    return;
  }
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(14);}
}

//Append something to both sides
$("#add_both_sides").keyup(function (e) {
    if (e.keyCode == 13) {
  console.log("hi");
      var thing1 = $("#add_both_sides").get()[0].value;
          add_both_sides(thing1);
    }
});

export function add_both_sides(thing, math_str) {
  let math_root = this.math_root;
  let selection = this.selection;
  math_HS = math_str.split("=");
  new_math_str = math_HS[0] + thing + "=" +math_HS[1] + thing;
  return new Promise((resolve, reject) => {resolve(new_math_str)});
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(7, thing);}
}

//replace something
$("#replace").keyup(function (e) {
    if (e.keyCode == 13) {
      var thing = $("#replace").get()[0].value;
        replace(thing);
    }
});
export function replace(text, replace_ind=false) {
  let math_root = this.math_root;
  let selection = this.selection;
  return new Promise((resolve, reject) => {
    selection.$selected.animate({"font-size": 0, opacity: 0}, step_duration/2)
      .css('overflow', 'visible')
      .promise()
      .done(function() {
        if (replace_ind) {
          var text_arr = [];
          for (var i=0; i<selection.selected_nodes.length; i++) {
            text_arr.push(text);
          }
        new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, text_arr);

        } else {
          new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, text);
        }
        resolve(new_math_str);
      });
    });
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(10, text);}
}

//remove something. Used for: cancelling something on both sides, or cancelling something on a fraction, among other things
export function remove() {
  let math_root = this.math_root;
  let selection = this.selection;
  console.log("removing");
  return new Promise((resolve, reject) => {
    selection.$selected.animate({"font-size": 0, opacity: 0}, step_duration)
      .css('overflow', 'visible')
      .promise()
      .done(function() {
        new_math_str = replace_in_mtstr(math_root, selection.selected_nodes, "");
        resolve(new_math_str);
      });
    });
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(11);}
}

//cancel out factors in a fraction. TODO: also be able to cancel terms.
export function cancel_out() {
  let math_root = this.math_root;
  let selection = this.selection;
  var same_factor = true,
    same_parents = have_same_ancestors(selection.selected_nodes, 1),
    same_grandparents = have_same_ancestors(selection.selected_nodes, 2),
    same_ggparents = have_same_ancestors(selection.selected_nodes, 3),
    same_type = have_same_type(selection.selected_nodes),
    same_type2 = have_same_type(selection.selected_nodes,1);

    //cancel factors
    if (selection.selected_nodes[0].type === "factor" && same_type && same_ggparents
        && Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.type2") === "frac"
        && Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.children.0.children.length") === 1
        && Bro(selection.selected_nodes[0]).iCanHaz("parent.parent.parent.children.1.children.length") === 1)
    {
      console.log("canceling out")
      var num_text = "", denom_text = "";
      var num_nodes = [], denom_nodes = [];
      for (var i = 0; i < selection.selected_nodes.length; i++) {
        if (selection.selected_nodes[i].parent.parent.type === "numerator") {
          num_text+=selection.selected_nodes[i].text;
          num_nodes.push(selection.selected_nodes[i]);
        } else if (selection.selected_nodes[i].parent.parent.type === "denominator") {
          denom_text+=selection.selected_nodes[i].text;
          denom_nodes.push(selection.selected_nodes[i]);
        }
      }
      var ascii_str = latex_to_ascii("\\frac{"+num_text+"}{"+denom_text+"}");
      var new_exp = Algebrite.simplify(ascii_str);
      var new_num = ascii_to_latex(Algebrite.numerator(new_exp).toString());
      var new_denom = ascii_to_latex(Algebrite.denominator(new_exp).toString());
      //ANIMATION??
      var new_num_strs = new_num === "1" ? [""] : [new_num];
      var new_denom_strs = new_denom === "1" ? [""] : [new_denom];
      for (var i = 1; i < num_nodes.length; i++) {
        new_num_strs.push("");
      }
      for (var i = 1; i < denom_nodes.length; i++) {
        new_denom_strs.push("");
      }
      new_math_str = replace_in_mtstr(math_root, num_nodes.concat(denom_nodes), new_num_strs.concat(new_denom_strs));
      return new Promise((resolve, reject) => {resolve(new_math_str)});
    }
    //TODO: Add way to cancel terms too.
}

//flip equation
export function flip_equation(math_str) {
  let math_root = this.math_root;
  let selection = this.selection;
  var offset1 = tot_width($equals.prevAll(), true, false) + tot_width($equals, true, false);
  var offset2 = tot_width($equals.nextAll(), true, false) + tot_width($equals, true, false);
  return new Promise((resolve, reject) => {
    $equals.prevAll().animate({left:offset1}, step_duration);
    $equals.nextAll().animate({left:-offset2}, step_duration)
      .promise()
      .done(function() {
      math_HS = math_str.split("=");
      new_math_str = math_HS[1] + "=" + math_HS[0];
      resolve(new_math_str);
    });
  });
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(15);}
}
