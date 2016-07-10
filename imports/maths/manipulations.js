import {replace_in_mtstr, tot_width, rationalize, eval_expression, ascii_to_latex, latex_to_ascii, getIndicesOf, cleanIndices, change_sign, exponentiate, multiply_grouped_nodes, flip_fraction, add_brackets, are_of_type, any_of_type, have_same_ancestors, have_same_type, have_same_text, have_single_factor, have_same_denom, are_same_terms, get_prev, get_next, get_all_next, has_op, parse_mtstr, parse_poly, prepare} from "./functions";

// import Algebrite from 'algebrite';

import algebra from 'algebra.js'

import Bro from 'brototype';

import {symbols} from './symbols.js';


//MANIPULATIONS

//change side
export function change_side() {
  var new_term;
  equals_position = $equals.offset();
  equals_node = math_root.first(function (node) {
    if (node.children.length > 0) {
        return node.children[0].type === "rel";
      }
  });
  for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts are of the same parent
    if (selected_nodes[i].parent !== selected_nodes[i+1].parent) {return;}
  }

  //terms
  if (selected_nodes[0].parent === math_root)
  {
    console.log("changing term of side");
    var selected_width = tot_width($selected, true, true);
    if ($selected.prevAll(".mrel").length === 0) { //before eq sign
      offset = (end_of_equation.left-selected_position.left);
      $selected.first().prevAll().animate({left:selected_width}, step_duration);
      $selected = $(".selected").add($(".selected").filter(".mop").children());
      $selected.animate({left:offset}, step_duration).promise().done(function() {
        $selected = $(".selected").add($(".selected").find("*"));
        new_term = change_sign(selected_nodes);
        new_math_str = replace_in_mtstr(selected_nodes, "")+new_term;
        current_index++;
        prepare(new_math_str);
      });

    } else { //after eq sign
      offset = (equals_position.left-selected_position.left)-tot_width($selected, true, false);
      $selected.prevAll(".mrel").first().prevAll().animate({left:-selected_width}, step_duration);
      $selected.last().nextAll().animate({left:-tot_width($selected, true, false)}, step_duration);
      $selected = $(".selected").add($(".selected").filter(".mop").children());
      $selected.animate({left:offset}, step_duration).promise().done(function() {
        $selected = $(".selected").add($(".selected").find("*"));
        new_term = change_sign(selected_nodes);
        new_math_str = replace_in_mtstr(selected_nodes, "");
        new_math_str = new_math_str.replace("=", new_term+"=");
        current_index++;
        prepare(new_math_str);
      });
    }
  }
  //operator (sign) TODO:should check it's actually a sign, by checking "text"
  else if (selected_nodes[0].parent.parent === math_root
    && selected_nodes[0].type2 === "op"
    && (selected_nodes[0].text === "+" || selected_nodes[0].text === "-")
    && selected_nodes.length === 1
    //and it comes from a top leve term, plus there is only one term on the side of the selected sign:
    && (($selected.prevAll(".mrel").length !== 0
        && get_prev([math_root.children[math_root.children.length-1]]).children[0].type === "rel")
      || ($selected.prevAll(".mrel").length === 0
        && get_next([math_root.children[0]]).children[0].type === "rel")))
  {
    console.log("changing sign of side");
    var selected_width = tot_width($selected, true, true);
    if ($selected.prevAll(".mrel").length === 0) { //before eq sign
      offset = (equals_position.left-selected_position.left) + tot_width(equals_node.model.obj, true, true);
      $equals.nextAll().animate({left:tot_width($selected, true, false)}, step_duration);
      $selected = $(".selected").add($(".selected").filter(".mop").children());
      $selected.animate({left:offset}, step_duration).promise().done(function() {
        var RHS_terms = math_root.children.slice(parseInt(equals_node.model.id.split("/")[1]));
        new_term = change_sign(RHS_terms);
        new_math_str = replace_in_mtstr(selected_nodes.concat(RHS_terms), "")+new_term;
        current_index++;
        prepare(new_math_str);
      });

    } else { //after eq sign
      offset = (beginning_of_equation.left-selected_position.left)-tot_width($selected, true, false);
      $selected.last().nextAll().animate({left:-tot_width($selected, true, false)}, step_duration);
      $selected = $(".selected").add($(".selected").filter(".mop").children());
      $selected.animate({left:offset}, step_duration).promise().done(function() {
        var LHS_terms = math_root.children.slice(0, parseInt(equals_node.model.id.split("/")[1])-1);
        new_term = change_sign(LHS_terms);
        new_math_str = new_term+replace_in_mtstr(selected_nodes.concat(LHS_terms), "");
        current_index++;
        prepare(new_math_str);
      });
    }
  }
  //factors
  else if ((selected_nodes[0].parent.type === "numerator"
    || (selected_nodes[0].type === "factor" && selected_nodes[0].model.id.split("/").length === 3)
    || (selected_nodes[0].type === "factor" && selected_nodes[0].model.id.split("/").length === 6 && selected_nodes[0].parent.parent.type === "numerator")
    || selected_nodes[0].type === "numerator")
    //and it comes from a top level term, plus there is only one term on the side of the selected sign:
    && (($selected.prevAll(".mrel").length !== 0
        && get_prev([math_root.children[math_root.children.length-1]]).children[0].type === "rel")
      || ($selected.prevAll(".mrel").length === 0
        && get_next([math_root.children[0]]).children[0].type === "rel")))
  {
    console.log("changing factor of side");
    if (selected_nodes[0].model.id.split("/")[1] < equals_node.model.id.split("/")[1]) { //before eq sign
      RHS_width = tot_width($equals.nextAll(), false, false);
      var after_eq = false, after_eq_nodes=[];
      for (var i=0; i<math_root.children.length; i++) {
        if (after_eq) {after_eq_nodes.push(math_root.children[i])}
        if (math_root.children[i].children[0].type === "rel") {after_eq = true;}
      }
      var include_in_frac = after_eq_nodes.length === 1
          && after_eq_nodes[0].children.length === 1
          && after_eq_nodes[0].children[0].type2 === "frac";
      h_offset = $equals.offset().left - $selected.offset().left + tot_width($equals, true, false) + (RHS_width)/2;
      v_offset = $selected.outerHeight(includeMargin=true)/2;
      if (include_in_frac) {v_offset = 0;}
      $equals.nextAll().animate({top:-v_offset, left:tot_width($selected, true, false)/2}, step_duration);
      $selected.animate({left:h_offset, top:v_offset}, step_duration).promise().done(function() {
        new_math_str = replace_in_mtstr(selected_nodes, "");
        math_HS = new_math_str.split("="); //HS=hand sides
        if (include_in_frac) {
          new_math_str = math_HS[0] + "=" + "\\frac{" + after_eq_nodes[0].children[0].children[0].text + "}{" + after_eq_nodes[0].children[0].children[1].text + selected_text + "}";
        } else {
          new_math_str = math_HS[0] + "=" + "\\frac{" + math_HS[1] + "}{" + selected_text + "}";
        }
        current_index++;
        new_math_str = new_math_str.replace(/=$/, "=1").replace(/^=/, "1=");
        prepare(new_math_str);
      });
    } else if (selected_nodes[0].model.id.split("/")[1] > equals_node.model.id.split("/")[1]) { //after eq sign
      LHS_width = tot_width($equals.prevAll(), false, false);
      var before_eq = false, before_eq_nodes=[];
      for (var i=math_root.children.length-1; i>=0; i--) {
        if (before_eq) {before_eq_nodes.push(math_root.children[i])}
        if (math_root.children[i].children[0].type === "rel") {before_eq = true;}
      }
      var include_in_frac = before_eq_nodes.length === 1
          && before_eq_nodes[0].children.length === 1
          && before_eq_nodes[0].children[0].type2 === "frac";
      h_offset = $selected.offset().left - $equals.offset().left + (LHS_width)/2;
      v_offset = $selected.outerHeight(includeMargin=true)/2;
      if (include_in_frac) {v_offset = 0;}
      $equals.prevAll().animate({top:-v_offset, left:tot_width($selected, true, false)/2}, step_duration);
      $selected.animate({left:-h_offset, top:v_offset}, step_duration).promise().done(function() {
        new_math_str = replace_in_mtstr(selected_nodes, "");
        math_HS = new_math_str.split("="); //HS=hand sides
        if (include_in_frac) {
          new_math_str = "\\frac{" + before_eq_nodes[0].children[0].children[0].text + "}{" + before_eq_nodes[0].children[0].children[1].text + selected_text + "}" + "=" + math_HS[1];
        } else {
          new_math_str = "\\frac{" + math_HS[0] + "}{" + selected_text + "}" + "=" + math_HS[1];
        }
        current_index++;
        new_math_str = new_math_str.replace(/=$/, "=1").replace(/^=/, "1=");
        prepare(new_math_str);
      });
    }
  }
  //denominator
  else if (selected_nodes[0].parent.type == "denominator"
    || selected_nodes[0].type === "denominator"
    || (selected_nodes[0].type === "factor" && selected_nodes[0].model.id.split("/").length === 6 && selected_nodes[0].parent.parent.type === "denominator"))
  {
    console.log("changing denominator of side");
    if (selected_nodes[0].model.id.split("/")[1] < equals_node.model.id.split("/")[1]) { //before eq sign
      RHS_width = tot_width($equals.nextAll(), false, false);
      var after_eq = false, after_eq_nodes=[];
      for (var i=0; i<math_root.children.length; i++) {
        if (after_eq) {after_eq_nodes.push(math_root.children[i])}
        if (math_root.children[i].children[0].type === "rel") {after_eq = true;}
      }
      var include_in_frac = after_eq_nodes.length === 1
          && after_eq_nodes[0].children.length === 1
          && after_eq_nodes[0].children[0].type2 === "frac";
      h_offset = $equals.offset().left - $selected.offset().left + tot_width($equals, true, false) + (RHS_width)/2;
      v_offset = $selected.outerHeight(includeMargin=true)/2;
      if (include_in_frac) {v_offset*=2;}
      $equals.nextAll().animate({left: tot_width($selected, true, false)/2}, step_duration);
      if (include_in_frac) {
        $equals.prevAll().animate({top: $selected.outerHeight(includeMargin=true)/2}, step_duration);
        v_offset+=$selected.outerHeight(includeMargin=true)/2;
      }
      $selected.animate({left:h_offset, top:-v_offset}, step_duration).promise().done(function() {
        new_math_str = replace_in_mtstr(selected_nodes, "");
        math_HS = new_math_str.split("="); //HS=hand sides
        if (include_in_frac) {
          new_math_str = math_HS[0].replace(/\\frac{([ -~]+)}{}/, "$1") + "=" + "\\frac{" + after_eq_nodes[0].children[0].children[0].text + selected_text + "}{" + after_eq_nodes[0].children[0].children[1].text + "}";
        } else {
          new_math_str = math_HS[0] + "=" + selected_text + math_HS[1] ;
        }
        current_index++;
        new_math_str = new_math_str.replace(/\\frac{([ -~]+)}{}/, "$1").replace(/=$/, "=1").replace(/^=/, "1=");
        prepare(new_math_str);
      });
    } else if (selected_nodes[0].model.id.split("/")[1] > equals_node.model.id.split("/")[1]) { //after eq sign
      LHS_width = tot_width($equals.prevAll(), false, false);
      var before_eq = false, before_eq_nodes=[];
      for (var i=math_root.children.length-1; i>=0; i--) {
        if (before_eq) {before_eq_nodes.push(math_root.children[i])}
        if (math_root.children[i].children[0].type === "rel") {before_eq = true;}
      }
      var include_in_frac = before_eq_nodes.length === 1
          && before_eq_nodes[0].children.length === 1
          && before_eq_nodes[0].children[0].type2 === "frac";
      h_offset = $selected.offset().left - $equals.offset().left + (LHS_width)/2;
      v_offset = $selected.outerHeight(includeMargin=true)/2;
      if (include_in_frac) {v_offset*=2;}
      $equals.prevAll().animate({left:tot_width($selected, true, false)/2}, step_duration);
      if (include_in_frac) {
        $equals.nextAll().animate({top: $selected.outerHeight(includeMargin=true)/2}, step_duration);
        v_offset+=$selected.outerHeight(includeMargin=true)/2;
      }
      $selected.animate({left:-h_offset, top:-v_offset}, step_duration).promise().done(function() {
        new_math_str = replace_in_mtstr(selected_nodes, "");
        math_HS = new_math_str.split("="); //HS=hand sides
        if (include_in_frac) {
          new_math_str = "\\frac{" + before_eq_nodes[0].children[0].children[0].text + selected_text + "}{" + before_eq_nodes[0].children[0].children[1].text + "}" + "=" + math_HS[1].replace(/\\frac{([ -~]+)}{}/, "$1");
        } else {
          new_math_str = math_HS[0] + selected_text + "=" + math_HS[1];
        }
        console.log(new_math_str);
        current_index++;
        new_math_str = new_math_str.replace(/=$/, "=1").replace(/^=/, "1=");
        console.log(new_math_str);
        prepare(new_math_str);
      });
    }
  }
  //power.
  //NEED TO ADD option for selecting factor or term within power, just like for fractions..
  else if (selected_nodes[0].type === "power"
    && selected_nodes.length === 1
    //and it comes from a top level term, plus there is only one term on the side of the selected sign:
    && (($selected.prevAll(".mrel").length !== 0
        && get_prev([math_root.children[math_root.children.length-1]]).children[0].type === "rel")
      || ($selected.prevAll(".mrel").length === 0
        && get_next([math_root.children[0]]).children[0].type === "rel")))
  {
    console.log("changing power of side");
    if ($selected.parent().prevAll(".mrel").length === 0) { //before eq sign
      var offset = end_of_equation.left - equals_position.left;
      $selected.animate({left:offset}, step_duration).promise().done(function() {
        new_math_str = replace_in_mtstr(selected_nodes, "");
        math_HS = new_math_str.split("="); //HS=hand sides
        if (selected_nodes[0].text === "2") {
          new_math_str = math_HS[0] + "=" + "\\sqrt{" + math_HS[1] + "}";
        } else {
          if (selected_nodes[0].children.length === 1 && selected_nodes[0].children[0].children.length ===1 && selected_nodes[0].children[0].children[0].type2 === "frac") {
            new_math_str = math_HS[0] + "=" + add_brackets(math_HS[1]) + "^{" + flip_fraction([selected_nodes[0].children[0].children[0]]) + "}";
          } else {
            new_math_str = math_HS[0] + "=" + add_brackets(math_HS[1]) + "^{" + "\\frac{1}{" + selected_text + "}}"; //add brackets
          }
        }
        current_index++;
        prepare(new_math_str);
      });
    } else if ($selected.parent().nextAll(".mrel").length === 0) { //after eq sign
      var offset = end_of_equation.left - equals_position.left;
      $selected.animate({left:-offset}, step_duration).promise().done(function() {
        new_math_str = replace_in_mtstr(selected_nodes, "");
        math_HS = new_math_str.split("="); //HS=hand sides
        if (selected_nodes[0].text === "2") {
          new_math_str = "\\sqrt{" + math_HS[0] + "}" + "=" + math_HS[1];
        } else {
          if (selected_nodes[0].children.length === 1 && selected_nodes[0].children[0].children.length ===1 && selected_nodes[0].children[0].children[0].type2 === "frac") {
            new_math_str = add_brackets(math_HS[0]) + "^{" + flip_fraction([selected_nodes[0].children[0].children[0]]) + "}" + "=" + math_HS[1];
          } else {
            new_math_str = add_brackets(math_HS[0]) + "^{" + "\\frac{1}{" + selected_text + "}}" + "=" + math_HS[1]; //add brackets
          }
        }
        current_index++;
        prepare(new_math_str);
      });
    }
  }

  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(1);}
};

//move term within expression, or factor within term
export function move_right(){
  //moving factor or term
  if ($selected.next().filter(".mrel").length === 0)
  {
    var include_op;
    if (selected_nodes[0].type === "factor") {
      include_op = false;
    } else if (selected_nodes[0].type === "term") {
      include_op = true;
    } else {
      return;
    }
    var selected_width = tot_width($selected, true, include_op);
    var selected_text_str, next_text_str;
    var next_node = get_next(selected_nodes);
    var $selected_next = next_node.model.obj;
    var selected_next_width = tot_width($selected_next, true, include_op);
    //check if it's a multiplication operator, and if so, get next thing
    if (next_node.type2 === "op" && next_node.optype === "mult") {
      next_node = get_next(next_node)
      var width_diff = selected_next_width - selected_width;
      var $selected_next = next_node.model.obj;
      var selected_next_width = tot_width($selected_next.add($selected_next.prev()), true, include_op);
      var selected_width = selected_width + tot_width($selected_next.prev(), true, include_op);
      $selected_next.first().prev().animate({left:width_diff}, step_duration)
    }
    $selected_next.animate({left:-selected_width}, step_duration); //animation should take into account possibly missing operator
    $selected.animate({left:selected_next_width}, step_duration).promise().done(function() {
      if (!has_op($selected) && selected_nodes[0].type === "term") {selected_text_str = "+" + selected_text;} else {selected_text_str = selected_text;}
      next_text = next_node.text;
      if (!has_op($selected_next) && selected_nodes[0].type === "term") {next_text_str = "+" + next_text;} else {next_text_str = next_text;}
      new_math_str = replace_in_mtstr([next_node].concat(selected_nodes), [selected_text_str, next_text_str]);
      current_index++;
      prepare(new_math_str);
    });
  }
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(4);}
}

export function move_left() {
  //moving factor or term
  if ($selected.prev().filter(".mrel").length === 0)
  {
    var include_op;
    if (selected_nodes[0].type === "factor") {
      // console.log("moving factor left")
      include_op = false;
    } else if (selected_nodes[0].type === "term") {
      // console.log("moving term right")
      include_op = true;
    } else {
      return;
    }
    var selected_width = tot_width($selected, true, include_op);
    var selected_text_str, prev_text_str;
    var prev_node = get_prev(selected_nodes);
    var $selected_prev = prev_node.model.obj;
    var selected_prev_width = tot_width($selected_prev, true, include_op);
    //check if it's a multiplication operator, and if so, get prev thing
    if (prev_node.type2 === "op" && prev_node.optype === "mult") {
      prev_node = get_prev(prev_node)
      var $selected_prev = prev_node.model.obj;
      var width_diff = selected_prev_width - selected_width;
      var selected_prev_width = tot_width($selected_prev.add($selected_prev.next()), true, include_op);
      var selected_width = selected_width + tot_width($selected_prev.next(), true, include_op);
      $selected_prev.last().next().animate({left:-width_diff}, step_duration)

    }
    $selected_prev.animate({left:selected_width}, step_duration);
    $selected.animate({left:-selected_prev_width}, step_duration).promise().done(function() {
      if (!has_op($selected) && selected_nodes[0].type === "term") {selected_text_str = "+" + selected_text;} else {selected_text_str = selected_text;}
      prev_text = prev_node.text;
      if (!has_op($selected_prev) && selected_nodes[0].type === "term") { prev_text_str = "+" + prev_text;} else {prev_text_str = prev_text;}
      new_math_str = replace_in_mtstr([prev_node].concat(selected_nodes), [selected_text_str, prev_text_str]);
      current_index++;
      prepare(new_math_str);
    });
  }
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(5);}
}

//move up and down in a fraction
export function move_up() {
  var same_parents = have_same_ancestors(selected_nodes, 1),
    same_type2 = have_same_type(selected_nodes,1),
    same_type = have_same_type(selected_nodes);

  // factors in single term in denominator
  if (selected_nodes[0].type === "factor"
    && same_type
    && same_parents
    && !any_of_type(selected_nodes,"frac", 1)
    && Bro(selected_nodes[0]).iCanHaz("parent.parent.parent.type2") === "frac"
    && selected_nodes[0].parent.parent.children.length === 1)
  {
    console.log("moving up factor");
    var numerator = selected_nodes[0].parent.parent.parent.children[0];
    var new_nom_text = exponentiate(selected_nodes, false, "-1");
    if (numerator.children.length === 1) {
      new_nom_text+=(numerator.text === "1" ? "" : numerator.text);
    } else {
      new_nom_text+="(" + numerator.text + ")";
    }
  }
  //single term in denominator
  else if (selected_nodes[0].type === "term"
    && selected_nodes.length === 1
    && Bro(selected_nodes[0]).iCanHaz("parent.parent.type2") === "frac"
    && selected_nodes[0].parent.children.length === 1)
  {
    console.log("moving up term");
    var numerator = selected_nodes[0].parent.parent.children[0];
    var new_nom_text = exponentiate(selected_nodes[0].children, false, "-1");
    if (numerator.children.length === 1) {
      new_nom_text+=numerator.text;
    } else {
      new_nom_text+="(" + numerator.text + ")";
    }
  }
  //selecting denominator directly
  else if (selected_nodes[0].type === "denominator"
    && selected_nodes.length === 1
    && selected_nodes[0].parent.type2 === "frac"
    && selected_nodes[0].children.length === 1)
  {
    console.log("moving up denominator");
    var numerator = selected_nodes[0].parent.children[0];
    var new_nom_text = "";
    if (selected_nodes[0].children.length === 1) {
      new_nom_text = exponentiate(selected_nodes[0].children[0].children, false, "-1");
    } else {
      new_nom_text="("+selected_nodes[0]+")^{-1}";
    }
    if (numerator.children.length === 1) {
      new_nom_text+=numerator.text;
    } else {
      new_nom_text+="(" + numerator.text + ")";
    }
  }
  else if (selected_nodes[0].type === "factor"
    && Bro(selected_nodes[0]).iCanHaz("type2") === "frac"
    && Bro(selected_nodes[0]).iCanHaz("parent.parent.parent.type2") === "frac"
    && selected_nodes[0].parent.parent.children.length === 1)
  {
    console.log("moving up fraction");
    var numerator = selected_nodes[0].parent.parent.parent.children[0];
    var new_nom_text = flip_fraction(selected_nodes);
    if (numerator.children.length === 1) {
      new_nom_text+=(numerator.text === "1" ? "" : numerator.text);
    } else {
      new_nom_text+="(" + numerator.text + ")";
    }
  }
  var selected_width = tot_width($selected, true, false);
    var extra_selected_width = tot_width(math_root.first(function(node) {return node.type2 === "normal"}).model.obj, true, false)*1;
    var h_offset = $selected.offset().left - numerator.model.obj.offset().left + selected_width/2 + extra_selected_width/2;
    var v_offset = $selected.outerHeight()*1.5;
    numerator.model.obj.animate({left:selected_width/2+extra_selected_width/2}, step_duration);
    $selected.last().nextAll().animate({left:-selected_width-extra_selected_width/2}, step_duration);
    $selected.first().prevAll().animate({left:-extra_selected_width/2}, step_duration);
    $selected.animate({left:-h_offset, top:-v_offset}, step_duration).promise().done(function() {
      new_math_str = replace_in_mtstr([numerator].concat(selected_nodes), new_nom_text); //this just changes text of numerator and deletes selected_nodes
      current_index++;
      prepare(new_math_str);
    });
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(2);}
}

export function move_down() {

  var same_parents = have_same_ancestors(selected_nodes, 1);

  if (same_parents) {
    var new_denom_text = "";
    function move_down_frac(denominator) {
      if (denominator.children.length === 1) {
        new_denom_text+=denominator.text;
      } else {
        new_denom_text+="(" + denominator.text + ")";
      }
      var selected_width = tot_width($selected, true, false);
      var extra_selected_width = tot_width(math_root.first(function(node) {return node.type2 === "normal"}).model.obj, true, false)*1;
      var h_offset = $selected.offset().left - denominator.model.obj.offset().left + selected_width/2 + extra_selected_width/2;
      var v_offset = $selected.outerHeight()*1.5;
      denominator.model.obj.animate({left:selected_width/2+extra_selected_width/2}, step_duration);
      $selected.last().nextAll().animate({left:-selected_width-extra_selected_width/2}, step_duration);
      $selected.first().prevAll().animate({left:-extra_selected_width/2}, step_duration);
      $selected.animate({left:-h_offset, top:v_offset}, step_duration).promise().done(function() {
        new_math_str = replace_in_mtstr([denominator].concat(selected_nodes), new_denom_text);
        current_index++;
        prepare(new_math_str);
      });
    }
    if (selected_nodes[0].type === "factor"
    && selected_nodes[0].parent.parent.parent
    && selected_nodes[0].parent.parent.parent.type2 === "frac"
    && selected_nodes[0].parent.parent.children.length === 1) { //selected factor
      new_denom_text = exponentiate(selected_nodes, false, "-1");
      var denominator = selected_nodes[0].parent.parent.parent.children[1];
      move_down_frac(denominator)
    } else if (selected_nodes[0].type === "term"
    && selected_nodes.length === 1
    && selected_nodes[0].parent.parent
    && selected_nodes[0].parent.parent.type2 === "frac"
    && selected_nodes[0].parent.children.length === 1) {//selected term
      if (selected_nodes[0].children.length === 1) {
        new_denom_text = selected_nodes[0].text + "^{-1}";
      } else {
        new_denom_text = exponentiate(selected_nodes[0].children, false, "-1");
      }
      var denominator = selected_nodes[0].parent.parent.children[1];
      move_down_frac(denominator)
    } else if (selected_nodes[0].type === "numerator"
    && selected_nodes.length === 1
    && selected_nodes[0].parent
    && selected_nodes[0].parent.type2 === "frac"
    && selected_nodes[0].children.length === 1) {//selected numerator
      if (selected_nodes[0].children.length === 1) {
        new_denom_text = selected_nodes[0].text + "^{-1}";
      } else {
        new_denom_text = exponentiate(selected_nodes[0].children[0].children, false, "-1");
      }
      var denominator = selected_nodes[0].parent.children[1];
      move_down_frac(denominator)
    } else {
      var selected_width = tot_width($selected, true, false);
      var extra_selected_width = tot_width(math_root.first(function(node) {return node.type2 === "normal"}).model.obj, true, false)*1;
      var h_offset = selected_width/2 + extra_selected_width/2;
      var v_offset = $selected.outerHeight()*1.5;
      $selected.last().nextAll().animate({left:-selected_width-extra_selected_width/2}, step_duration);
      $selected.first().prevAll().animate({left:-extra_selected_width/2}, step_duration);
      $selected.animate({left:-h_offset, top:v_offset}, step_duration).promise().done(function() {
        new_nom_text = "";
        new_denom_text = exponentiate(selected_nodes, false, "-1");
        var begin_i = (selected_nodes[0].parent.children[0].type2 === "op") ? 1 : 0;
        for (var i = begin_i; i <selected_nodes[0].parent.children.length; i++) {
          for (var k = selected_nodes.length - 1; k >= 0; k--) {
            if (selected_nodes[0].parent.children[i].model.id !== selected_nodes[k].model.id) {
              new_nom_text+=selected_nodes[0].parent.children[i].text;
            }
          };
        };
        new_text = "\\frac{"+new_nom_text+"}{"+new_denom_text+"}";
        new_math_str = replace_in_mtstr(selected_nodes[0].parent.children.slice(begin_i), new_text);
        current_index++;
        prepare(new_math_str);
      });

    }
  }
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(6);}
}

// document.getElementById("split").onclick = split;
export function split() {
  var same_factor = true,
    // same_parents = have_same_ancestors(selected_nodes, 1),
    // same_grandparents = have_same_ancestors(selected_nodes, 2),
    same_ggparents = have_same_ancestors(selected_nodes, 3),
    same_type = have_same_type(selected_nodes);
    // same_type2 = have_same_type(selected_nodes,1)
  //split factors out of a fraction
  if (selected_nodes[0].type === "factor"
      && same_type && same_ggparents
      && Bro(selected_nodes[0]).iCanHaz("parent.parent.parent.type2") === "frac"
      && Bro(selected_nodes[0]).iCanHaz("parent.parent.parent.children.0.children.length") === 1)
  {
    //ANIMATION?
    var numerator_text = "", denominator_text = "", numerator_text2 = "", denominator_text2 = "";
    var numerator_factors = selected_nodes[0].parent.parent.parent.children[0].children[0].children;
    var denominator_factors;
    for (var j=0; j<numerator_factors.length; j++) {
      var do_continue = false;
      for (var k=0; k<selected_nodes.length; k++) {
        if (numerator_factors[j].model.id === selected_nodes[k].model.id) {do_continue = true;}
      }
      if (do_continue) {continue;}
      numerator_text2+=numerator_factors[j].text;
    }
    for (var i=0; i<selected_nodes.length; i++) {
      if (selected_nodes[i].parent.parent.type === "numerator") {
        numerator_text+=selected_nodes[i].text;
      } else if (selected_nodes[i].parent.parent.type === "denominator") {
        denominator_text+=selected_nodes[i].text;
      }
    }
    if (denominator_text !== "" && denominator_text !== selected_nodes[0].parent.parent.parent.children[1].text) {
      if (!(selected_nodes[0].parent.parent.parent.children[1].children.length === 1)) {
        return;
      } else {
        var denominator_factors = selected_nodes[0].parent.parent.parent.children[1].children[0].children;
        for (var j=0; j<denominator_factors.length; j++) {
          do_continue = false;
          for (var k=0; k<selected_nodes.length; k++) {
            if (denominator_factors[j].model.id === selected_nodes[k].model.id) {do_continue = true;}
          }
          console.log(denominator_factors);
          if (do_continue) {continue;}
          denominator_text2+=denominator_factors[j].text;
        }
      }
    } else if (denominator_text === "") {
      denominator_text2 = selected_nodes[0].parent.parent.parent.children[1].text;
    } else if (denominator_text === selected_nodes[0].parent.parent.parent.children[1].text) {
      denominator_text2 = "";
    }
    var new_text = "\\frac{" + numerator_text + "}{" + denominator_text + "}" + "\\frac{" + numerator_text2 + "}{" + denominator_text2 + "}";
    new_math_str = replace_in_mtstr([selected_nodes[0].parent.parent.parent], new_text);
    current_index++;
    prepare(new_math_str);
      }
}

// document.getElementById("merge").onclick = merge;
export function merge() {
  var same_factor = true,
    same_parents = have_same_ancestors(selected_nodes, 1),
    // same_grandparents = have_same_ancestors(selected_nodes, 2),
    // same_ggparents = have_same_ancestors(selected_nodes, 3),
    same_type = have_same_type(selected_nodes),
    same_type2 = have_same_type(selected_nodes,1);
    //merge factors into fraction
    if (selected_nodes[0].type2 === "frac" && same_parents && same_type && same_type2)
    {
      console.log("merge factors into fraction");
      //ANIMATION??
      var numerator_text = "", denominator_text = "";
      for (var i=0; i<selected_nodes.length; i++) {
        numerator_text+=selected_nodes[i].children[0].text;
        denominator_text+=selected_nodes[i].children[1].text;
      }
      var new_text = "\\frac{" + numerator_text + "}{" + denominator_text + "}";
      new_math_str = replace_in_mtstr(selected_nodes, new_text);
      current_index++;
      prepare(new_math_str);
    }
}

//distributing in stuff
export function distribute_in() {
  var same_factor = true,
    same_parents = have_same_ancestors(selected_nodes, 1),
    same_grandparents = have_same_ancestors(selected_nodes, 2),
    same_ggparents = have_same_ancestors(selected_nodes, 3),
    same_type = have_same_type(selected_nodes),
    same_type2 = have_same_type(selected_nodes,1);
  var factor_text = [], bool = false, j = 0;
  for (var i=0; i<selected_nodes.length-1; i++) {//making sure all factors are the same
    if (bool) {
      if (selected_nodes[i].text !== factor_text[j]) {same_factor = false}
      j++;
    } else {
      factor_text.push(selected_nodes[i].text);
    }
    if (selected_nodes[i].parent !== selected_nodes[i+1].parent) {bool = true; j = 0;}
  }

  var grouped = [];
  for (var i=0; i<selected_nodes.length; i++) {//identifying grouped element
    if (selected_nodes[i].type2 === "group") {
      grouped.push(selected_nodes[i]);
    } else {
      factors_text+=selected_nodes[i].text;
    }
  }

  //distribute in
  if (selected_nodes[0].type === "factor" && same_type && same_parents && grouped.length === 1)
  {
    var factors_text = "";
      for (var i=0; i<selected_nodes.length; i++) {
        if(selected_nodes[i].type2 === "group") {
          continue;
        } else {
          factors_text+=selected_nodes[i].text;
        }
      }
      console.log(factors_text);
    var grouped_node = grouped[0];
    $selected.animate({"font-size": 0, opacity: 0}, step_duration) //IMPROVE ANIMATION (FOR EXAMPLE CLONE)
      .css('overflow', 'visible')
      .promise()
      .done(function() {
        var text = "";
        for (var i=0; i<grouped_node.children.length; i++) {
          if (grouped_node.children[i].text.search(/[+-]/) === 0) {
            text += grouped_node.children[i].text.slice(0, 1) + factors_text + grouped_node.children[i].text.slice(1, grouped_node.children[i].text.length);
          } else if (grouped_node.children[i].text === "1") {
            text += factors_text;
          } else {
            text += factors_text + grouped_node.children[i].text;
          }
        }
        if (selected_nodes[0].parent.children.length > selected_nodes.length) {
          var new_text = "(" + text + ")"
        } else {
          var new_text = text
        }
        new_math_str = replace_in_mtstr(selected_nodes, new_text);
        current_index++;
      prepare(new_math_str);
      });
  }
  //split fractions into terms when selecting factors
  else if (selected_nodes[0].type2 === "frac" && same_type2)
  {
    console.log("THIEHTIHE");
    //ANIMATION? SHOULD CLONE THE denominator AND MOVE TO THE RIGHT PLACES
    var new_terms = [];
    for (var i=0; i<selected_nodes.length; i++) {
      if (selected_nodes[i].children[0].children.length > 1) {
        var new_term="";
        for (var j=0; j<selected_nodes[i].children[0].children.length; j++) {
          new_term += "+" + "\\frac{" + selected_nodes[i].children[0].children[j].text + "}{" + selected_nodes[i].children[1].text + "}";
        }
        new_terms.push("(" + new_term + ")");
      } else {
        new_terms.push(selected_nodes[i].text);
      }
    }
    new_math_str = replace_in_mtstr(selected_nodes, new_terms);
    prepare(new_math_str);
    current_index++;
  }
  //split fraction into terms when selecting terms
  else if (selected_nodes[0].type === "term" && selected_nodes.length === 1 //because I'm not checking the subsequent stuff for a multiselection
    && ((selected_nodes[0].children.length === 1 && selected_nodes[0].children[0].type2 === "frac")
        || (selected_nodes[0].children.length === 2 && selected_nodes[0].children[1].type2 === "frac" && selected_nodes[0].children[0].type2 === "op")))
  {
      //ANIMATION? SHOULD CLONE THE denominator AND MOVE TO THE RIGHT PLACES
    var new_terms = [];
    var index = 0;
    if (selected_nodes[0].children.length === 2 && selected_nodes[0].children[1].type2 === "frac" && selected_nodes[0].children[0].type2 === "op") {index = 1;}
    for (var i=0; i<selected_nodes.length; i++) {
      if (selected_nodes[i].children[index].children[0].children.length > 1) {
        var new_term="";
        for (var j=0; j<selected_nodes[i].children[index].children[0].children.length; j++) {
          new_term += "+" + "\\frac{" + selected_nodes[i].children[index].children[0].children[j].text + "}{" + selected_nodes[i].children[index].children[1].text + "}";
        }
        new_terms.push("+(" + new_term + ")");
      } else {
        new_terms.push(selected_nodes[i].text);
      }
    }
    new_math_str = replace_in_mtstr(selected_nodes, new_terms);
    prepare(new_math_str);
    current_index++;
  }
  //split square root. Need to make it work with fractions
  else if (selected_nodes[0].type2 === "sqrt" && selected_nodes[0].children.length === 1)
  {
    //ANIMATION??
    var factors = selected_nodes[0].children[0].children;
    var text = "";
    for (var i=0; i<factors.length; i++) {
        text+="\\sqrt{" + factors[i].text + "}";
      }
    new_math_str = replace_in_mtstr(selected_nodes, text);
    current_index++;
    prepare(new_math_str);
  }
  //distribute power in
  else if (selected_nodes.length === 1  && Bro(selected_nodes[0]).iCanHaz("children.0.children.length") === 1
    && (Bro(selected_nodes[0]).iCanHaz("children.0.children.0.children.length") > 1 || Bro(selected_nodes[0]).iCanHaz("children.0.children.0.children.0.type2") === "frac")
    && (Bro(selected_nodes[0]).iCanHaz("type2") === "exp" || Bro(selected_nodes[0]).iCanHaz("type2") === "group_exp"))
  {
    console.log("distributing power in");
    //ANIMATION?
    var power_text = selected_nodes[0].children[1].text;
    var base_factors = selected_nodes[0].children[0].children[0].children;
    var text = exponentiate(base_factors, false, power_text,true);
    new_math_str = replace_in_mtstr(selected_nodes, text);
    current_index++;
    prepare(new_math_str);
  }
  //split exponential with terms into exponentials
  else if (selected_nodes.length === 1  && selected_nodes[0].children.length > 1
    && selected_nodes[0].type === "power")
  {
    console.log("split exponential with terms into exponentials");
    //ANIMATION?
    var base_text;
    if (selected_nodes[0].parent.children[0].children.length === 1 && selected_nodes[0].parent.children[0].children[0].children.length === 1) {
      base_text = selected_nodes[0].parent.children[0].text;
    } else {
      base_text = "(" + selected_nodes[0].parent.children[0].text + ")";
    }
    var text = ""
    var power_terms = selected_nodes[0].children;
    for (var i=0; i<power_terms.length; i++) {
      text+=base_text + "^{" + power_terms[i].text + "}";
    }
    new_math_str = replace_in_mtstr([selected_nodes[0].parent], text);
    current_index++;
    prepare(new_math_str);
  }

  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(8);}
}

//merging stuff
export function collect_out() {
  var same_parents = have_same_ancestors(selected_nodes, 1),
  same_grandparents = have_same_ancestors(selected_nodes, 2),
  same_type = have_same_type(selected_nodes),
  same_type2 = have_same_type(selected_nodes,1),
  same_text = have_same_text(selected_nodes),
  single_factor = have_single_factor(selected_nodes),
  are_fracs = are_of_type(selected_nodes.map(function(x) {var index = x.children.length-1; return Bro(x).iCanHaz("children."+index.toString())}), "frac",1),
  same_term = are_same_terms(selected_nodes),
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
  if (selected_nodes[0].type==="factor" && same_type) {
    var j=0;
    factor_texts[j] = selected_nodes[0].text;
    fact_cnt[j]=1;
    if (selected_nodes[0].parent.parent.type==="denominator") {

    } else {
      console.log("selected nodes", selected_nodes);
      term_ids.push(selected_nodes[0].parent.model.id);
      for (i=0; i<selected_nodes.length-1; i++) {
        if (selected_nodes[i].parent === selected_nodes[i+1].parent) {
          factor_texts[j] += selected_nodes[i+1].text;
          fact_cnt[j]++;
        } else {
          create_fact_subs(selected_nodes[i].parent, fact_cnt[j]);
          j++; //next factor
          factor_texts[j] = selected_nodes[i+1].text;
          fact_cnt[j]=1;
          term_ids.push(selected_nodes[i+1].parent.model.id);
        }
        console.log("fact_subs", fact_subs);
        last_node_in_loop = selected_nodes[i+1];
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
  if (selected_nodes[0].type === "factor" && same_type && same_grandparents && same_factors && factor_texts.length > 1)
  {
    console.log("factor out");
    $selected.animate({"font-size": 0, opacity: 0}, step_duration) //AS USUAL, IMPROVE ANIMATION
      .css('overflow', 'visible')
      .promise()
      .done(function() {
        var selected_terms = [];
        var selected_text = factor_texts[0];
        new_math_str = replace_in_mtstr(selected_nodes, fact_subs);
        var new_text = "";
        playing = true; //so that it doesn't go into history..
        prepare(new_math_str); //I SHOULD CREATE A FUNCTION THAT PARSES A LATEX STRING INTO A MATH_ROOT IDEALLY...
        playing = false;
        for (var k=0; k<term_ids.length; k++) {
          var term = math_root.first(function (node) {
            return node.model.id === term_ids[k]; //They will have the same id, because we have only removed children of them.
          });
          new_text += term.text;
          selected_terms.push(term);
        }
        new_text = "+" + selected_text + "(" + new_text + ")";
        new_math_str = replace_in_mtstr(selected_terms, new_text);
        current_index++;
      prepare(new_math_str);
      });
  }
  //merge equal factors into exp
  else if (selected_nodes[0].type === "factor" && same_parents && same_type && same_text)
  {
    console.log("merge equal factors into exp");
    //ANIMATION??
    new_math_str = replace_in_mtstr(selected_nodes, eval_expression(selected_text));
    // new_math_str = replace_in_mtstr(selected_nodes, selected_nodes[0].text + "^{" + selected_nodes.length.toString() + "}");
    current_index++;
    prepare(new_math_str);
  }
  //merge equal terms into term
  else if (selected_nodes[0].type === "term" && same_type && same_term && selected_nodes.length > 1)
  {
    console.log("merge equal terms into term");
    var term_text = selected_nodes[0].text;
    if (selected_nodes[0].children[0].type2 === "op") {
      term_text = selected_nodes[0].text.slice(1);
    }
    new_math_str = replace_in_mtstr(selected_nodes, "+" + selected_nodes.length.toString() + term_text);

    current_index++;
    prepare(new_math_str);
  }
  //merge fraction terms into fraction
  else if (selected_nodes[0].type === "term" && same_type && single_factor && are_fracs && have_same_denom(selected_nodes) && selected_nodes.length > 1)
  {
    console.log("merge fraction terms into fraction");

    //ANIMATION??
    var denominator_text = selected_nodes[0].children[selected_nodes[0].children.length-1].children[1].text;
    var numerator_text = "";
    for (var i=0; i<selected_nodes.length; i++) {
      if (i > 0) {numerator_text+="+";}
      if (selected_nodes[i].children[selected_nodes[i].children.length-1].children[0].children.length > 1) {
        numerator_text+="(" + selected_nodes[i].children[selected_nodes[i].children.length-1].children[0].text + ")";
      } else {
        numerator_text+=selected_nodes[i].children[selected_nodes[i].children.length-1].children[0].text;
      }
    }
    var new_text = "+\\frac{" + numerator_text + "}{" + denominator_text + "}";
    new_math_str = replace_in_mtstr(selected_nodes, new_text);
    current_index++;
    prepare(new_math_str);
  }
  //merge terms into fraction
  else if (selected_nodes[0].type === "term" && same_type && selected_nodes.length > 1)
  {
    console.log("merge terms into fraction");
    var denominator_nodes = [];
    for (var i=0; i<selected_nodes.length; i++) {//making sure all elements that are fractions have the same denominator
      if (have_single_factor([selected_nodes[i]]) && selected_nodes[i].children[selected_nodes[i].children.length-1].type2 === "frac") {
        denominator_nodes.push(selected_nodes[i].children[selected_nodes[i].children.length-1].children[1]); //doing the selected_nodes[i].children.length-1 in case there's an op.
      }
    }
    var denominator_text = multiply_grouped_nodes(denominator_nodes);
    var numerator_text = "";
    var j = 0;
    for (var i=0; i<selected_nodes.length; i++) {
      if (i > 0) {numerator_text+="+";}
      if (have_single_factor([selected_nodes[i]]) && selected_nodes[i].children[selected_nodes[i].children.length-1].type2 === "frac") {
        var temp_denom_nodes = denominator_nodes.slice();
        denominator_nodes.splice(j,1)
        var new_nodes = [selected_nodes[i].children[selected_nodes[i].children.length-1].children[0]].concat(denominator_nodes);
        denominator_nodes = temp_denom_nodes;
        numerator_text += multiply_grouped_nodes(new_nodes);
        j++;
      } else {
        numerator_text += selected_nodes[i].text + denominator_text;
      }

    }
    console.log(numerator_text);
    //ANIMATION??
    var new_text = "+\\frac{" + numerator_text + "}{" + denominator_text + "}";
    // new_text = "+" + rationalize(selected_text);
    new_math_str = replace_in_mtstr(selected_nodes, new_text);
    current_index++;
    prepare(new_math_str);
  }
  //merge exponentials
  else if ((selected_nodes[0].type2 === "exp" || selected_nodes[0].type2 === "group_exp")
  && same_parents && same_type)
  {
    console.log("merge exponentials");
    var same_base = true, same_power = true;
    for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts are of the same base
      if (selected_nodes[i].children[0].text !== selected_nodes[i+1].children[0].text) {same_base = false}
    }
    for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts are of the same base
      if (selected_nodes[i].children[1].text !== selected_nodes[i+1].children[1].text) {same_power = false}
    }
    if (same_base && !same_power) //with common base
    {
      console.log("merge exponentials with common base");
      //ANIMATION??
      var power_text = "", base_text="";
      if (selected_nodes[0].children[0].children.length === 1) {
        base_text = selected_nodes[0].children[0].text;
      } else {
        base_text = add_brackets(selected_nodes[0].children[0].text);
      }
      for (var i=0; i<selected_nodes.length; i++) {
        if (i > 0) {power_text+="+";}
        power_text+=selected_nodes[i].children[1].text;
      }
      var new_text = base_text + "^{" + power_text + "}";
      new_math_str = replace_in_mtstr(selected_nodes, new_text);
      current_index++;
      prepare(new_math_str);
    }
    else if (same_power && !same_base)  //with common power
    {
      console.log("merge exponentials with common power");
      //ANIMATION??
      var power_text = selected_nodes[0].children[1].text, base_text="";
      for (var i=0; i<selected_nodes.length; i++) {
        if (selected_nodes[i].children[0].children.length === 1) {
          base_text+=selected_nodes[i].children[0].text;
        } else {
          base_text+=add_brackets(selected_nodes[i].children[0].text);
        }
      }
      var new_text = "(" + base_text + ")" + "^{" + power_text + "}";
      new_math_str = replace_in_mtstr(selected_nodes, new_text);
      current_index++;
      prepare(new_math_str);
    }
  }
  //merge square roots into square root
  else if (selected_nodes[0].type2 === "sqrt" && same_parents && same_type2)
  {
    console.log("merge square roots into square root");
    //ANIMATION??
    var new_text = "\\sqrt{"
    for (var i=0; i<selected_nodes.length; i++) {//making sure all elemnts are fracs (for single elements)
      if (selected_nodes[i].children.length === 1) {
        new_text+=selected_nodes[i].children[0].text;
      } else {
        new_text+="(";
        for (var j=0; j<selected_nodes[i].children.length; j++) {
          new_text+=selected_nodes[i].children[j].text;
        }
        new_text+=")";
      }
    }
    new_text+="}";
    new_math_str = replace_in_mtstr(selected_nodes, new_text);
    current_index++;
    prepare(new_math_str);
  }

  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(13);}
}

//unbracket
export function unbracket() {
  //animation?
  var new_term="";
  new_term += selected_text.replace(/^\(|\)$/g, "");
  new_math_str = replace_in_mtstr(selected_nodes, new_term);
  current_index++;
  prepare(new_math_str);
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(9);}
}

//evaulate simple sum or multiplication
export function evaluate() {
  for (var i=0; i<selected_nodes.length-1; i++) { //making sure, all elements are of the same parent
    if (selected_nodes[i].parent !== selected_nodes[i+1].parent) {return;}
  }
  //equals position not too well animated
  $selected.animate({"font-size": 0, opacity: 0}, step_duration).css('overflow', 'visible').promise().done(function() {
    new_term = eval_expression(selected_text); //only works for sqrts or fracs separately, but not together
    new_math_str = replace_in_mtstr(selected_nodes, new_term);
    current_index++;
    prepare(new_math_str);
  });
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(3);}
}

//operate with an operator
export function operate() {
  if (selected_nodes.length === 1 && selected_nodes[0].type2 === "diff") {
    var variable = selected_nodes[0].children[0].text;
    var expression = "";
    var next_nodes = get_all_next(selected_nodes[0]);
    for (var i = 0; i < next_nodes.length; i++) {
      expression+=next_nodes[i].text;
    };
    expression = latex_to_ascii(expression);
    console.log(variable);
    //IMPROVE ANIMATION (LOOK AT THE MECHANICAL UNIVERSE)
    $selected.animate({"font-size": 0, opacity: 0}, step_duration).css('overflow', 'visible').promise().done(function() {
      new_term = CQ(expression).differentiate(variable).toLaTeX().replace("\\cdot", "");
      new_math_str = replace_in_mtstr(selected_nodes.concat(next_nodes), new_term);
      current_index++;
      prepare(new_math_str);
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
export function add_both_sides(thing) {
  console.log("ho");
  math_HS = math_str[current_index].split("=");
  new_math_str = math_HS[0] + thing + "=" +math_HS[1] + thing;
  console.log(new_math_str);
  current_index++;
  prepare(new_math_str);
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
export function replace(text) {
  $selected.animate({"font-size": 0, opacity: 0}, step_duration/2)
    .css('overflow', 'visible')
    .promise()
    .done(function() {
      if (replace_ind) {
        var text_arr = [];
        for (var i=0; i<selected_nodes.length; i++) {
          text_arr.push(text);
        }
      new_math_str = replace_in_mtstr(selected_nodes, text_arr);

      } else {
        new_math_str = replace_in_mtstr(selected_nodes, text);
      }
      current_index++;
    prepare(new_math_str);
    });
    if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(10, text);}
}

//remove something. Used for: cancelling something on both sides, or cancelling something on a fraction, among other things
export function remove() {
  $selected.animate({"font-size": 0, opacity: 0}, step_duration)
    .css('overflow', 'visible')
    .promise()
    .done(function() {
      new_math_str = replace_in_mtstr(selected_nodes, "");
      current_index++;
    prepare(new_math_str);
    });
    if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(11);}
}

//cancel out factors in a fraction. TODO: also be able to cancel terms.
export function cancel_out() {
  var same_factor = true,
    same_parents = have_same_ancestors(selected_nodes, 1),
    same_grandparents = have_same_ancestors(selected_nodes, 2),
    same_ggparents = have_same_ancestors(selected_nodes, 3),
    same_type = have_same_type(selected_nodes),
    same_type2 = have_same_type(selected_nodes,1);

    //cancel factors
    if (selected_nodes[0].type === "factor" && same_type && same_ggparents
        && Bro(selected_nodes[0]).iCanHaz("parent.parent.parent.type2") === "frac"
        && Bro(selected_nodes[0]).iCanHaz("parent.parent.parent.children.0.children.length") === 1
        && Bro(selected_nodes[0]).iCanHaz("parent.parent.parent.children.1.children.length") === 1)
    {
      console.log("canceling out")
      var num_text = "", denom_text = "";
      var num_nodes = [], denom_nodes = [];
      for (var i = 0; i < selected_nodes.length; i++) {
        if (selected_nodes[i].parent.parent.type === "numerator") {
          num_text+=selected_nodes[i].text;
          num_nodes.push(selected_nodes[i]);
        } else if (selected_nodes[i].parent.parent.type === "denominator") {
          denom_text+=selected_nodes[i].text;
          denom_nodes.push(selected_nodes[i]);
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
      new_math_str = replace_in_mtstr(num_nodes.concat(denom_nodes), new_num_strs.concat(new_denom_strs));
      prepare(new_math_str);
    }
    //TODO: Add way to cancel terms too.
}

//flip equation
export function flip_equation() {
  var offset1 = tot_width($equals.prevAll(), true, false) + tot_width($equals, true, false);
  var offset2 = tot_width($equals.nextAll(), true, false) + tot_width($equals, true, false);
  $equals.prevAll().animate({left:offset1}, step_duration);
  $equals.nextAll().animate({left:-offset2}, step_duration)
    .promise()
    .done(function() {
    math_HS = math_str[current_index].split("=");
    new_math_str = math_HS[1] + "=" + math_HS[0];
    current_index++;
    prepare(new_math_str);
  });
  if (recording || playing) {recording_index++;}
  if (recording) {add_to_manip_rec(15);}
}
