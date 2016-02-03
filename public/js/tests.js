//Oh man tests do really rock
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

  QUnit.test("manipulations.move_right", function( assert ) {
    prepare("ax^{2}+bx+c=0");
    node=math_root.children[0];
    select_node(node);
    step_duration=0; //is doing this ok?
    move_right();
    // var done = assert.async();
    // setTimeout(function() {
    //   assert.equal(math_str_el.val(), "bx+ax^{2}+c=0");
    //   done();
    // }, 10);
    assert.equal(math_str_el.val(), "bx+ax^{2}+c=0");
  });

  QUnit.test("manipulations.move_down", function( assert ) {
    prepare("\\frac{ex^{2}}{abcd\\sqrt{32}}+bx+c=1+1-bx");
    node=math_root.children[1].children[1];
    select_node(node);
    step_duration=0;
    move_down();
    assert.equal(math_str_el.val(), "\\frac{ex^{2}}{abcd\\sqrt{32}}+\\frac{x}{b^{-1}}+c=1+1-bx");
  });

  QUnit.test("manipulations.move_up", function( assert ) {
    prepare("\\frac{ex^{2}}{abcd\\sqrt{33}}+bx+c=1+1-bx");
    node=math_root.children[0].children[0].children[1].children[0].children[2];
    select_node(node);
    step_duration=0;
    move_up();
    assert.equal(math_str_el.val(), "\\frac{c^{-1}ex^{2}}{abd\\sqrt{33}}+bx+c=1+1-bx");
  });

  QUnit.test("manipulations.merge", function( assert ) {
    //BASIC FACTOR OUT
    prepare("ax+ay");
    multi_select=true;
    node=math_root.children[0].children[0];
    select_node(node);
    node=math_root.children[1].children[1];
    select_node(node);
    console.log(selected_nodes);
    step_duration=0;
    merge();
    multi_select=false;
    assert.equal(math_str_el.val(), "a(x+y)");

    //FACTOR OUT with containing terms not being directly their parents. NEED TO CODE THIS IN

    // prepare("\\frac{c(a+k-1)}{a+c}p-\\frac{c(a+k)}{a+c}p");
    // multi_select=true;
    // node=math_root.children[0].children[0].children[0].children[0].children[0];
    // select_node(node);
    // node=math_root.children[1].children[1].children[0].children[0].children[0];
    // select_node(node);
    // console.log(selected_nodes);
    // step_duration=0;
    // merge();
    // multi_select=false;
    // assert.equal(math_str_el.val(), "c(\\frac{(a+k-1)}{a+c}p-\\frac{(a+k)}{a+c}p)");

    //FACTOR OUT with more than one factor per term.
  });

});
