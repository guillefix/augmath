//Need to maybe add more validation of the operations you are doing. In any case, this is such a big project, there'll always be work to do.

var math_str, 
	h_eq_shift=0, 
	v_eq_shift=0, 
	equals_position = {left: 0, top: 0}, 
	manip = "term",
	depth = 1, 
	multi_select = false, 
	step_duration = 700,
	TEST, 
	inner_select = false, 
	math_root, 
	selected_nodes = [], 
	selected_text = "";

//UI stuff
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
	}
});
depth_el.on("change", function () {remove_events(manip, depth); depth = parseInt(this.value, 10); create_events(manip, depth);});
$("#multi_select").on("click", function () {multi_select = document.getElementById("multi_select").checked;});
$("#inner_select").on("click", function () {inner_select = document.getElementById("inner_select").checked; prepare(math_str);});

//manipulatives
function prepare(math) {

	math_str = math;

	var math_el = document.getElementById("math");
	katex.render(math, math_el, { displayMode: true });

	var root_poly = $(".base");

	var tree = new TreeModel();

	math_root = tree.parse({});
	math_root.model.id = "0";
	function parse_poly(root, poly, parent_id, is_container) {
		var poly_str = "";
		var term_cnt = 0;
		var factor_cnt = 0;
		var i = 0; 
		var factor_obj, factor, op, term_obj=$(), factor_id, term_id, inside, nom_str, denom_str, prev_factor_id, inside_text, base_obj, power_obj, base, power;
		var nominator, denominator;
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
			//deal with elements grouped by brackets
			if (thing.is(".mopen")) {
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
				if (!factor_obj.last().is(".mclose:has(.vlist)")) {
					inside_text = parse_poly(factor, inside, factor_id, false);
					factor.text = "(" + inside_text + ")";
					term.text+=factor.text;
				}
			}
			//if not grouped, deal with individual element
			if (!thing.is(".mbin, .mopen, .mclose, .mrel")) {
				factor = tree.parse({id: factor_id, obj: factor_obj});
				factor.type = "factor";
				if (!thing.is(":has(*)")) {
					factor.text = thing.text();
					if (factor.text === "−") {factor.text = "-";}
					term.text+=factor.text;
				}
				term.addChild(factor);
				term_obj = term_obj.add(thing);
				factor_cnt++;
				i++;
			} else if (thing.is(".mbin, .mrel")) { //begin new term
				term.model.obj = term_obj;
				term_cnt++;
				poly_str+=term.text;
				factor_cnt = 0;
				term_id = parent_id.toString() + "/" + (term_cnt+1).toString();
				op = tree.parse({id: factor_id, obj: thing});
				term = tree.parse({id: term_id});
				root.addChild(term);
				term_obj = $();
				term.text = "";
				term.type = "term";
				if (thing.is(".mbin")) {
					term.addChild(op);
					op.type = "op";
					op.text = (thing.text() === "−") ? "-" : "+"
					term_obj = term_obj.add(thing);
					term.text+=op.text;
				}
				i++;
			}

			//deal with things with children, recursivelly.
			if (factor_obj.is(":has(*)")) {
				if (thing.is(".minner")) {//fractions
					factor.type2 = "fract";
					denominator = thing.find(".mord.textstyle.cramped").first();
					nominator = thing.find(".mord.textstyle.uncramped").first();
					child1 = tree.parse({id: factor_id + "/" + "1", obj: nominator});
					child1.type = "nominator";
					child2 = tree.parse({id: factor_id + "/" + "2", obj: denominator});
					child2.type = "nominator";
					factor.addChild(child1);
					factor.addChild(child2);
					nom_str = parse_poly(child1, nominator, factor_id + "/" + "1", true);
					child1.text = nom_str;
					denom_str =parse_poly(child2, denominator, factor_id + "/" + "2", true);
					child2.text = denom_str;
					factor.text = "\\frac{" + nom_str + "}{" + denom_str + "}"
					term.text+=factor.text;
				} else if (thing.is(".sqrt")) {//square roots
					factor.type2 = "sqrt";
					inside = thing.find(".mord").first();
					factor.text = "\\sqrt{" + parse_poly(factor, inside, factor_id, true) + "}";
					term.text+=factor.text;
				} else if (thing.is(":has(.vlist)")) {//exponentials
					base_obj = thing.find(".mord").first();
					power_obj = thing.find(".vlist").first();
					inside = power_obj.find(".mord").first();
					base = tree.parse({id: factor_id + "/" + "1", obj: base_obj});
					base.type = "base";
					base.text = base_obj.text();
					power = tree.parse({id: factor_id + "/" + "2", obj: power_obj});
					power.type = "power";
					power.text = parse_poly(power, inside, factor_id + "/" + "2", true);
					factor.addChild(base);
					factor.addChild(power);
					factor.type2 = "exp";
					factor.text = base.text + "^{" + power.text + "}";//needs the standard power format in latex
					term.text+=factor.text;
				} else if (factor_obj.last().is(".mclose:has(.vlist)")) {//exponentiated group
					factor.type2 = "group_ex";
					base_obj = inside;
					base = tree.parse({id: factor_id + "/" + "1", obj: base_obj});
					base.type = "base";
					base.text = parse_poly(base, inside, factor_id, false);
					power_obj = factor_obj.last().find(".vlist").first();
					power = tree.parse({id: factor_id + "/" + "2", obj: power_obj});
					power.type = "power";
					inside = power_obj.find(".mord").first();
					power.text = parse_poly(power, inside, factor_id + "/" + "2", true);
					factor.addChild(base);
					factor.addChild(power);
					factor.text = "(" + base.text + ")" + "^{" + power.text + "}";
					term.text+=factor.text;
				}
			}
			if (i === things.length) {term.model.obj = term_obj; poly_str+=term.text;}
		};
		return poly_str;
	}
	parse_poly(math_root, root_poly, 0, true);

	math_root.walk(function (node) {
		node.selected = false;
	});

	//useful variables
	$equals = $(".base").find(".mrel");
	beginning_of_equation = math_root.children[0].model.obj.offset();
	end_of_equation = math_root.children[math_root.children.length-1].model.obj.offset();
	width_last_term = math_root.children[math_root.children.length-1].model.obj.outerWidth(includeMargin=true);

	create_events(manip, depth);

	//repositioning equals so that it's always in the same place
	new_equals_position = $equals.offset();
	if (equals_position.left !== 0) {h_eq_shift += equals_position.left-new_equals_position.left;}
	if (equals_position.top !== 0) {v_eq_shift += equals_position.top-new_equals_position.top;}
	math_el.setAttribute("style", "left:"+h_eq_shift.toString()+"px;"+"top:"+v_eq_shift.toString()+"px;");

}

function remove_events(type, depth) {
	var $selectable = $();
	math_root.walk(function (node) {
		if (node.model.id !== "0" && node.type === type && getIndicesOf("/", node.model.id).length === depth) {
			$selectable = $selectable.add(node.model.obj);
	    }
	});
	$selectable.off();
}

function create_events(type, depth) {
	var $selectable = $(), index;
	//reset stuff
	math_root.walk(function (node) {
		node.selected = false;
	});
	selected_nodes = [];
	selected_text = "";

	math_root.walk(function (node) {
		if (node.model.id !== "0" && node.type === type && getIndicesOf("/", node.model.id).length === depth) {
			$selectable = $selectable.add(node.model.obj);
	    }
	});
	math_root.walk(function (node) {
		if (node.model.id !== "0" && node.type === type && getIndicesOf("/", node.model.id).length === depth) {
	    	node.model.obj.on("click", function() {
	    		$this = node.model.obj;
	    		$this.toggleClass("selected");
	    		node.selected = !node.selected;
	    		if (!multi_select) {
	    			math_root.walk(function (node2) {
						if (node2 !== node) {node2.selected = false;}
					});
	    			$selectable.filter(".selected").not($this).toggleClass("selected");
	    		}
	    		selected_nodes = [];
	    		selected_text = "";
	    		math_root.walk(function (node) {
					if (node.selected) {selected_nodes.push(node); selected_text += node.text;}
				});
				equals_position = $equals.offset();
				$selected = $(".selected");
				selected_width = tot_width($selected, true);
				selected_position = $selected.offset();
	    	})
	    }
	});
}

function getIndicesOf(searchStr, str) {
    var startIndex = 0, searchStrLen = searchStr.length;
    var index, indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

//function to replace a certain thing from math_str. it deals with same math latex being in different places in equation
function replace_in_mtstr(node_arr, str_arr) {
	var text = math_str;
	if (typeof str_arr === "string") {
		var str = str_arr;
		str_arr = [];
		for (i=0; i<node_arr.length; i++) {
			if (i === 0) {str_arr.push(str);}
			else {str_arr.push("");}
		}
	}
	for (var i=0; i<node_arr.length; i++) {
		var coincidences = getIndicesOf(node_arr[i].text, math_str).length;
		var indices = getIndicesOf(node_arr[i].text, text);
		var coinciding_nodes = math_root.all(function (node) { 
			var coinciding_children;
			for (var j=0; j<node.children.length; j++) {
				if (node.children[j].text === node_arr[i].text) {
					coinciding_children = true;
					break;
				} else {
					coinciding_children = false;
				}
			}
	    	return (node.text === node_arr[i].text && !coinciding_children);
		});
		for (var index = 0; index < coinciding_nodes.length; index++) {
				var coinciding_parent
				if (coinciding_nodes[index].parent.model.id === node_arr[i].model.id) {
					coinciding_parent = true;
				} else {
					coinciding_parent = false;
				}
			if (coinciding_nodes[index].model.id === node_arr[i].model.id || coinciding_parent) {
				if (indices.length !== coincidences) {
					for (var k=0; k<indices.length; k++) {
						if (indices[k] !== getIndicesOf(node_arr[i].text, math_str)[k]) {
							if (indices.length > coincidences && index >= k) {
								index++;
							} else if (indices.length < coincidences && index > k) {
								index--;
							}
							break;
						}
					}
				}
				var chosen_index = indices[index];
				break;
			}
		};
		text = text.slice(0, chosen_index) + str_arr[i] + text.slice(chosen_index+node_arr[i].text.length, text.length);
	}
	return text;
}

function eval_expression(expression) {
	var new_term;
	if (expression.indexOf("\\sqrt") > -1) {
		expression = expression.replace("\\sqrt", "").replace("}", "^0.5");
	} else if (expression.indexOf("\\frac") > -1) {
		expression = expression.replace("\\frac{", "(").replace("}{", "/").replace("}", ")");
	}
	
	if (expression.search(/[a-z]/) > -1) { //doesn't work with some expressions, as usual
		expression = expression.split("").join("*");
		expression = expression.replace("*+*", "+");
		expression = expression.replace("*-*", "-");
		expression = expression.replace("*=*", "=");
		new_term = CQ(expression).simplify().toLaTeX().replace("\\cdot", ""); //removing cdot format
	} else {
		new_term = math.eval(expression).toString();
	}
	return new_term;
}

function tot_width(obj, bool, include_op) {
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

function change_sign(nodes) {
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
	return text;
}

function get_prev(nodes) {
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

function get_next(nodes) {
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

function has_op(obj) {
	if (obj.first().text() === "+" || obj.first().text() === "−") {
		return true;
	} else {
		return false;
	}
}

var initial_math_str = "(a+b)+c=d";

$(document).ready(function() {prepare(initial_math_str);});

//manipulations

//change a term of side
change_side = document.getElementById("change_side");
change_side.onclick = function() {
	var selected_width = tot_width($selected, true, true);
	//different behaviour depending on which side of the eq., determined by existence of equal sign before or after
	if ($selected.prevAll(".mrel").length === 0) { //before eq sign
		offset = (end_of_equation.left-selected_position.left)+width_last_term;
		$selected.first().prevAll().animate({left:selected_width}, step_duration);
		$selected.animate({left:offset}, step_duration).promise().done(function() {
			$selected = $(".selected").add($(".selected").find("*"));
			new_term = change_sign(selected_nodes);
			math_str = replace_in_mtstr(selected_nodes, "")+new_term;
			prepare(math_str);
		});

	} else { //after eq sign
		offset = (equals_position.left-selected_position.left)-tot_width($selected, true, false);
		$selected.prevAll(".mrel").first().prevAll().animate({left:-selected_width}, step_duration);
		$selected.last().nextAll().animate({left:-tot_width($selected, true, false)}, step_duration);
		$selected.animate({left:offset}, step_duration).promise().done(function() {
			$selected = $(".selected").add($(".selected").find("*"));
			new_term = change_sign(selected_nodes);
			math_str = replace_in_mtstr(selected_nodes, "");
			math_str = math_str.replace("=", new_term+"=");
			prepare(math_str);
		});
	}
};

//divide by factor
divide_factor = document.getElementById("divide_factor");
divide_factor.onclick = function() {
	RHS_width = tot_width($equals.nextAll(), false, false);
	h_offset = $equals.offset().left - $selected.offset().left + tot_width($equals, true, false) + (RHS_width)/2;
	v_offset = $selected.outerHeight(includeMargin=true)/2;
	$equals.nextAll().animate({top:-v_offset, left:tot_width($selected, true, false)/2}, step_duration);
	$selected.animate({left:h_offset, top:v_offset}, step_duration).promise().done(function() {
		math_str = replace_in_mtstr(selected_nodes, "");
		math_HS = math_str.split("="); //HS=hand sides
		math_str = math_HS[0] + "=" + "\\frac{" + math_HS[1] + "}{" + selected_text + "}";
		prepare(math_str);
	});

}

//evaulate simple sum or multiplication
eval = document.getElementById("eval");
eval.onclick = function() {
	//equals position not too well animated
	$selected.animate({"font-size": 0, opacity: 0}, step_duration).css('overflow', 'visible').promise().done(function() {
		new_term = eval_expression(selected_text); //only works for sqrts or fracs separately, but not together
		math_str = replace_in_mtstr(selected_nodes, new_term);
		prepare(math_str);
	});
}

//move term within expression

move_right = document.getElementById("move_right");
move_right.onclick = function(){
	if ($selected.next().filter(".mrel").length === 0) {
		var selected_width = tot_width($selected, true, true);
		var selected_text_str, next_text_str;
		var next_node = get_next(selected_nodes);
		var $selected_next = next_node.model.obj;
		var selected_next_width = tot_width($selected_next, true, true);
		$selected_next.animate({left:-selected_width}, step_duration); //animation should take into account possibly missing operator
		$selected.animate({left:selected_next_width}, step_duration).promise().done(function() {
			if (!has_op($selected)) {selected_text_str = "+" + selected_text;} else {selected_text_str = selected_text;}
			next_text = next_node.text;
			if (!has_op($selected_next)) {next_text_str = "+" + next_text;} else {next_text_str = next_text;}
			math_str = replace_in_mtstr([next_node].concat(selected_nodes), [selected_text_str, next_text_str]);
			prepare(math_str);
		});
	}
}
move_left = document.getElementById("move_left");
move_left.onclick = function() {
	if ($selected.prev().filter(".mrel").length === 0) {
		var selected_width = tot_width($selected, true, true);
		var selected_text_str, prev_text_str;
		var prev_node = get_prev(selected_nodes);
		var $selected_prev = prev_node.model.obj;
		var selected_prev_width = tot_width($selected_prev, true, true);
		$selected_prev.animate({left:selected_width}, step_duration);
		$selected.animate({left:-selected_prev_width}, step_duration).promise().done(function() {
			if (!has_op($selected)) {selected_text_str = "+" + selected_text;} else {selected_text_str = selected_text;}
			prev_text = prev_node.text;
			if (!has_op($selected_prev)) {prev_text_str = "+" + prev_text;} else {prev_text_str = prev_text;}
			math_str = replace_in_mtstr([prev_node].concat(selected_nodes), [selected_text_str, prev_text_str]);
			prepare(math_str);
		});
	}
}

//change power of side