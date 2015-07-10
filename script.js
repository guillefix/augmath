//Need to maybe add more validation of the operations you are doing. In any case, this is such a big project, there'll always be work to do.

var math_str, h_eq_shift=0, v_eq_shift=0, equals_position = {left: 0, top: 0}, manip = "term", multi_select = 0;

//UI stuff
$("#term").on("click", function () {manip = "term";})
$("#factor").on("click", function () {manip = "factor";})
$("#multi_select").on("click", function () {multi_select = document.getElementById("multi_select").checked;})


//A function to render the math and setup the event handlers
function prepare(math) {

math_str = math;
//math = (typeof math !== "undefined") ? math : "2x+1=3";

//initial rendering
math_el = document.getElementById("math");
katex.render(math, math_el, { displayMode: true });

//manipulatives
$manipulatives = $(".base").find(".mord, .mbin, .mrel, .minner, .mopen, .mclose");
$objects = $(".base").find(".mord, .minner, .mopen, .mclose");
$operators = $(".base").find(".mbin");
if ($objects.first().text() === "+" || $objects.first().text() === "−") {$operators = $operators.add($objects.first()); $objects = $objects.not($objects.first());}


$objects.on("click", function() {
	//select a TERM. this works with only simple parenthesis expressions!!
	if (manip === "term") {
		//select whole TERM, both symbols before and after
		$this = $(this);
		if ($this.prevAll(".mopen").length - $this.prevAll(".mclose").length === 0 ) {
			$prev = $this.prevUntil(".mbin, .mrel");
		} else {
			$prev = $this.prevUntil($this.prevAll(".mopen").first().prev());
		}

		if ($prev.length == 0 && $this.prev(".mrel").length == 0) {
			$prev = $prev.add($this.prev());
		} else if ($prev.prev(".mrel").length == 0) {
			$prev = $prev.add($prev.last().prev());
		}

		if ($this.nextAll(".mopen").length - $this.nextAll(".mclose").length === 0) {
			$next = $this.nextUntil(".mbin, .mrel");;
		} else {
			$next = $this.nextUntil($this.nextAll(".mclose").last().next());
		}
		$this = $this.add($prev);
		$this = $this.add($next);
		$this.toggleClass("selected");
		//if (multi_select === 0) {$this.siblings(".selected").not($this).toggleClass("selected");} need to fix multiselect
		$manipulatives.find(".selected").not($this).toggleClass("selected");
		$manipulatives.siblings(".selected").not($this).toggleClass("selected");
	}

	//select a FACTOR
	else if (manip === "factor") {
		$this = $(this);
		if ($this.filter(".mopen, .mclose").length === 0) {
			$this.toggleClass("selected");
			//if (multi_select === 0) {$this.siblings(".selected").not($this).toggleClass("selected");} need to fix multiselect
			$manipulatives.find(".selected").not($this).toggleClass("selected");
			$manipulatives.siblings(".selected").not($this).toggleClass("selected");
		} else {
			do {
				$this = $this.add($this.next()); 
			} while (!($this.filter(".mopen").length-$this.filter(".mclose").length === 0));
			$this.toggleClass("selected");
			$this.siblings(".selected").not($this).toggleClass("selected");
		}
	}
});

//More compatible TERM selector, works by clicking on its operator on the left
$operators.on("click", function() {
	$this = $(this)
	do {
		$this = $this.add($this.last().next()); 
	} while ((($this.filter(".mopen").length !== 0) && !($this.filter(".mopen").length-$this.filter(".mclose").length === 0 && ($this.last().next().filter(".mbin, .mrel").length !== 0 || $this.last().next().length === 0))) || ($this.filter(".mopen").length === 0 && $this.last().next().filter(".mbin, .mrel").length === 0 && $this.last().next().length !== 0));
	$this.toggleClass("selected");
	$this.siblings(".selected").not($this).toggleClass("selected");
});

	new_equals_position = $manipulatives.siblings(".mrel").offset();
	if (equals_position.left !== 0) {h_eq_shift += equals_position.left-new_equals_position.left;}
	if (equals_position.top !== 0) {v_eq_shift += equals_position.top-new_equals_position.top;}
	math_el.setAttribute("style", "left:"+h_eq_shift.toString()+"px;"+"top:"+v_eq_shift.toString()+"px;");
}

function tot_width(obj, bool) {
	var width=0;
	obj.each(function(i) {
		width += $(this).outerWidth(includeMargin=bool);
	})
	return width;
}

//var initial_math_str = "98xyz-78xzzy+88=99-zz";
//var initial_math_str = "(99+33+(a+b)((9+x)))=\\frac{\\sqrt{2}}{x}";
var initial_math_str = "2x+1=3";

$(document).ready(prepare(initial_math_str));

//prepare term for new expression
function prepare_term() {
	term_num = $selected.first().prevAll(".mbin, .mrel").length; //no +1 as the equal sign isn't part of term
	signs = math_str.match(/[+=-]+/g);
	if (($selected.first().prev(".mrel").length === 0 && $selected.prevAll().filter(".mrel").length == 1) || ($selected.first().prev().length !== 0 && $selected.prevAll().filter(".mrel").length === 0)) { term_num+=1; }
	if ($manipulatives.siblings(".mrel").prev().length === 0) {term_num--;}
	terms = math_str.split(/[+=-]+/);
	if (terms[0] === "") { terms.splice(0, 1); signs.splice(0, 1); }
	
	if ($selected.first().filter(".mbin").length !== 0) {
		term_cnt = $selected.filter(".mbin").length;
	} else {
		term_cnt = $selected.filter(".mbin").length+1;
	}
	selected_term = "";
	new_term = ""
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
	sign = $selected.first().text();
	if (sign === "+") {
		new_term = "-" + selected_term;
		selected_term = "+" + selected_term;
	} else if (sign === "−") { //note the character in sign is different from -
		new_term = "+" + selected_term;
		selected_term = "-" + selected_term;
	} else {
		new_term = "-" + selected_term;
	}
}

//change a term of side
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
		$selected.first().prevAll().animate({left:selected_width}, 1000);
		$selected.animate({left:offset}, 1000).promise().done(function() {
			$selected = $(".selected").add($(".selected").find("*"));
			prepare_term();
			math_str = math_str.replace(selected_term, "")+new_term;
			prepare(math_str);
		});

	} else { //after eq sign
		offset = (equals_position.left-selected_position.left)-selected_width;
		$selected.prevAll(".mrel").first().prevAll().animate({left:-selected_width}, 1000);
		$selected.last().nextAll().animate({left:-selected_width}, 1000);
		$selected.animate({left:offset}, 1000).promise().done(function() {
			$selected = $(".selected").add($(".selected").find("*"));
			prepare_term();
			math_str = math_str.replace(selected_term, "");
			math_str = math_str.replace("=", new_term+"=");
			prepare(math_str);
		});
	}
};

function prepare_factor() {
	selected_term = $(".selected").text().replace("−", "-"); //works except with fractions and parenthesis
}

//divide by factor
divide_factor = document.getElementById("divide_factor");
divide_factor.onclick = function() {
	$selected = $(".selected").not(".sqrt span")
	end_of_equation = $manipulatives.last().offset();
	beginning_of_equation = $manipulatives.first().offset();
	$equals = $manipulatives.siblings(".mrel");
	equals_position = $equals.offset();
	RHS_width = tot_width($manipulatives.siblings(".mrel").nextAll(), false);
	h_offset = $equals.offset().left - $selected.offset().left + tot_width($equals, true) + (RHS_width)/2;
	v_offset = $selected.outerHeight(includeMargin=true)/2;
	$equals.nextAll().animate({top:-v_offset, left:tot_width($selected, true)/2}, 1000);
	$selected.animate({left:h_offset, top:v_offset}, 1000).promise().done(function() {
		prepare_factor();
		math_str = math_str.replace(selected_term, "");
		math_HS = math_str.split("=");
		math_str = math_HS[0] + "=" + "\\frac{" + math_HS[1] + "}{" + selected_term + "}";
		prepare(math_str);
	});

}

