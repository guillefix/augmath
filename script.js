//Need to maybe add more validation of the operations you are doing. In any case, this is such a big project, there'll always be work to do.
//Probably a good addition would be to add MathQuill (http://mathquill.com/) for math input
var h_eq_shift=0, 
	v_eq_shift=0, 
	equals_position = {left: 0, top: 100}, 
	manip = "term",
	depth = 1, 
	multi_select = false, 
	step_duration = 700,
	TEST, 
	inner_select = false, 
	math_root, 
	selected_nodes = [], 
	selected_text = "", 
	math_str = [],
	current_index = 0;

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
	} else if (manip === "power") {
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
var math_str_el = $("#math_input");
math_str_el.keyup(function (e) {
    if (e.keyCode == 13) {
        prepare(this.value);
    }
});


//manipulatives
//This creates a tree by going through the terms in an expression, and going through its factors. Factors that can contain whole expressions within them are then recursively analyzed in the same way.

function parse_poly(root, poly, parent_id, is_container) {
	var poly_str = "";
	var term_cnt = 0;
	var factor_cnt = 0;
	var i = 0; 
	var factor_obj, factor, op, term_obj=$(), factor_id, term_id, inside, nom_str, denom_str, prev_factor_id, inside_text, base_obj, power_obj, base, power, child1, child2;
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
			factor.type2 = "normal";
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
			term_obj = $();
			term.text = "";
			term.type = "term";
			if (thing.is(".mbin")) {
				root.addChild(term);
				term.addChild(op);
				op.type = "op";
				op.text = (thing.text() === "−") ? "-" : "+"
				term_obj = term_obj.add(thing);
				term.text+=op.text;
			} else if (thing.is(".mrel")) {
				term = tree.parse({id: term_id, obj: thing});
				root.addChild(term);
				term.addChild(op);
				op.type = "rel";
				op.text = thing.text();
				term_cnt++;
				poly_str+=term.text;
				factor_cnt = 0;
				term_id = parent_id.toString() + "/" + (term_cnt+1).toString();
				term = tree.parse({id: term_id});
				root.addChild(term);
				term_obj = $();
				term.text = "";
				term.type = "term";
			}
			i++;
		}

		//deal with things with children, recursivelly.
		if (factor_obj.is(":has(*)")) {
			if (thing.is(".minner") || thing.children(".mfrac").length !== 0) {//fractions
				factor.type2 = "frac";
				denominator = thing.closest_n_descendents(".mord", 2).first();
				nominator = thing.closest_n_descendents(".mord", 2).last();
				child1 = tree.parse({id: factor_id + "/" + "1", obj: nominator});
				child1.type = "nominator";
				child2 = tree.parse({id: factor_id + "/" + "2", obj: denominator});
				child2.type = "denominator";
				factor.addChild(child1);
				factor.addChild(child2);
				//TEST = thing;
				nom_str = parse_poly(child1, nominator, factor_id + "/" + "1", true);
				child1.text = nom_str;
				denom_str = parse_poly(child2, denominator, factor_id + "/" + "2", true);
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
				term.text+=factor.text;
			}
		}
		if (i === things.length) {term.model.obj = term_obj; poly_str+=term.text;}
	};
	return poly_str;
}

function prepare(math) {

	math = math.replace(/\\frac{}/g, "\\frac{1}")
				.replace(/=$/, "=0")
				.replace(/\^{}/g, "");

	if (current_index < math_str.length) {
		math_str[current_index] = math;
	} else {
		current_index = math_str.push(math)-1;
	}
	console.log(current_index);
	console.log("Math: " + math);

	var math_el = document.getElementById("math");
	katex.render(math, math_el, { displayMode: true });

	math_str_el.value = math_str[current_index];

	var root_poly = $(".base");

	tree = new TreeModel();

	math_root = tree.parse({});
	math_root.model.id = "0";
	//KaTeX offers MathML semantic elements on the HTML, could that be used?
	
	parse_poly(math_root, root_poly, 0, true);

	math_root.walk(function (node) {
		node.selected = false;
	});

	//useful variables
	$equals = $(".base").find(".mrel");
	beginning_of_equation = math_root.children[0].model.obj.offset();
	width_last_term = math_root.children[math_root.children.length-1].model.obj.outerWidth(includeMargin=true);
	end_of_equation = math_root.children[math_root.children.length-1].model.obj.offset();
	end_of_equation.left += + width_last_term;

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

function cleanIndices(arr, str) {
	var indices = getIndicesOf("\\frac", str);
	indices = indices.concat(getIndicesOf("\\sqrt", str));
	for (var i=0; i < arr.length; i++) {
		for (var j=0; j < indices.length; j++) {
			if (arr[i] >= indices[j] && arr[i] <= indices[j]+4) {
				arr.splice(i, 1);
			}
		}
	}
	return arr;
}

function parse_mtstr(root, node_arr, str_arr) {
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
			var frac_text = [], exp_text = [];
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
			} else if (grandchild.type === "op") {
				term_text+=grandchild.text;
			} else {
				switch (grandchild.type2) {
					case "normal":
						term_text+=grandchild.text;
						break;
					case "group":
						factor_text = "(" + parse_mtstr(grandchild, node_arr, str_arr) + ")";
						break;
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
						factor_text = "\\frac{" + frac_text[0] + "}{" + frac_text[1] + "}"
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

function replace_in_mtstr(nodes, str_arr) {
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

function eval_expression(expression) {
	var new_term;
	if (expression.indexOf("\\sqrt") > -1) {
		expression = expression.replace("\\sqrt{", "").replace("}", "^0.5");
	} else if (expression.indexOf("\\frac") > -1) {
		expression = expression.replace("\\frac{", "(").replace("}{", "/").replace("}", ")");
	}
	
	if (expression.search(/[a-z]/) > -1) { //doesn't work with some expressions, as usual
		expression = expression.split("").join("*");
		expression = expression.replace("*+*", "+");
		expression = expression.replace("*-*", "-");
		expression = expression.replace("*=*", "=");
		console.log(expression);
		expression = expression.replace(/\*\^\*\{\*([0-9]+)\*\}/g, "**$1"); //need to check if this works
		try {
			new_term = CQ(expression).simplify().toLaTeX().replace("\\cdot", ""); //removing cdot format
		}
		catch(err) {
			console.log("Error (from CQ): " + err);
		}
		finally {
			new_term = CQ(expression).simplify().toString().replace(/\*{2}(\d+)/, "^{$1}").replace(/\*/g, "").replace(/\(([a-z]+)\)/g, "$1");
		}
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

var initial_math_str = "ax^{2}+bx+c=0";

$(document).ready(function() {prepare(initial_math_str);});

//manipulations

//change a term of side
change_side = document.getElementById("change_side");
change_side.onclick = function() {
	var selected_width = tot_width($selected, true, true);
	//different behaviour depending on which side of the eq., determined by existence of equal sign before or after
	if ($selected.prevAll(".mrel").length === 0) { //before eq sign
		offset = (end_of_equation.left-selected_position.left);
		$selected.first().prevAll().animate({left:selected_width}, step_duration);
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
		$selected.animate({left:offset}, step_duration).promise().done(function() {
			$selected = $(".selected").add($(".selected").find("*"));
			new_term = change_sign(selected_nodes);
			new_math_str = replace_in_mtstr(selected_nodes, "");
			new_math_str = new_math_str.replace("=", new_term+"=");
			current_index++;
			prepare(new_math_str);
		});
	}
};

//divide by factor.
divide_factor = document.getElementById("divide_factor");
divide_factor.onclick = function() {
	equals_position = $equals.offset();
	if ($selected.prevAll(".mrel").length === 0) { //before eq sign
		RHS_width = tot_width($equals.nextAll(), false, false);
		h_offset = $equals.offset().left - $selected.offset().left + tot_width($equals, true, false) + (RHS_width)/2;
		v_offset = $selected.outerHeight(includeMargin=true)/2;
		$equals.nextAll().animate({top:-v_offset, left:tot_width($selected, true, false)/2}, step_duration);
		$selected.animate({left:h_offset, top:v_offset}, step_duration).promise().done(function() {
			new_math_str = replace_in_mtstr(selected_nodes, "");
			math_HS = new_math_str.split("="); //HS=hand sides
			new_math_str = math_HS[0] + "=" + "\\frac{" + math_HS[1] + "}{" + selected_text + "}";
			current_index++;
			prepare(new_math_str);
		});
	} else { //after eq sign
		LHS_width = tot_width($equals.prevAll(), false, false);
		h_offset = $selected.offset().left - $equals.offset().left + (LHS_width)/2;
		v_offset = $selected.outerHeight(includeMargin=true)/2;
		$equals.prevAll().animate({top:-v_offset, left:tot_width($selected, true, false)/2}, step_duration);
		$selected.animate({left:-h_offset, top:v_offset}, step_duration).promise().done(function() {
			new_math_str = replace_in_mtstr(selected_nodes, "");
			math_HS = new_math_str.split("="); //HS=hand sides
			new_math_str = "\\frac{" + math_HS[0] + "}{" + selected_text + "}" + "=" + math_HS[1];
			current_index++;
			prepare(new_math_str);
		});
	}

}

//evaulate simple sum or multiplication
eval = document.getElementById("eval");
eval.onclick = function() {
	//equals position not too well animated
	$selected.animate({"font-size": 0, opacity: 0}, step_duration).css('overflow', 'visible').promise().done(function() {
		new_term = eval_expression(selected_text); //only works for sqrts or fracs separately, but not together
		new_math_str = replace_in_mtstr(selected_nodes, new_term);
		current_index++;
		prepare(new_math_str);
	});
}

//move term within expression, or factor within term
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
			if (!has_op($selected) && selected_nodes[0].type === "term") {selected_text_str = "+" + selected_text;} else {selected_text_str = selected_text;}
			next_text = next_node.text;
			if (!has_op($selected_next) && selected_nodes[0].type === "term") {next_text_str = "+" + next_text;} else {next_text_str = next_text;}
			new_math_str = replace_in_mtstr([next_node].concat(selected_nodes), [selected_text_str, next_text_str]);
			current_index++;
			prepare(new_math_str);
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
			if (!has_op($selected) && selected_nodes[0].type === "term") {selected_text_str = "+" + selected_text;} else {selected_text_str = selected_text;}
			prev_text = prev_node.text;
			if (!has_op($selected_prev) && selected_nodes[0].type === "term") {prev_text_str = "+" + prev_text;} else {prev_text_str = prev_text;}
			new_math_str = replace_in_mtstr([prev_node].concat(selected_nodes), [selected_text_str, prev_text_str]);
			current_index++;
			prepare(new_math_str);
		});
	}
}

//change power of side.
root_power = document.getElementById("root_power");
root_power.onclick = function() {
	equals_position = $equals.offset();
	if ($selected.parent().prevAll(".mrel").length === 0) { //before eq sign
		var offset = end_of_equation.left - equals_position.left;
		$selected.animate({left:offset}, step_duration).promise().done(function() {
			new_math_str = replace_in_mtstr(selected_nodes, "");
			math_HS = new_math_str.split("="); //HS=hand sides
			if (selected_nodes[0].text === "2") {
				new_math_str = math_HS[0] + "=" + "\\sqrt{" + math_HS[1] + "}";
			} else {
				new_math_str = math_HS[0] + "=" + "(" + math_HS[1] + ")" + "^{" + "\\frac{1}{" + selected_text + "}}"; //ad brackets
			}
			current_index++;
			prepare(new_math_str);
		});
	} else {
		var offset = end_of_equation.left - equals_position.left;
		$selected.animate({left:-offset}, step_duration).promise().done(function() {
			new_math_str = replace_in_mtstr(selected_nodes, "");
			math_HS = new_math_str.split("="); //HS=hand sides
			if (selected_nodes[0].text === "2") {
				new_math_str = "\\sqrt{" + math_HS[0] + "}" + "=" + math_HS[1];
			} else {
				new_math_str = "(" + math_HS[0] + ")" + "^{" + "\\frac{1}{" + selected_text + "}}" + "=" + math_HS[1]; //ad brackets
			}
			current_index++;
			prepare(new_math_str);
		});
	}

}

//Add something to both sides
function add_both_sides(thing) {
	math_HS = new_math_str.split("=");
	new_math_str = math_HS[0] + thing + "=" +math_HS[1] + thing;
	current_index++;
	prepare(new_math_str);
}

//split fraction.
split_frac = document.getElementById("split_frac");
split_frac.onclick = function() {
	//ANIMATION? SHOULD CLONE THE DENOMINATOR AND MOVE TO THE RIGHT PLACES
	var new_term="";
	for (var i=0; i<selected_nodes[0].children[0].children.length; i++) {
		new_term += "+" + "\\frac{" + selected_nodes[0].children[0].children[i].text + "}{" + selected_nodes[0].children[1].text + "}";
	}
	var parent = math_root.first(function (node) {
    	for (var j=0; j<node.children.length; j++) {
    		if (node.children[j].model.id === selected_nodes[0].model.id) {
    			return true;
    		}
    	}
	});
	if (parent.type === "term") {
		new_term = "(" + new_term + ")";
	}
	new_math_str = replace_in_mtstr(selected_nodes, new_term);
	current_index++;
	prepare(new_math_str);
}

//unbracket
unbracket = document.getElementById("unbracket");
unbracket.onclick = function() {
	//animation?
	var new_term="";
	new_term += selected_text.replace(/^\(|\)$/g, "");
	new_math_str = replace_in_mtstr(selected_nodes, new_term);
	current_index++;
	prepare(new_math_str);
}

//replace something
function replace(text) {
	$selected.animate({"font-size": 0, opacity: 0}, step_duration)
    .css('overflow', 'visible')
    .promise()
    .done(function() {
  		new_math_str = replace_in_mtstr(selected_nodes, text);
  		current_index++;
		prepare(new_math_str);
  	});
}

//remove something. Used for: cancelling something on both sides, or cancelling something on a fraction, among other things
remove = document.getElementById("remove");
remove.onclick = function () {
	$selected.animate({"font-size": 0, opacity: 0}, step_duration)
    .css('overflow', 'visible')
    .promise()
    .done(function() {
  		new_math_str = replace_in_mtstr(selected_nodes, "");
  		current_index++;
		prepare(new_math_str);
  	});
}

//distribute factor over group of terms (grouped factor)
distribute_in = document.getElementById("distribute_in");
distribute_in.onclick = function () {
	$selected.animate({"font-size": 0, opacity: 0}, step_duration) //IMPROVE ANIMATION (FOR EXAMPLE CLONE)
    .css('overflow', 'visible')
    .promise()
    .done(function() {
    	var next_node = get_next(selected_nodes);
    	var text="";
    	for (var i=0; i<next_node.children.length; i++) {
    		if (next_node.children[i].text.search(/[+-]/) === 0) {
    			text += next_node.children[i].text.slice(0, 1) + selected_text + next_node.children[i].text.slice(1, next_node.children[i].text.length);
    		} else {
    			text += selected_text + next_node.children[i].text;
    		}
    	}
  		new_math_str = replace_in_mtstr(selected_nodes.concat(next_node), "(" + text + ")");
  		current_index++;
		prepare(new_math_str);
  	});
}

//factor factor from group of terms
factor_out = document.getElementById("factor_out");
factor_out.onclick = function () {
	$selected.animate({"font-size": 0, opacity: 0}, step_duration) //AS USUAL, IMPROVE ANIMATION
    .css('overflow', 'visible')
    .promise()
    .done(function() {
    	var term_ids = [], selected_terms = [];
    	var selected_text = selected_nodes[0].text;
  		new_math_str = replace_in_mtstr(selected_nodes, "");
  		var new_text = "";
  		for (var i=0; i<selected_nodes.length; i++) {
	    	var parent = math_root.first(function (node) {
		    	for (var j=0; j<node.children.length; j++) {
		    		if (node.children[j].model.id === selected_nodes[i].model.id) {
		    			return true;
		    		}
		    	}
			});
			term_ids.push(parent.model.id);
		}
  		prepare(new_math_str);
  		for (var k=0; k<term_ids.length; k++) {
  			var term = math_root.first(function (node) {
  				return node.model.id === term_ids[k];
  			});
  			new_text += term.text;
  			selected_terms.push(term);
  		}
  		new_text = selected_text + "(" + new_text + ")";
  		new_math_str = replace_in_mtstr(selected_terms, new_text);
  		current_index++;
		prepare(new_math_str);
  	});
}

//History
//undo
undo = document.getElementById("undo");
undo.onclick = function () {
	if (current_index > 0) {
		console.log(current_index);
		current_index--;
		prepare(math_str[current_index]);
	}
}


//redo
redo = document.getElementById("redo");
redo.onclick = function () {
	if (current_index < math_str.length-1) {
		current_index++;
		prepare(math_str[current_index]);
	}
}