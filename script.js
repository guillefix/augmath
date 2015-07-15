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
	math_root;

//UI stuff
var manip_el = $("#manip"), depth_el = $("#depth");
manip_el.on("change", function () {remove_events(manip, depth); manip = this.value; create_events(manip, depth);});
depth_el.on("change", function () {remove_events(manip, depth); depth = parseInt(this.value, 10); create_events(manip, depth);});
$("#multi_select").on("click", function () {multi_select = document.getElementById("multi_select").checked;});
$("#inner_select").on("click", function () {inner_select = document.getElementById("inner_select").checked; prepare(math_str);});

function prepare(math) {

	math_str = math;

	var math_el = document.getElementById("math");
	katex.render(math, math_el, { displayMode: true });

	var root_poly = $(".base");

	var tree = new TreeModel();

	//MAKE WORK WITH FRACTIONS, PARENS, EXPONENTS
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
				factor.type = "group";
				term.addChild(factor);
				term_obj = term_obj.add(factor_obj);
				factor_cnt++;
				i += factor_obj.length;
				inside = factor_obj.not(factor_obj.first()).not(factor_obj.last());
				if (!factor_obj.last().is(".mclose, :has(.vlist)")) {
					inside_text = parse_poly(factor, inside, factor_id, false);
					factor.text = "(" + inside_text + ")";
					term.text+=factor.text;
				}
			}
			//if not grouped, deal with individual element
			if (!thing.is(".mbin, .mopen, .mclose, .mrel")) {
				factor = tree.parse({id: factor_id, obj: factor_obj});
				if (!thing.is(":has(*)")) {
					factor.type = "normal";
					factor.text = thing.text();
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

			if (i === things.length) {term.model.obj = term_obj; poly_str+=term.text;}
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
					factor.text = "\\frac{" + parse_poly(factor, inside, factor_id, false) + "}";
					term.text+=factor.text;
				} else if (thing.is(":has(.vlist)")) {//exponentials
					base_obj = thing.find(".mord").first();
					power_obj = thing.find(".vlist").first();
					base = tree.parse({id: factor_id + "/" + "1", obj: base_obj});
					base.type = "base";
					base.text = base_obj.text();
					power = tree.parse({id: factor_id + "/" + "2", obj: power_obj});
					power.type = "power";
					power.text = parse_poly(power, inside, factor_id + "/" + "2", true);
					factor.addChild(base);
					factor.addChild(power);
					factor.type2 = "exp";
					inside = power_obj.find(".mord").first();
					factor.text = base.text + "^{" + power.text + "}";//needs the standard power format in latex
					term.text+=factor.text;
				} else if (factor_obj.last().is(".mclose, :has(.vlist)")) {//exponentiated group
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
		};
		return poly_str;
	}
	parse_poly(math_root, root_poly, 0, true);

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
	var $selectable = $();
	math_root.walk(function (node) {
		if (node.model.id !== "0" && node.type === type && getIndicesOf("/", node.model.id).length === depth) {
			$selectable = $selectable.add(node.model.obj);
	    }
	});
	console.log($selectable);
	math_root.walk(function (node) {
		if (node.model.id !== "0" && node.type === type && getIndicesOf("/", node.model.id).length === depth) {
	    	node.model.obj.on("click", function() {
	    		$this = node.model.obj;
	    		$this.toggleClass("selected");
	    		$selectable.filter(".selected").not($this).toggleClass("selected");
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

//function to delete a certain thing from math_str. it deals with same math latex being in different places in equation
function delete_from_mtstr(id) {
	var chosen_node = math_root.first(function (node) {
    	return node.model.id === id;
	});

	var indices = getIndicesOf(chosen_node.text, math_str);

	var coinciding_nodes = math_root.all(function (node) {
    	return node.text === chosen_node.text;
	});

	for (var index = 0; index < coinciding_nodes.length; index++) {
		if (coinciding_nodes[index].model.id === chosen_node.model.id) break;
	};

	var chosen_index = indices[index];

	return math_str.slice(0, chosen_index) + math_str.slice(chosen_index+chosen_node.text.length, math_str.length);

}

var initial_math_str = "2x+1=3";

$(document).ready(function() {
	prepare(initial_math_str);
	create_events(manip, depth);
});