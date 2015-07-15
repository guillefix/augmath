//Need to maybe add more validation of the operations you are doing. In any case, this is such a big project, there'll always be work to do.

var math_str, 
	h_eq_shift=0, 
	v_eq_shift=0, 
	equals_position = {left: 0, top: 0}, 
	manip = "term", 
	multi_select = false, 
	step_duration = 700, 
	inner_select = false;

//UI stuff
$("#term").on("click", function () {manip = "term";});
$("#factor").on("click", function () {manip = "factor";});
$("#multi_select").on("click", function () {multi_select = document.getElementById("multi_select").checked;});
$("#inner_select").on("click", function () {inner_select = document.getElementById("inner_select").checked; prepare(math_str);});


//MANIPULATIVES & RENDERING//

//A function to render the math and setup the event handlers
function prepare(math) {

math_str = math;
//math = (typeof math !== "undefined") ? math : "2x+1=3";

//initial rendering
math_el = document.getElementById("math");
katex.render(math, math_el, { displayMode: true });

//manipulatives
$manipulatives = $(".base").find(".mord, .mbin, .mrel, .minner, .mopen, .mclose");
$objects = $(".base").find(".mord:not(:has(*)), .minner, .mopen, .mclose");
$operators = $(".base").find(".mbin"); //some operators are of .mord type
if ($objects.first().text() === "+" || $objects.first().text() === "−") {$operators = $operators.add($objects.first()); $objects = $objects.not($objects.first());}

function add_events() { //if using $objects. it does term selection within fraction. hmm..
	$this = $(this);
	//select a TERM. this works with only simple parenthesis expressions!! although im improving it, im still not sure it works in all generality
	if (manip === "term") {
		//select whole TERM, both symbols before and after
			$prev = $this.prevUntil(".mbin, .mrel, .mopen");
			topkek = 0; //to prevent overflow
			while ($prev.first().prevAll(".mopen").length - $prev.first().prevAll(".mclose").length !== 0 && topkek<$manipulatives.length) {
				$prev = $prev.add($prev.first().prev());
				$prev = $prev.add($prev.first().prevUntil(".mbin, .mrel"));
				topkek++;
			}

		if ($prev.length == 0 && $this.prev(".mrel").length == 0) {
			$prev = $prev.add($this.prev());
		} else if ($prev.prev(".mrel").length == 0) {
			$prev = $prev.add($prev.first().prev());
		}

			$next = $this.nextUntil(".mbin, .mrel, .mclose");
			topkek = 0; //to prevent overflow
			while ($next.last().nextAll(".mopen").length - $next.last().nextAll(".mclose").length !== 0 && topkek<$manipulatives.length) {
				$next = $next.add($next.last().next());
				$next = $next.add($next.last().nextUntil(".mbin, .mrel"));
				topkek++;
			}
		$this = $this.add($prev);
		$this = $this.add($next);
		
	}

	//select a FACTOR
	else if (manip === "factor" && $this.filter(".minner").length === 0) {
		if (!$this.filter(".mopen, .mclose").length === 0) {
			do {
				$this = $this.add($this.next()); 
			} while (!($this.filter(".mopen").length-$this.filter(".mclose").length === 0));
		}
	}
	//console.log($this);
	//console.log($selected);
	if (!(manip === "factor" && $this.filter(".minner").length !== 0)) {
		$this.toggleClass("selected");
	}
	if (!multi_select && !(manip === "factor" && $this.filter(".minner").length !== 0))	{
			$manipulatives.find(".selected").not($this).toggleClass("selected");
			$manipulatives.filter(".selected").not($this).toggleClass("selected");
	}

}
if (!inner_select) {
	$(".base").on("click", ".mord:not(:has(*)), .minner, .mopen, .mclose", add_events);
} else {
	$(".base").on("click", ".mord:not(:has(*)), .mopen, .mclose", add_events);
}

//More compatible TERM selector, works by clicking on its operator on the left
$operators.on("click", function() {
	$this = $(this);
	do {
		$this = $this.add($this.last().next()); 
	} while ((($this.filter(".mopen").length !== 0) 
			&& !($this.filter(".mopen").length-$this.filter(".mclose").length === 0 
				&& ($this.last().next().filter(".mbin, .mrel").length !== 0 || $this.last().next().length === 0))) 
		|| ($this.filter(".mopen").length === 0 
			&& $this.last().next().filter(".mbin, .mrel").length === 0 
			&& $this.last().next().length !== 0));
	$this.toggleClass("selected");
	$this.siblings(".selected").not($this).toggleClass("selected");
});

	//repositioning equals so that it's always in the same place
	new_equals_position = $manipulatives.siblings(".mrel").offset();
	if (equals_position.left !== 0) {h_eq_shift += equals_position.left-new_equals_position.left;}
	if (equals_position.top !== 0) {v_eq_shift += equals_position.top-new_equals_position.top;}
	math_el.setAttribute("style", "left:"+h_eq_shift.toString()+"px;"+"top:"+v_eq_shift.toString()+"px;");
}

function tot_width(obj, bool, include_op) {
	var width=0;
	obj.each(function(i) {
		width += $(this).outerWidth(includeMargin=bool);
	})
	if (include_op === true) {
		if (obj.first().filter(".mbin").length === 0) {width += $operators.first().outerWidth(includeMargin=bool);}
	}
	return width;
}

//var initial_math_str = "98xyz-78xzzy+88=99-zz";
//var initial_math_str = "(99+33+(a+b)((9+x)))=\\frac{\\sqrt{2}}{x}";
var initial_math_str = "2x+1=3";

$(document).ready(prepare(initial_math_str));

//MANIPULATIONS//

//prepare term for new expression by finding it in the math_str
function prepare_term($term) {
	var selected_term;
	term_num = $term.first().prevAll(".mbin, .mrel").length; //no +1 as the equal sign isn't part of term
	signs = math_str.match(/[+=-]+/g);
	if (($term.first().prev(".mrel").length === 0 && $term.prevAll().filter(".mrel").length == 1) || ($term.first().prev().length !== 0 && $selected.prevAll().filter(".mrel").length === 0)) { term_num+=1; }
	if ($manipulatives.siblings(".mrel").prev().length === 0) {term_num--;}
	terms = math_str.split(/[+=-]+/);
	if (terms[0] === "") { terms.splice(0, 1); signs.splice(0, 1); }
	
	if ($term.first().filter(".mbin").length !== 0) {
		term_cnt = $term.filter(".mbin").length;
	} else {
		term_cnt = $term.filter(".mbin").length+1;
	}
	new_term = "";
	selected_term = "";
	i = term_num;
	do {
		if (i !== term_num) {
			sign_i = signs[i-1];
		} else {
			sign_i = "";
		}
		
		selected_term += sign_i + terms[i];
		i++;
	}
	while (i<term_num+term_cnt);
	sign = $term.first().text();
	if (sign === "+") {
		new_term = "-" + selected_term;
		selected_term = "+" + selected_term;
	} else if (sign === "−") { //note the character in sign is different from -
		new_term = "+" + selected_term;
		selected_term = "-" + selected_term;
	} else {
		new_term = "-" + selected_term;
	}

	return selected_term;
	
}

//change a term of side. things to fix about this when multi_select is on. also fix animation when on RHS the term doesnt have a sign
change_side = document.getElementById("change_side");
change_side.onclick = function() {
	$selected = $(".selected").not(".sqrt span, .minner span");
	width_last_term = $selected.last().next().outerWidth(includeMargin=true);
	selected_width = tot_width($selected, true);
	end_of_equation = $manipulatives.last().offset();
	beginning_of_equation = $manipulatives.first().offset();
	equals_position = $manipulatives.siblings(".mrel").offset();
	selected_position = $selected.offset();
	//different behaviour depending on which side of the eq., determined by existence of equal sign before or after
	if ($selected.prevAll(".mrel").length === 0) { //before eq sign
		offset = (end_of_equation.left-selected_position.left)+width_last_term;
		$selected.first().prevAll().animate({left:selected_width}, step_duration);
		$selected.animate({left:offset}, step_duration).promise().done(function() {
			$selected = $(".selected").add($(".selected").find("*"));
			selected_term = prepare_term($selected);
			math_str = math_str.replace(selected_term, "")+new_term;
			prepare(math_str);
		});

	} else { //after eq sign
		offset = (equals_position.left-selected_position.left)-selected_width;
		$selected.prevAll(".mrel").first().prevAll().animate({left:-tot_width($selected, true, false)}, step_duration);
		$selected.last().nextAll().animate({left:-selected_width}, step_duration);
		$selected.animate({left:offset}, step_duration).promise().done(function() {
			$selected = $(".selected").add($(".selected").find("*"));
			selected_term = prepare_term($selected);
			math_str = math_str.replace(selected_term, "");
			math_str = math_str.replace("=", new_term+"=");
			prepare(math_str);
		});
	}
};

//prepare factor
function prepare_factor() {
	selected_term = $(".selected").text().replace("−", "-");
	if ($(".selected").text().indexOf("√") > -1) {
		selected_term = selected_term.replace("√", "\\sqrt{") + "}";
	}
	selected_term = selected_term.replace(/[^\x00-\x7F]/g, ""); //removing non-ASCII characters that crop up from the text() method
}

//divide by factor
divide_factor = document.getElementById("divide_factor");
divide_factor.onclick = function() {
	$selected = $(".selected").not(".sqrt span");
	end_of_equation = $manipulatives.last().offset();
	beginning_of_equation = $manipulatives.first().offset();
	$equals = $manipulatives.siblings(".mrel");
	equals_position = $equals.offset();
	RHS_width = tot_width($manipulatives.siblings(".mrel").nextAll(), false, false);
	h_offset = $equals.offset().left - $selected.offset().left + tot_width($equals, true, false) + (RHS_width)/2;
	v_offset = $selected.outerHeight(includeMargin=true)/2;
	$equals.nextAll().animate({top:-v_offset, left:tot_width($selected, true, false)/2}, step_duration);
	$selected.animate({left:h_offset, top:v_offset}, step_duration).promise().done(function() {
		prepare_factor();
		math_str = math_str.replace(selected_term, "");
		math_HS = math_str.split("=");
		math_str = math_HS[0] + "=" + "\\frac{" + math_HS[1] + "}{" + selected_term + "}";
		prepare(math_str);
	});

}

//prepare expression
function prepare_expression() {
	selected_term = $(".selected").text().replace("−", "-");
	selected_term_str = selected_term;
	if ($(".selected").text().indexOf("√") > -1) {
		selected_term = selected_term.replace("√", "") + "^0.5";
		selected_term_str = selected_term;
	} else if ($(".selected").filter(".minner").length !== 0) {
		numerator = $(".selected").find(".mord").last().text();
		denominator = $(".selected").find(".mord").first().text();
		selected_term_str = numerator + "/" + denominator;
		selected_term = "\\frac{" + numerator + "}{" + denominator + "}";
	}
	selected_term = selected_term.replace(/[^\x00-\x7F]/g, ""); //removing non-ASCII characters that crop up from the text() method
	if (selected_term_str.search(/[a-z]/) > -1) { //doesn't work with some expressions, as usual
		selected_term_str = selected_term_str.split("").join("*");
		selected_term_str = selected_term_str.replace("*+*", "+");
		selected_term_str = selected_term_str.replace("*-*", "-");
		selected_term_str = selected_term_str.replace("*=*", "=");
		new_term = CQ(selected_term_str).simplify().toLaTeX().replace("\\cdot", ""); //removing cdot format
	} else {
		new_term = math.eval(selected_term_str).toString();
	}
}

//evaulate simple sum or multiplication
eval = document.getElementById("eval");
eval.onclick = function() {
	equals_position = $manipulatives.siblings(".mrel").offset(); //necessary for keeping equals in the same position when prepare is called
	$selected = $(".selected")//.not(".sqrt span, .minner span");
	$selected.animate({"font-size": 0, opacity: 0}, step_duration).css('overflow', 'visible').promise().done(function() {
		prepare_expression();
		math_str = math_str.replace(selected_term, new_term);
		prepare(math_str);
	});
}

//move term within expression
function get_contig_term($term, dir) {
	if (dir) { //next term
		$term = $term.last().next();
		do {
			$term = $term.add($term.last().next()); 
		} while ((($term.filter(".mopen").length !== 0) 
				&& !($term.filter(".mopen").length-$term.filter(".mclose").length === 0 
					&& ($term.last().next().filter(".mbin, .mrel").length !== 0 || $term.last().next().length === 0))) 
			|| ($term.filter(".mopen").length === 0 
				&& $term.last().next().filter(".mbin, .mrel").length === 0 
				&& $term.last().next().length !== 0));
	} else { //prev
		$term = $term.first();
		do {
			$term = $term.add($term.first().prev()); 
		} while ((($term.filter(".mopen").length !== 0) 
				&& !($term.filter(".mopen").length-$term.filter(".mclose").length === 0 
					&& ($term.first().prev().filter(".mbin, .mrel").length !== 0 || $term.first().prev().length === 0))) 
			|| ($term.filter(".mopen").length === 0 
				&& $term.first().prev().filter(".mbin, .mrel").length === 0 
				&& $term.first().prev().length !== 0));
		$term = $term.not($term.last());
	}
	return $term;
}

function has_op(obj) {
	if (obj.first().text() === "+" || obj.first().text() === "−") {
		return true;
	} else {
		return false;
	}
}

move_right = document.getElementById("move_right");
move_right.onclick = function(){
	$selected = $(".selected");
	$selected_next = get_contig_term($selected, true);
	selected_width = tot_width($selected, true, true);
	selected_next_width = tot_width($selected_next, true, true);
	equals_position = $manipulatives.siblings(".mrel").offset(); //necessary for keeping equals in the same position when prepare is called
	$selected_next.animate({left:-selected_width}, step_duration);
	$selected.animate({left:selected_next_width}, step_duration).promise().done(function() {
		selected_term = prepare_term($selected);
		if (!has_op($selected)) {selected_term_str = "+" + selected_term;} else {selected_term_str = selected_term;}
		next_term = prepare_term($selected_next);
		if (!has_op($selected_next)) {next_term_str = "+" + next_term;} else {next_term_str = next_term;}
		math_str = math_str.replace(next_term, selected_term_str);
		math_str = math_str.replace(selected_term, next_term_str);
		prepare(math_str);
	});
}
move_left = document.getElementById("move_left");
move_left.onclick = function() {
	$selected = $(".selected");
	$selected_prev = get_contig_term($selected, false);
	selected_width = tot_width($selected, true, true);
	selected_prev_width = tot_width($selected_prev, true, true);
	equals_position = $manipulatives.siblings(".mrel").offset(); //necessary for keeping equals in the same position when prepare is called
	$selected_prev.animate({left:selected_width}, step_duration);
	$selected.animate({left:-selected_prev_width}, step_duration).promise().done(function() {
		selected_term = prepare_term($selected);
		if (!has_op($selected)) {selected_term_str = "+" + selected_term;} else {selected_term_str = selected_term;}
		prev_term = prepare_term($selected_prev);
		if (!has_op($selected_prev)) {prev_term_str = "+" + prev_term;} else {prev_term_str = prev_term;}
		math_str = math_str.replace(selected_term, prev_term_str);
		math_str = math_str.replace(prev_term, selected_term_str);
		prepare(math_str);
	});
}

//change power of side. working on it
root_power = document.getElementById("root_power");
root_power.onclick = function() {
	$selected = $(".selected");
	equals_position = $manipulatives.siblings(".mrel").offset(); //necessary for keeping equals in the same position when prepare is called
	//$selected.animate({left:
		prepare_expression();
		if (!has_op(selected_term)) {selected_term_str = "+" + selected_term;} else {selected_term_str = selected_term;}
		math_str = math_str.replace();
}