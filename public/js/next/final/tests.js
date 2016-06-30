//Oh man tests do really rock

function test_manip(assert, manip, math_str_init, math_str_exp, node_ids) {
  prepare(math_str_init);

  if (node_ids.length > 1) {multi_select=true;}

  for (var i=0; i<node_ids.length; i++) { //selecting nodes in node_ids
    var node = math_root.first(function (node) {
      return node.model.id === node_ids[i];
    });
    select_node(node);
  }
  console.log("node_ids", node_ids);
  step_duration=0; //is doing this ok?
  manip();
  multi_select=false;
  //Reminder of how to asynchronous tests if needed
  // var done = assert.async();
  // setTimeout(function() {
  //   assert.equal(math_str_el.val(), "bx+ax^{2}+c=0");
  //   done();
  // }, 10);
  assert.equal(math_str_el.val(), math_str_exp);
}

$( document ).ready(function() {

  QUnit.test("tree", function( assert ) {
    prepare("ax^{2}+bx+c=0");
    assert.equal(math_root.children.length, 5);
    assert.equal(math_root.children[0].text, "ax^{2}");
    assert.equal(math_root.children[0].type, "term");
      assert.equal(math_root.children[0].children[0].text, "a");
      assert.equal(math_root.children[0].children[0].type, "factor");
      assert.equal(math_root.children[0].children[1].text, "x^{2}");
      assert.equal(math_root.children[0].children[1].type, "factor");
      assert.equal(math_root.children[0].children[1].type2, "exp");
      assert.equal(math_root.children[0].children[1].children[0].text, "x");
      assert.equal(math_root.children[0].children[1].children[0].type, "base");
      assert.equal(math_root.children[0].children[1].children[1].text, "2");
      assert.equal(math_root.children[0].children[1].children[1].type, "power");
    assert.equal(math_root.children[1].text, "+bx");

    prepare("\\frac{ax^{2}+bx+c}{\\frac{a}{b}}");
    assert.equal(math_root.children.length, 1);
    assert.equal(math_root.children[0].children[0].type2, "frac");
    assert.equal(math_root.children[0].children[0].children[0].text, "ax^{2}+bx+c");
    assert.equal(math_root.children[0].children[0].children[0].type, "numerator");
    assert.equal(math_root.children[0].children[0].children[1].text, "\\frac{a}{b}");
    assert.equal(math_root.children[0].children[0].children[1].type, "denominator");
  });

  QUnit.test("manipulations.change_side", function( assert ) {
    //change terms of side
    test_manip(assert, change_side, "ax^{2}+bx+c=0", "bx+c=-ax^{2}",  ["0/1"]);
    //change multiple terms of side
    test_manip(assert, change_side, "ax^{2}+bx+c=0", "c=-ax^{2}-bx",  ["0/1", "0/2"]);
    //change terms of side from RHS
    test_manip(assert, change_side, "ax^{2}+bx+c=\\frac{ex^{2}}{abcd\\sqrt{32}}", "ax^{2}+bx+c-\\frac{ex^{2}}{abcd\\sqrt{32}}=0",  ["0/5"]);

    //change operator (sign) of side
    test_manip(assert, change_side, "-ax^{2}c=bx", "ax^{2}c=-bx",  ["0/1/1"]);
    //DON'T change operator (sign) of side
    test_manip(assert, change_side, "-ax^{2}+bx+c=0", "-ax^{2}+bx+c=0",  ["0/1/1"]);
    //change operator (sign) of side from RHS
    test_manip(assert, change_side, "ax^{2}c=-bx", "-ax^{2}c=bx",  ["0/3/1"]);

    //change factor of side
    test_manip(assert, change_side, "ax^{2}(k+bx+c)=\\sqrt{2}", "a(k+bx+c)=\\frac{\\sqrt{2}}{x^{2}}",  ["0/1/2"]);
    //change factor (when in numerator) of side
    test_manip(assert, change_side, "\\frac{ax^{2}}{(k+bx+c)}=\\sqrt{2}", "\\frac{a}{(k+bx+c)}=\\frac{\\sqrt{2}}{x^{2}}",  ["0/1/1/1/1/2"]);
    //change numerator of side
    test_manip(assert, change_side, "\\frac{ax^{2}+33e}{(k+bx+c)}=\\sqrt{2}", "\\frac{1}{(k+bx+c)}=\\frac{\\sqrt{2}}{ax^{2}+33e}",  ["0/1/1/1"]);
    //change single-term numerator of side when selecting that term
    test_manip(assert, change_side, "\\frac{33e}{(k+bx+c)}=\\sqrt{2}", "\\frac{1}{(k+bx+c)}=\\frac{\\sqrt{2}}{33e}",  ["0/1/1/1/1"]);
    //change factor of side from RHS
    test_manip(assert, change_side, "ax^{2}(k+bx+c)=\\sqrt{2}", "\\frac{ax^{2}(k+bx+c)}{\\sqrt{2}}=1",  ["0/3/1"]);

    //change denominator of side
    test_manip(assert, change_side, "\\frac{ax^{2}+33e}{(k+bx+c)}=\\sqrt{2}", "ax^{2}+33e=(k+bx+c)\\sqrt{2}",  ["0/1/1/2"]);
    //change denominator of side from RHS
    test_manip(assert, change_side, "\\sqrt{2}=\\frac{ax^{2}+33e}{(k+bx+c)}", "\\sqrt{2}(k+bx+c)=ax^{2}+33e",  ["0/3/1/2"]);
    //change factor (in denominator) of side
    test_manip(assert, change_side, "\\frac{2^{2}\\pi ^{2}}{T^{2}}=\\frac{GM}{r^{3}}", "2^{2}\\pi ^{2}=\\frac{GMT^{2}}{r^{3}}",  ["0/1/1/2/1/1"]);

    //change power of side
    test_manip(assert, change_side, "(ax^{2}(k+bx+c))^{33}=\\sqrt{2}", "(ax^{2}(k+bx+c))=(\\sqrt{2})^{\\frac{1}{33}}",  ["0/1/1/2"]);
    //change power of side to a side with multiple terms
    test_manip(assert, change_side, "(ax^{2}(k+bx+c))^{33}=\\sqrt{2}+abcd", "(ax^{2}(k+bx+c))=(\\sqrt{2}+abcd)^{\\frac{1}{33}}",  ["0/1/1/2"]);
    //change fractional power of side from RHS
    test_manip(assert, change_side, "(ax^{2}(k+bx+c))=(\\sqrt{2})^{\\frac{1}{33}}", "(ax^{2}(k+bx+c))^{33}=(\\sqrt{2})",  ["0/3/1/2"]);

    //TODO: FOR power. NEED TO ADD option for selecting factor or term within power, just like for fractions..

  });

  QUnit.test("manipulations.move_right", function( assert ) {
    //Move term right
    test_manip(assert, move_right, "ax^{2}+bx+c=0", "bx+ax^{2}+c=0",  ["0/1"]);
    //Move normal factor right
    test_manip(assert, move_right, "ax^{2}+bx+c=0", "x^{2}a+bx+c=0",  ["0/1/1"]);
    //Move numerical factor right
    test_manip(assert, move_right, "33 \\cdot 44z = 1", "44\\cdot 33z=1",  ["0/1/1"]);
    //Move numerical factor in fraction right
    test_manip(assert, move_right, "\\frac{33\\cdot 44}{z}=1",  "\\frac{44\\cdot 33}{z}=1", ["0/1/1/1/1/1"]);
  });

  QUnit.test("manipulations.move_left", function( assert ) {
    //Move term left
    test_manip(assert, move_left, "bx+ax^{2}+c=0", "ax^{2}+bx+c=0",  ["0/2"]);
    //Move normal factor left
    test_manip(assert, move_left, "ax^{2}+bx+c=0", "x^{2}a+bx+c=0",  ["0/1/2"]);
    //Move numerical factor left
    test_manip(assert, move_left, "44\\cdot 33z=1", "33\\cdot 44z=1",  ["0/1/3"]);
    //Move numerical factor in fraction left
    test_manip(assert, move_left, "\\frac{44\\cdot 33}{z}=1", "\\frac{33\\cdot 44}{z}=1",  ["0/1/1/1/1/3"]);
  });

  //move up in fraction
  QUnit.test("manipulations.move_up", function( assert ) {
    //Move factors in single term in denominator up
    test_manip(assert, move_up, "\\frac{ex^{2}}{abcd\\sqrt{33}}+bx+c=1+1-bx", "\\frac{c^{-1}ex^{2}}{abd\\sqrt{33}}+bx+c=1+1-bx",  ["0/1/1/2/1/3"]);
    //Move all factors in single term in denominator up
    test_manip(assert, move_up, "1=\\frac{x}{\\frac{2}{3}\\frac{5}{4}}", "1=(\\frac{2}{3})^{-1}(\\frac{5}{4})^{-1}x",  ["0/3/1/2/1/1","0/3/1/2/1/2"]);
    //Move single term in denominator
    test_manip(assert, move_up, "\\frac{xa}{aax(lel)^{2}}=\\tau", "a^{-1}a^{-1}x^{-1}(lel)^{-2}xa=\\tau ", ["0/1/1/2/1"])
  });

  //move down in fraction
  QUnit.test("manipulations.move_down", function( assert ) {
    //Move factor down
    test_manip(assert, move_down, "\\frac{ex^{2}}{abcd\\sqrt{32}}+bx+c=1+1-bx", "\\frac{ex^{2}}{abcd\\sqrt{32}}+\\frac{x}{b^{-1}}+c=1+1-bx",  ["0/2/2"]);
  });

  QUnit.test("manipulations.merge", function( assert ) {
    //BASIC FACTOR OUT
    test_manip(assert, merge, "ax+ay", "a(x+y)",  ["0/1/1", "0/2/2"]);

    //FACTOR OUT with one one-factor term
    test_manip(assert, merge, "p+\\frac{ac}{a+c}p=1", "p(1+\\frac{ac}{a+c})=1",  ["0/1/1", "0/2/3"]);

    //FACTOR OUT with one one-factor term AGAIN
    test_manip(assert, merge, "-\\omega^{2} B e^{i\\phi} + i \\beta \\omega B e^{i\\phi} + B e^{i\\phi} = \\Gamma", "Be^{i\\phi }(-\\omega ^{2}+i\\beta \\omega +1)=\\Gamma ",  ["0/1/3", "0/1/4", "0/2/5", "0/2/6", "0/3/2", "0/3/3"]);

    //FACTOR OUT with containing terms not being directly their parents. TODO: NEED TO CODE THIS IN
    // test_manip(assert, merge, "\\frac{c(a+k-1)}{a+c}p-\\frac{c(a+k)}{a+c}p", "c(\\frac{(a+k-1)}{a+c}p-\\frac{(a+k)}{a+c}p)",  ["0/1/1/1/1/1", "0/2/2/1/1/1"]);

    //FACTOR OUT more than one factor per term.
    test_manip(assert, merge, "abx+ayb", "ab(x+y)",  ["0/1/1", "0/1/2", "0/2/2", "0/2/4"]);

    //Merge equal factors into exp 1
    test_manip(assert, merge, "abxx+ayb", "abx^{2}+ayb",  ["0/1/3", "0/1/4"]);

    //Merge equal factors into exp 2
    // test_manip(assert, merge, "abxbx+ayb", "ab^{2}  x^{2}+ayb",  ["0/1/2", "0/1/3", "0/1/4", "0/1/5"]); //USE EVALUATE FOR THIS

    //Merge equal terms into term
    test_manip(assert, merge, "ac+abb+abb+ac", "ac+2abb+ac",  ["0/2", "0/3"]);

    //Merge fraction terms into fraction
    test_manip(assert, merge, "ac+\\frac{a}{b}+\\frac{cd}{b}", "ac+\\frac{a+cd}{b}",  ["0/2", "0/3"]);

    //Merge terms into fraction (using Algebrite)
    test_manip(assert, merge, "ac+\\frac{a}{b}+\\frac{cd}{eb}", "ac+\\frac{aeb+cdb}{beb}",  ["0/2", "0/3"]);

    //Merge factors into fraction
    test_manip(assert, merge, "ac\\frac{a}{b}\\frac{cd\\sqrt{k}}{xx}", "ac\\frac{acd\\sqrt{k}}{bxx}",  ["0/1/3", "0/1/4"]);

    //Merge exponentials with same base
    test_manip(assert, merge, "acu^{\\frac{2}{3}}u^{3}", "acu^{\\frac{2}{3}+3}",  ["0/1/3", "0/1/4"]);

    //Merge exponentials with same power
    test_manip(assert, merge, "acu^{\\frac{2}{3}}(u+v)^{\\frac{2}{3}}", "ac(u(u+v))^{\\frac{2}{3}}",  ["0/1/3", "0/1/4"]);

    //Merge sqrts into sqrt
    test_manip(assert, merge, "ac\\sqrt{uu+v}\\sqrt{x}", "ac\\sqrt{(uu+v)x}",  ["0/1/3", "0/1/4"]);

  });

  QUnit.test("manipulations.split", function( assert ) {
    //BASIC DISTRIBUTE IN
    test_manip(assert, split, "a(x+y)", "ax+ay",  ["0/1/1", "0/1/2"]);

    //DISTRIBUTE IN with one one-factor term
    test_manip(assert, split, "p(1+\\frac{ac}{a+c})=1", "p+p\\frac{ac}{a+c}=1", ["0/1/1", "0/1/2"]);

    //DISTRIBUTE IN more than one factor per term.
    test_manip(assert, split, "ab(x+y)", "abx+aby", ["0/1/1", "0/1/2", "0/1/3"]);

    //DISTRIBUTE power in
    test_manip(assert, split, "(ab(x+y))^{33x}", "a^{33x}b^{33x}(x+y)^{33x}", ["0/1/1"]);

    //Split exponential with terms into several exponentials
    test_manip(assert, split, "(ab(x+y))^{33x+y}", "(ab(x+y))^{33x}(ab(x+y))^{+y}", ["0/1/1/2"]);

    //distribute power in fraction
    test_manip(assert, split, "1=(\\frac{2}{3})^{-1}(\\frac{5}{4})^{-1}x", "1=\\frac{2^{-1}}{3^{-1}}(\\frac{5}{4})^{-1}x", ["0/3/1"]);

  });

  QUnit.test("manipulations.eval", function( assert ) {
    //merge two exponentials
    test_manip(assert, eval, "a^{-1}a^{-1}", "a^{-2}",  ["0/1/1", "0/1/2"]);
  });

});
