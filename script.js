//Probably a good addition would be to add MathQuill (http://mathquill.com/) for math input

//GLOBAL VARIABLES
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
	//for recording
	current_index = 0, 
	selected_nodes_id_rec = [], 
	math_str_rec = [], 
	recording = false, 
	recording_index = 0, 
	manipulation_rec = [], 
	playing = false;

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

//UI STUFF
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
	} else if (manip === "power" 
		|| manip === "available" 
		|| manip === "chosen" 
		|| manip === "nominator" 
		|| manip === "denominator") {
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
        prepare(math_str_el.get()[0].value);
    }
});
$("#recording").on("click", function () {
	recording = document.getElementById("recording").checked;
});
$("#play").on("click", function () {
	math_str_rec.unshift([math_str_rec[0][0]]);
	manipulation_rec.unshift({});
	selected_nodes_id_rec.unshift([]);
	playing = true;
	document.getElementById("recording").checked = false;
	recording = document.getElementById("recording").checked;
	recording_index = 0;
	math_str = math_str_rec[recording_index];
	current_index = math_str.length-1;
	prepare(math_str[current_index]);
});
$("#next_step").on("click", function () {
	if (recording_index>selected_nodes_id_rec.length-2) {return;}
	recording_index++;
	math_str = math_str_rec[recording_index];
	current_index = math_str.length-1;
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
  			change_side()
    		break;
    	case 2:
  			divide_factor()
    		break;
    	case 3:
  			eval()
    		break;
    	case 4:
  			move_right()
    		break;
    	case 5:
  			move_left()
    		break;
    	case 6:
  			root_power()
    		break;
    	case 7:
  			add_both_sides(manipulation_rec[recording_index].arg)
    		break;
    	case 8:
  			push()
    		break;
    	case 9:
  			unbracket()
    		break;
    	case 10:
  			replace(manipulation_rec[recording_index].arg)
    		break;
    	case 11:
  			remove()
    		break;
    	case 12:
  			distribute_in()
    		break;
    	case 13:
  			pull()
    		break;
    	default:
    		break;
	}
});

$("#prev_step").on("click", function () {//FIX THIS
	if (!(recording_index>0)) {return;}
	recording_index--;
	math_str = math_str_rec[recording_index];
	current_index = math_str.length-1;
	prepare(math_str[current_index]);
});

$("#make_json").on("click", function () {
	console.log("selected_nodes_id_rec");
	console.log(JSON.stringify(selected_nodes_id_rec));
	console.log("math_str_rec");
	console.log(JSON.stringify(math_str_rec));
	console.log("manipulation_rec");
	console.log(JSON.stringify(manipulation_rec));
});

//USEFUL FUNCTIONS

//remove and create events that happen when user clicks a manipulative
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
	$(".selected").toggleClass("selected");
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
				var replace_el = document.getElementById("replace");
				replace_el.value = selected_text;
	    	})
	    }
	});
}
//get all the indices of searchStr within str
function getIndicesOf(searchStr, str) { //should fix the getIndicesOf to work with regexes
    var startIndex = 0, searchStrLen = searchStr.length;
    var index, indices = [];
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index);
        startIndex = index + searchStrLen;
    }
    return indices;
}

//ignore matches due to LaTeX sintax
function cleanIndices(arr, str) {
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
//create a LaTeX string from a tree, and substitute the text of node_arr with that contained in str_arr. Useful for manipulations
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
			var frac_text = [], exp_text = [], binom_text = [];
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

//evaluate an expression with Coffeeequate. An incomplete LaTeX to AsciiMath conversion is performed. Should complete it further
function eval_expression(expression) {
	var new_term;
	expression = expression.replace(/\\sqrt\{([a-z0-9]+)\}/g, "($1)**0.5");
	expression = expression.replace(/\}\{/g, ")/(").replace(/\\frac{/g, "(").replace(/\}/g, ")");
	if (expression.search(/[a-z]/) > -1) { //doesn't work with some expressions, as usual
		expression = expression.split("").join("*");
		expression = expression.replace(/\*?\+\*?/g, "+")
								.replace(/\*?-\*?/g, "-")
								.replace(/\*?=\*?/g, "=")
								.replace(/\*?\(\*?/g, "(")
								.replace(/\*?\)\*?/g, ")")
								.replace(/\*?\/\*?/g, "/")
								.replace(/\(\+/g, "(");
		expression = expression.replace(/\*\^\*\{\*([0-9]+)\*\}/g, "**$1"); //need to check if this works
		console.log("Expression is : " + expression);
		try {
			new_term = CQ(expression).simplify().toLaTeX().replace("\\cdot", ""); //removing cdot format
		}
		catch(err) {
			console.log("Error (from CQ): " + err);
			console.log("Expression is : " + expression);
			new_term = CQ(expression).simplify().toString().replace(/\*{2}(\d+)/, "^{$1}").replace(/\*/g, "")
															.replace(/([a-z0-9]+)\/([a-z0-9]+)/, "\\frac{$1}{$2}");
		}
		finally {
		}
	} else {
		new_term = math.eval(expression).toString();
	}
	return new_term;
}

//get the total width of a set of elements
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

//change sign of some nodes
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

//get previous node
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

//get next node
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

//does it have a visible sign?
function has_op(obj) {
	if (obj.first().text() === "+" || obj.first().text() === "−") {
		return true;
	} else {
		return false;
	}
}

//MANIPULATIVES
//This creates a tree by going through the terms in an expression, and going through its factors. Factors that can contain whole expressions within them are then recursively analyzed in the same way.
//This is tied to the way KaTeX renders maths. A good thing would be to do this for MathML, as it's likely to be a standard in the future.
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
			}
			factor_text = factor.text;
		}
		//if not grouped, deal with individual element
		if (!thing.is(".mbin, .mopen, .mclose, .mrel") || thing.text() === "!") {
			factor = tree.parse({id: factor_id, obj: factor_obj});
			factor.type = "factor";
			factor.type2 = "normal";
			if (!thing.is(":has(*)")) {
				factor.text = thing.text();
				if (factor.text === "−") {factor.text = "-";}
			}
			factor_text = factor.text;
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
			factor_text = "";
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
				term.text+=op.text;
				term_cnt++;
				term.text+=op.text;
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
			if (thing.is(".minner") || (thing.children(".mfrac").length !== 0 && thing.children(".mfrac").children(".vlist").children().length === 4)) {//fractions
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
			} else if (thing.is(".sqrt")) {//square roots
				factor.type2 = "sqrt";
				inside = thing.find(".mord").first();
				factor.text = "\\sqrt{" + parse_poly(factor, inside, factor_id, true) + "}";
			} else if (thing.is(":has(.vlist)") && !thing.is(".accent") && thing.children(".mfrac").length === 0) {//exponentials
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
				nominator = thing.closest_n_descendents(".mord", 2).last();
				child1 = tree.parse({id: factor_id + "/" + "1", obj: nominator});
				child1.type = "available";
				child2 = tree.parse({id: factor_id + "/" + "2", obj: denominator});
				child2.type = "chosen";
				factor.addChild(child1);
				factor.addChild(child2);
				nom_str = parse_poly(child1, nominator, factor_id + "/" + "1", true);
				child1.text = nom_str;
				denom_str = parse_poly(child2, denominator, factor_id + "/" + "2", true);
				child2.text = denom_str;
				factor.text = "\\binom{" + nom_str + "}{" + denom_str + "}"
			}
			factor_text = factor.text;
		}
		for (symbol in symbols.math) {
				if (factor_text === symbols.math[symbol].replace) {
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
function prepare(math) {

	math = math.replace(/\\frac{}/g, "\\frac{1}")
				.replace(/=$/, "=0")
				.replace(/^=/, "0=")
				.replace(/\^{}/g, "")
				.replace(/\+/g, '--').replace(/(--)+-/g, '-').replace(/--/g, '+');

	if (!playing) {
		if (current_index < math_str.length) {
			math_str[current_index] = math;
		} else {
			current_index = math_str.push(math)-1;
		}
	}

	if (recording) {
		var ids = [];
		for (var i=0; i<selected_nodes.length; i++) {
			ids.push(selected_nodes[i].model.id);
		}
		selected_nodes_id_rec.push(ids);
		math_str_rec.push(math_str.slice());
	}

	var math_el = document.getElementById("math");
	katex.render(math, math_el, { displayMode: true });
	math_str_el.get()[0].value = math_str[current_index];

	var root_poly = $(".base");

	tree = new TreeModel();

	math_root = tree.parse({});
	math_root.model.id = "0";
	//KaTeX offers MathML semantic elements on the HTML, could that be used?
	
	parse_poly(math_root, root_poly, 0, true);

	math_root.walk(function (node) {
		node.selected = false;
	});

	create_events(manip, depth);

	//repositioning equals so that it's always in the same place
	$equals = $(".base").find(".mrel");
	if ($equals.length !== 0) {
		new_equals_position = $equals.offset();
		if (equals_position.left !== 0) {h_eq_shift += equals_position.left-new_equals_position.left;}
		if (equals_position.top !== 0) {v_eq_shift += equals_position.top-new_equals_position.top;}
		math_el.setAttribute("style", "left:"+h_eq_shift.toString()+"px;"+"top:"+v_eq_shift.toString()+"px;");
		equals_position = $equals.offset();
	}
	//useful variables
	beginning_of_equation = math_root.children[0].model.obj.offset();
	width_last_term = tot_width(math_root.children[math_root.children.length-1].model.obj, true, true);
	end_of_equation = math_root.children[math_root.children.length-1].model.obj.offset();
	end_of_equation.left += width_last_term;
}

//initial render
var initial_math_str = "ax^{2}+bx+c=0";
$(document).ready(function() {prepare(initial_math_str);});

//MANIPULATIONS

//change side
document.getElementById("change_side").onclick = function() {
	change_side();
	if (recording) {
		manipulation_rec.push({manipulation:1});
	}
};
function change_side() {
	equals_position = $equals.offset();
	equals_node = math_root.first(function (node) {
		if (node.children.length > 0) {
	    	return node.children[0].type === "rel";
	    }
	});
	for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts are of the same parent
		if (selected_nodes[i].parent !== selected_nodes[i+1].parent) {return;}
	}
	if (selected_nodes[0].parent === math_root) {
		var selected_width = tot_width($selected, true, true);
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
	} else if (selected_nodes[0].parent.type === "nominator" 
		|| selected_nodes[0].type === "factor" 
		|| selected_nodes[0].type === "nominator") {
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
	} else if (selected_nodes[0].parent.type == "denominator" || selected_nodes[0].type === "denominator") {
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
					new_math_str = math_HS[0] + "=" + "\\frac{" + after_eq_nodes[0].children[0].children[0].text + selected_text + "}{" + after_eq_nodes[0].children[0].children[1].text + "}";
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
			$selected.animate({left:-h_offset, top:v_offset}, step_duration).promise().done(function() {
				new_math_str = replace_in_mtstr(selected_nodes, "");
				math_HS = new_math_str.split("="); //HS=hand sides
				if (include_in_frac) {
					new_math_str = "\\frac{" + before_eq_nodes[0].children[0].children[0].text + selected_text + "}{" + before_eq_nodes[0].children[0].children[1].text + "}" + "=" + math_HS[1];
				} else {
					new_math_str = math_HS[0] + selected_text + "=" + math_HS[1];
				}
				current_index++;
				new_math_str = new_math_str.replace(/\\frac{([ -~]+)}{}/, "$1").replace(/=$/, "=1").replace(/^=/, "1=");
				prepare(new_math_str);
			});
		}
	} else if (selected_nodes[0].type === "power") {
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
};

//move term within expression, or factor within term
document.getElementById("move_right").onclick = function() {
	move_right();
	if (recording) {
		manipulation_rec.push({manipulation:4});
	}
};
function move_right(){
	if ($selected.next().filter(".mrel").length === 0) {
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

document.getElementById("move_left").onclick = function() {
	move_left();
	if (recording) {
		manipulation_rec.push({manipulation:5});
	}
};
function move_left() {
	if ($selected.prev().filter(".mrel").length === 0) {
		var include_op;
		if (selected_nodes[0].type === "factor") {
			include_op = false;
		} else if (selected_nodes[0].type === "term") {
			include_op = true;
		} else {
			return;
		}
		var selected_width = tot_width($selected, true, include_op);
		var selected_text_str, prev_text_str;
		var prev_node = get_prev(selected_nodes);
		var $selected_prev = prev_node.model.obj;
		var selected_prev_width = tot_width($selected_prev, true, include_op);
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

document.getElementById("move_up").onclick = function() {
	move_up();
	if (recording) {
		manipulation_rec.push({manipulation:5}); //change number
	}
};
function move_up() {
	var same_parents = true, same_type = true;
	for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts are of the same type2
		if (selected_nodes[i].type !== selected_nodes[i+1].type) {same_type = false}
	}
	for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts are of the same parent
		if (selected_nodes[i].parent !== selected_nodes[i+1].parent) {same_parents = false}
	}
	if ($selected.prev().filter(".mrel").length === 0 
		&& selected_nodes[0].type === "factor" 
		&& same_type 
		&& same_parents
		&& selected_nodes[0].parent.parent.parent.type2 === "frac"
		&& selected_nodes[0].parent.parent.children.length === 1) {
		var nominator = selected_nodes[0].parent.parent.parent.children[0];
		var new_nom_text = "";
		for (var i=0; i<selected_nodes.length; i++) {
			switch (selected_nodes[0].type2) {
				case "exp":
					new_nom_text+=selected_nodes[i].children[0].text + "^{" + "-" + selected_nodes[i].children[1].text + "}";
					break;
				case "group_exp":
					new_nom_text+="(" + selected_nodes[i].children[0].text + ")" + "^{" + "-" + selected_nodes[i].children[1].text + "}";
					break;
				case "frac":
					new_nom_text+="(" + selected_nodes[i].text + ")" + "^{-1}";
					break;
				default:
					new_nom_text+=selected_nodes[i].children[0].text + "^{-1}";
			}
		}
		if (nominator.children.length === 1) {
			new_nom_text+=nominator.text;
		} else {
			new_nom_text+="(" + nominator.text + ")";
		}
		var selected_width = tot_width($selected, true, false);
		var extra_selected_width = tot_width(math_root.first(function(node) {return node.type2 === "normal"}).model.obj, true, false)*1;
		var h_offset = $selected.offset().left - nominator.model.obj.offset().left + selected_width/2 + extra_selected_width/2;
		var v_offset = $selected.outerHeight()*1.5;
		nominator.model.obj.animate({left:selected_width/2+extra_selected_width/2}, step_duration);
		$selected.last().nextAll().animate({left:-selected_width-extra_selected_width/2}, step_duration);
		$selected.first().prevAll().animate({left:-extra_selected_width/2}, step_duration);
		$selected.animate({left:-h_offset, top:-v_offset}, step_duration).promise().done(function() {
			new_math_str = replace_in_mtstr([nominator].concat(selected_nodes), new_nom_text);
			current_index++;
			prepare(new_math_str);
		});
	}
}

document.getElementById("move_down").onclick = function() {
	move_down();
	if (recording) {
		manipulation_rec.push({manipulation:5}); //change number
	}
};
function move_down() {
	var same_parents = true;
	for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts are of the same parent
		if (selected_nodes[i].parent !== selected_nodes[i+1].parent) {same_parents = false}
	}
	if ($selected.prev().filter(".mrel").length === 0 
		&& selected_nodes[0].type === "factor" 
		&& selected_nodes[0].parent.parent.parent.type2 === "frac"
		&& same_parents
		&& selected_nodes[0].parent.parent.children.length === 1) {
		var denominator = selected_nodes[0].parent.parent.parent.children[1];
		var new_denom_text = "";
		for (var i=0; i<selected_nodes.length; i++) {
			switch (selected_nodes[0].type2) {
				case "exp":
					new_denom_text+=selected_nodes[i].children[0].text + "^{" + "-" + selected_nodes[i].children[1].text + "}";
					break;
				case "group_exp":
					new_denom_text+="(" + selected_nodes[i].children[0].text + ")" + "^{" + "-" + selected_nodes[i].children[1].text + "}";
					break;
				case "frac":
					new_denom_text+="(" + selected_nodes[i].text + ")" + "^{-1}";
					break;
				default:
					new_denom_text+=selected_nodes[i].children[0].text + "^{-1}";
			}
		}
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
}

//split fraction.
document.getElementById("push").onclick = function() {
	push();
	if (recording) {
		manipulation_rec.push({manipulation:8});
	}
};
function push() {
	if (selected_nodes[0].type2 === "fraction") {
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
	} else if (selected_nodes[0].type2 === "normal") {
		$selected.animate({"font-size": 0, opacity: 0}, step_duration) //IMPROVE ANIMATION (FOR EXAMPLE CLONE)
	    .css('overflow', 'visible')
	    .promise()
	    .done(function() {
	    	var next_node = get_next(selected_nodes);
	    	var text = "";
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
	} else if (selected_nodes[0].type2 === "sqrt" && selected_nodes[0].children.length === 1) {
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
}

//factor factor from group of terms
document.getElementById("pull").onclick = function() {
	pull();
	if (recording) {
		manipulation_rec.push({manipulation:13});
	}
};
function pull() {
	var same_parents = true, same_type = true, same_type2 = true, same_text = true;
	for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts are of the same parent
		if (selected_nodes[i].parent !== selected_nodes[i+1].parent) {same_parents = false}
	}
	for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts are of the same type
		if (selected_nodes[i].type !== selected_nodes[i+1].type) {same_type = false}
	}
	for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts are of the same type2
		if (selected_nodes[i].type2 !== selected_nodes[i+1].type2) {same_type2 = false}
	}
	for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts have the same text
		if (selected_nodes[i].text !== selected_nodes[i+1].text) {same_text = false}
	}
	if (selected_nodes[0].type === "factor" && !same_parents && same_type && same_text) {
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
	  		console.log(new_text);
	  		console.log(selected_terms);
	  		new_math_str = replace_in_mtstr(selected_terms, new_text);
	  		current_index++;
			prepare(new_math_str);
	  	});
	} else if (selected_nodes[0].type2 === "frac" && same_parents && same_type && same_type2) {
		//ANIMATION??
		var nominator_text = "", denominator_text = "";
		for (var i=0; i<selected_nodes.length; i++) {
			nominator_text+=selected_nodes[i].children[0].text;
			denominator_text+=selected_nodes[i].children[1].text;
		}
		var new_text = "\\frac{" + nominator_text + "}{" + denominator_text + "}";
		new_math_str = replace_in_mtstr(selected_nodes, new_text);
		current_index++;
		prepare(new_math_str);

	} else if (selected_nodes[0].type2 === "exp" && same_parents && same_type && same_type2) {
		var same_base = true;
		for (var i=0; i<selected_nodes.length-1; i++) {//making sure all elemnts are of the same parent
			if (selected_nodes[i].base !== selected_nodes[i+1].base) {same_base = false}
		}
		if (!same_base) {return;}
		//ANIMATION??
		var power_text = "", base_text = selected_node[0].children[0].text;
		for (var i=0; i<selected_nodes.length; i++) {
			if (i > 0) {power_text+="+";}
			power_text+=selected_nodes[i].children[1].text;
		}
		var new_text = base_text + "^{" + power_text + "}";
		new_math_str = replace_in_mtstr(selected_nodes, new_text);
		current_index++;
		prepare(new_math_str);
	}
}

//unbracket
document.getElementById("unbracket").onclick = function() {
	unbracket();
	if (recording) {
		manipulation_rec.push({manipulation:9});
	}
};
function unbracket() {
	//animation?
	var new_term="";
	new_term += selected_text.replace(/^\(|\)$/g, "");
	new_math_str = replace_in_mtstr(selected_nodes, new_term);
	current_index++;
	prepare(new_math_str);
}

//evaulate simple sum or multiplication
document.getElementById("eval").onclick = function() {
	eval();
	if (recording) {
		manipulation_rec.push({manipulation:3});
	}
};
function eval() {
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
}

//Append something to both sides
$("#add_both_sides").keyup(function (e) {
    if (e.keyCode == 13) {
    	var thing = $("#add_both_sides").get()[0].value;
        add_both_sides(thing);
		if (recording) {
			manipulation_rec.push({manipulation:7, arg:thing});
		}
    }
});
function add_both_sides(thing) {
	math_HS = new_math_str.split("=");
	new_math_str = math_HS[0] + thing + "=" +math_HS[1] + thing;
	current_index++;
	prepare(new_math_str);
}

//replace something
$("#replace").keyup(function (e) {
    if (e.keyCode == 13) {
    	var thing = $("#replace").get()[0].value;
        replace(thing);
		if (recording) {
			manipulation_rec.push({manipulation:10, arg:thing});
		}
    }
});
function replace(text) {
	$selected.animate({"font-size": 0, opacity: 0}, step_duration/2)
    .css('overflow', 'visible')
    .promise()
    .done(function() {
  		new_math_str = replace_in_mtstr(selected_nodes, text);
  		current_index++;
		prepare(new_math_str);
  	});
}

//remove something. Used for: cancelling something on both sides, or cancelling something on a fraction, among other things
document.getElementById("remove").onclick = function() {
	remove();
	if (recording) {
		manipulation_rec.push({manipulation:11});
	}
};
function remove() {
	$selected.animate({"font-size": 0, opacity: 0}, step_duration)
    .css('overflow', 'visible')
    .promise()
    .done(function() {
  		new_math_str = replace_in_mtstr(selected_nodes, "");
  		current_index++;
		prepare(new_math_str);
  	});
}

//flip equation
document.getElementById("flip_equation").onclick = function() {
	flip_equation();
	if (recording) {
		manipulation_rec.push({manipulation:14});
	}
};
function flip_equation() {
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
}

//HISTORY
//undo
document.getElementById("undo").onclick = undo;
function undo() {
	if (current_index > 0) {
		current_index--;
		prepare(math_str[current_index]);
	}
}

//redo
document.getElementById("redo").onclick = redo;
function redo() {
	if (current_index < math_str.length-1) {
		current_index++;
		prepare(math_str[current_index]);
	}
}