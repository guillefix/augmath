//step counter
var i=0;
//initial expression
var math = "2x+1=3";
renderMath(math);
//initial rendering
function renderMath(math) {katex.render(math, mykatex1)};

document.onclick = function() {
	//manipulatives
	variables = document.querySelectorAll(".base .mord");
	//select clicked manipulative (and only allow to select only one)
	for (key in variables) {
		variable = variables[key];
		if (variables.propertyIsEnumerable(key) && key!="length") {
			if (variable.className.includes("selected")) {
				selected_variable = variable;
			};
			variable.onclick = function() {
				this.className+=" selected";
				if (selected_variable != undefined) {
					selected_variable.className = selected_variable.className.replace(/ selected/g, "");
				};
			};
		};
	};

	switch(i) {
		case 0:
			TweenMax.to(".base .mbin:nth-child(3), .base .mord:nth-child(4)", 1, {left:35});
			TweenMax.to(".base .mrel:nth-child(5), .base .mord:nth-child(6)", 1, {left:-32});
			math = "2x=3-1";
			window.setTimeout(function() {renderMath(math);}, 1000);
			i++;
			break;
		case 1:
			TweenMax.to(".base .mbin:nth-child(5), .base .mord:nth-child(4), .base .mord:nth-child(6)", 1, {opacity:0});
			math = "2x=2";
			window.setTimeout(function() {renderMath(math);}, 1000);
			i++;
			break;
		case 2:
			TweenMax.to(".base .mord:nth-child(1)", 1, {left:45, top:15});
			math = "x=\\frac{2}{2}";
			window.setTimeout(function() {renderMath(math);}, 1000);
			i++;
			break;
		case 3:
			TweenMax.to(".base .minner:nth-child(3)", 1, {opacity:0});
			math = "x=1";
			window.setTimeout(function() {renderMath(math);}, 1000);
			i++;
			break;
	}
}