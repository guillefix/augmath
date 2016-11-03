// import {change_side, move_right, move_left, move_up, move_down, split, merge, distribute_in, collect_out, unbracket, evaluate, operate, add_both_sides, replace, remove, cancel_out, flip_equation} from "../../../imports/maths/manipulations.js";
// import {select_node, clear_math, math_str_to_tree, replace_in_mtstr, tot_width} from "../../maths/functions";
// import Bro from 'brototype'
// import {symbols} from '../../maths/symbols.js';
import store from './store';
import * as act from '../actions/action-creators';
// import * as manips from '../../maths/manipulations.js';


const dispatch = store.dispatch;

//Oh man tests do really rock. But need to update framework to work with react!
dispatch(act.changeStepDuration(0)) //is doing this ok?

function test_manip(assert, manip, math_str_init, math_str_exp, node_ids) {
  console.log("BEGIN TEST");
  // confirm("kek")
  // let done = assert.async();
  // step_duration=0;

  const state = store.getState();
  dispatch(act.addToHist(math_str_init, state.current_index))

  // let var_select=false;
  // let multi_select=false;
  //
  if (node_ids.length > 1) { dispatch(act.updateSelect({multi_select: true})) }
  //
  for (var i=0; i<node_ids.length; i++) { //selecting nodes in node_ids
    dispatch(act.selectNode(node_ids[i]));
  }
  // // console.log("node_ids", node_ids);
  // // console.log("manip", manip);
  // let promise, eqCoords = {};
  //
  // let vars = {};
  //
  // eqCoords.beginning_of_equation = math_root.children[0].model.obj.offset();
  // eqCoords.width_last_term = tot_width(math_root.children[math_root.children.length-1].model.obj, true, true);
  // eqCoords.end_of_equation = math_root.children[math_root.children.length-1].model.obj.offset();
  // eqCoords.end_of_equation.left += eqCoords.width_last_term;
  // eqCoords.equals_position = $equals.offset();
  //
  // vars.eqCoords = eqCoords;
  //
  // promise = manips[manip].call(vars);
  // // console.log("promise", promise);
  // if (typeof promise !== "undefined") {
  //   promise.then((data) => {
  //     data = clear_math(data);
  //     // console.log("data coming", data);
  //     assert.equal(data, math_str_exp);
  //     done();
  //   })
  // } else {
  //   assert.equal(math_str_init, math_str_exp);
  //   done();
  // }

  // multi_select=false;
  // Reminder of how to asynchronous tests if needed
  var done = assert.async();
  // setTimeout(function() {
  //   assert.equal(math_str_el.val(), "bx+ax^{2}+c=0");
  //   done();
  // }, 10);

  let listen = true;
  if (typeof unsubscribe === "undefined") {
    let unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (!state.doing_manip && listen) {
        console.log("asserting", math_str_init);
        assert.equal(state.mathHist[state.current_index].mathStr, math_str_exp);
        done();
        listen = false;
      }
    })
  }
  dispatch(act.manipulate(manip));

    // if (typeof unsubscriber === "undefined") {
    //   let unsubscriber = store.subscribe(() => {
    //     const state = store.getState();
    //     if (!state.doing_manip) {
    //       console.log("unsubscribing");
    //       unsubscribe();
    //       done();
    //     }
    //   })
    // }


}

  // QUnit.test("tree", function( assert ) {
  //   dispatch(act.addToHist("ax^{2}+bx+c=0", 0))
  //   assert.equal(math_root.children.length, 5);
  //   assert.equal(math_root.children[0].text, "ax^{2}");
  //   assert.equal(math_root.children[0].type, "term");
  //     assert.equal(math_root.children[0].children[0].text, "a");
  //     assert.equal(math_root.children[0].children[0].type, "factor");
  //     assert.equal(math_root.children[0].children[1].text, "x^{2}");
  //     assert.equal(math_root.children[0].children[1].type, "factor");
  //     assert.equal(math_root.children[0].children[1].type2, "exp");
  //     assert.equal(math_root.children[0].children[1].children[0].text, "x");
  //     assert.equal(math_root.children[0].children[1].children[0].type, "base");
  //     assert.equal(math_root.children[0].children[1].children[1].text, "2");
  //     assert.equal(math_root.children[0].children[1].children[1].type, "power");
  //   assert.equal(math_root.children[1].text, "+bx");
  //
  //   dispatch(act.addToHist("\\frac{ax^{2}+bx+c}{\\frac{a}{b}}", 0))
  //   assert.equal(math_root.children.length, 1);
  //   assert.equal(math_root.children[0].children[0].type2, "frac");
  //   assert.equal(math_root.children[0].children[0].children[0].text, "ax^{2}+bx+c");
  //   assert.equal(math_root.children[0].children[0].children[0].type, "numerator");
  //   assert.equal(math_root.children[0].children[0].children[1].text, "\\frac{a}{b}");
  //   assert.equal(math_root.children[0].children[0].children[1].type, "denominator");
  // });

  // QUnit.test("manipulations.change_side", function( assert ) {

    //change terms of side
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "ax^{2}+bx+c=0", "bx+c=-ax^{2}",  ["0/1"]);
    })
    //change multiple terms of side
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "ax^{2}+bx+c=0", "c=-ax^{2}-bx",  ["0/1", "0/2"]);
    })
    //change terms of side from RHS
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "ax^{2}+bx+c=\\frac{ex^{2}}{abcd\\sqrt{32}}", "ax^{2}+bx+c-\\frac{ex^{2}}{abcd\\sqrt{32}}=0",  ["0/5"]);
    })

    //change operator (sign) of side
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "-ax^{2}c=bx", "ax^{2}c=-bx",  ["0/1/1"]);
    })

    //DON'T change operator (sign) of side
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "-ax^{2}+bx+c=0", "-ax^{2}+bx+c=0",  ["0/1/1"]);
    })
    //change operator (sign) of side from RHS
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "ax^{2}c=-bx", "-ax^{2}c=bx",  ["0/3/1"]);
    })

    //change factor of side
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "ax^{2}(k+bx+c)=\\sqrt{2}", "a(k+bx+c)=\\frac{\\sqrt{2}}{x^{2}}",  ["0/1/2"]);
    })
    //change factor (when in numerator) of side
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "\\frac{ax^{2}}{(k+bx+c)}=\\sqrt{2}", "\\frac{a}{(k+bx+c)}=\\frac{\\sqrt{2}}{x^{2}}",  ["0/1/1/1/1/2"]);
    })
    //change numerator of side
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "\\frac{ax^{2}+33e}{(k+bx+c)}=\\sqrt{2}", "\\frac{1}{(k+bx+c)}=\\frac{\\sqrt{2}}{ax^{2}+33e}", ["0/1/1/1"]);
    })
    //change single-term numerator of side when selecting that term
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "\\frac{33e}{(k+bx+c)}=\\sqrt{2}", "\\frac{1}{(k+bx+c)}=\\frac{\\sqrt{2}}{33e}",  ["0/1/1/1/1"]);
    })
    //change factor of side from RHS
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "ax^{2}(k+bx+c)=\\sqrt{2}", "\\frac{ax^{2}(k+bx+c)}{\\sqrt{2}}=1",  ["0/3/1"]);
    })

    //change denominator of side
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "\\frac{ax^{2}+33e}{(k+bx+c)}=\\sqrt{2}", "ax^{2}+33e=(k+bx+c)\\sqrt{2}",  ["0/1/1/2"]);
    })
    //change denominator of side from RHS
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "\\sqrt{2}=\\frac{ax^{2}+33e}{(k+bx+c)}", "\\sqrt{2}(k+bx+c)=ax^{2}+33e",  ["0/3/1/2"]);
    })
    //change factor (in denominator) of side
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "\\frac{2^{2}\\pi ^{2}}{T^{2}}=\\frac{GM}{r^{3}}", "2^{2}\\pi ^{2}=\\frac{GMT^{2}}{r^{3}}", ["0/1/1/2/1/1"]);
    })

    //change power of side
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "(ax^{2}(k+bx+c))^{33}=\\sqrt{2}", "(ax^{2}(k+bx+c))=(\\sqrt{2})^{\\frac{1}{33}}",  ["0/1/1/2"]);
    })
    //change power of side to a side with multiple terms
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "(ax^{2}(k+bx+c))^{33}=\\sqrt{2}+abcd", "(ax^{2}(k+bx+c))=(\\sqrt{2}+abcd)^{\\frac{1}{33}}", ["0/1/1/2"]);
    })
    //change fractional power of side from RHS
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "(ax^{2}(k+bx+c))=(\\sqrt{2})^{\\frac{1}{33}}", "(ax^{2}(k+bx+c))^{33}=(\\sqrt{2})",  ["0/3/1/2"]);
    })
    // console.log("keeeeeeeeeekkekekekekekekekekek");
    //TODO: FOR power. NEED TO ADD option for selecting factor or term within power, just like for fractions..

    //change base in log of side
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "z+asda=\\log_{e^{2}}{x}", "(e^{2})^{z+asda}=x",  ["0/4/1/1"]);
    })

  // });

    //Move term right
    QUnit.test("manipulations.move_right", (assert) => {
      test_manip(assert, "move_right", "ax^{2}+bx_{c}+c=0", "bx_{c}+ax^{2}+c=0",  ["0/1"]);
    });
    //Move normal factor right
    QUnit.test("manipulations.move_right", (assert) => {
      test_manip(assert, "move_right", "ax^{2}+bx+c=0", "x^{2}a+bx+c=0",  ["0/1/1"]);
    });
    //Move numerical factor right
    QUnit.test("manipulations.move_right", (assert) => {
      test_manip(assert, "move_right", "33 \\cdot 44z = 1", "44\\cdot 33z=1",  ["0/1/1"]);
    });
    //Move numerical factor in fraction right
    QUnit.test("manipulations.move_right", (assert) => {
      test_manip(assert, "move_right", "\\frac{33\\cdot 44}{z}=1",  "\\frac{44\\cdot 33}{z}=1", ["0/1/1/1/1/1"]);
    });


    //Move term left
    QUnit.test("manipulations.move_left", (assert) => {
      test_manip(assert, "move_left", "bx+ax^{2}+c=0", "ax^{2}+bx+c=0",  ["0/2"]);
    });
    //Move normal factor left
    QUnit.test("manipulations.move_left", (assert) => {
      test_manip(assert, "move_left", "ax^{2}+bx+c=0", "x^{2}a+bx+c=0",  ["0/1/2"]);
    });
    //Move numerical factor left
    QUnit.test("manipulations.move_left", (assert) => {
      test_manip(assert, "move_left", "44\\cdot 33z=1", "33\\cdot 44z=1",  ["0/1/3"]);
    });
    //Move numerical factor in fraction left
    QUnit.test("manipulations.move_left", (assert) => {
      test_manip(assert, "move_left", "\\frac{44\\cdot 33}{z}=1", "\\frac{33\\cdot 44}{z}=1",  ["0/1/1/1/1/3"]);
    });

  //move up in fraction
    //Move factors in single term in denominator up
    QUnit.test("manipulations.move_up", (assert) => {
      test_manip(assert, "move_up", "\\frac{ex^{2}}{abcd\\sqrt{33}}+bx+c=1+1-bx", "\\frac{c^{-1}ex^{2}}{abd\\sqrt{33}}+bx+c=1+1-bx", ["0/1/1/2/1/3"]);
    });
    //Move all factors in single term in denominator up
    QUnit.test("manipulations.move_up", (assert) => {
      test_manip(assert, "move_up", "1=\\frac{x}{yz}", "1=y^{-1}z^{-1}x",  ["0/3/1/2/1/1","0/3/1/2/1/2"]);
    });
    //Move all fractions in single term in denominator up
    QUnit.test("manipulations.move_up", (assert) => {
      test_manip(assert, "move_up", "1=\\frac{x}{\\frac{2}{3}\\frac{5}{4}}", "1=\\frac{3}{2}\\frac{4}{5}x",  ["0/3/1/2/1/1","0/3/1/2/1/2"]);
    });
    //Move single term in denominator
    QUnit.test("manipulations.move_up", (assert) => {
      test_manip(assert, "move_up", "\\frac{xa}{aax(lel)^{2}}=\\tau", "a^{-1}a^{-1}x^{-1}(lel)^{-2}xa=\\tau ", ["0/1/1/2/1"])
    });
    //Move fraction up
    QUnit.test("manipulations.move_up", (assert) => {
      test_manip(assert, "move_up", "\\frac{v^{2}}{r}=\\frac{1}{\\frac{GMm}{r}}", "\\frac{v^{2}}{r}=\\frac{r}{GMm}", ["0/3/1/2/1/1"])
    });

  //move down in fraction
  //Move factor down
  QUnit.test("manipulations.move_down", (assert) => {
    test_manip(assert, "move_down", "\\frac{ex^{2}}{abcd\\sqrt{32}}+bx+c=1+1-bx", "\\frac{ex^{2}}{abcd\\sqrt{32}}+\\frac{x}{b^{-1}}+c=1+1-bx",  ["0/2/2"]);
  });

    //BASIC FACTOR OUT
    QUnit.test("manipulations.collect_out", (assert) => {
      test_manip(assert, "collect_out", "ax_{c}+ay_{dd}", "a(x_{c}+y_{dd})",  ["0/1/1", "0/2/2"]);
    });

    //FACTOR OUT with one one-factor term
    QUnit.test("manipulations.collect_out", (assert) => {
      test_manip(assert, "collect_out", "p+\\frac{ac}{a+c}p=1", "p(1+\\frac{ac}{a+c})=1",  ["0/1/1", "0/2/3"]);
    });

    //FACTOR OUT with one one-factor term AGAIN
    QUnit.test("manipulations.collect_out", (assert) => {
      test_manip(assert, "collect_out", "-\\omega^{2} B e^{i\\phi} + i \\beta \\omega B e^{i\\phi} + B e^{i\\phi} = \\Gamma", "Be^{i\\phi }(-\\omega ^{2}+i\\beta \\omega +1)=\\Gamma ",  ["0/1/3", "0/1/4", "0/2/5", "0/2/6", "0/3/2", "0/3/3"]);
    });

    //FACTOR OUT with containing terms not being directly their parents. TODO: NEED TO CODE THIS IN
    // test_manip(assert, merge, "\\frac{c(a+k-1)}{a+c}p-\\frac{c(a+k)}{a+c}p", "c(\\frac{(a+k-1)}{a+c}p-\\frac{(a+k)}{a+c}p)",  ["0/1/1/1/1/1", "0/2/2/1/1/1"]);

    //FACTOR OUT more than one factor per term.
    QUnit.test("manipulations.collect_out", (assert) => {
      test_manip(assert, "collect_out", "abx+ayb", "ab(x+y)",  ["0/1/1", "0/1/2", "0/2/2", "0/2/4"]);
    });

    //Merge equal factors into exp 1
    QUnit.test("manipulations.collect_out", (assert) => {
      test_manip(assert, "collect_out", "abxx+ayb", "abx^{2}+ayb",  ["0/1/3", "0/1/4"]);
    });

    //Merge equal factors into exp 2
    // test_manip(assert, merge, "abxbx+ayb", "ab^{2}  x^{2}+ayb",  ["0/1/2", "0/1/3", "0/1/4", "0/1/5"]); //USE EVALUATE FOR THIS

    //Merge equal terms into term
    QUnit.test("manipulations.collect_out", (assert) => {
      test_manip(assert, "collect_out", "ac+abb+abb+ac", "ac+2abb+ac",  ["0/2", "0/3"]);
    });

    //Merge fraction terms into fraction
    QUnit.test("manipulations.collect_out", (assert) => {
      test_manip(assert, "collect_out", "ac+\\frac{a}{b}+\\frac{cd}{b}", "ac+\\frac{a+cd}{b}",  ["0/2", "0/3"]);
    });

    //Merge terms into fraction (using Algebrite)
    QUnit.test("manipulations.collect_out", (assert) => {
      test_manip(assert, "collect_out", "ac+\\frac{a}{b}+\\frac{cd}{eb}", "ac+\\frac{aeb+cdb}{beb}",  ["0/2", "0/3"]);
    });

    //Merge exponentials with same base
    QUnit.test("manipulations.collect_out", (assert) => {
      test_manip(assert, "collect_out", "acu^{\\frac{2}{3}}u^{3}", "acu^{\\frac{2}{3}+3}",  ["0/1/3", "0/1/4"]);
    });

    //Merge exponentials with same power
    QUnit.test("manipulations.collect_out", (assert) => {
      test_manip(assert, "collect_out", "acu^{\\frac{2}{3}}(u+v)^{\\frac{2}{3}}", "ac(u(u+v))^{\\frac{2}{3}}",  ["0/1/3", "0/1/4"]);
    });

    //Merge sqrts into sqrt
    QUnit.test("manipulations.collect_out", (assert) => {
      test_manip(assert, "collect_out", "ac\\sqrt{uu+v}\\sqrt{x}", "ac\\sqrt{(uu+v)x}",  ["0/1/3", "0/1/4"]);
    });

  //
    //BASIC DISTRIBUTE IN
    QUnit.test("manipulations.distribute_in", (assert) => {
      test_manip(assert, "distribute_in", "a(x+y)", "ax+ay",  ["0/1/1", "0/1/2"]);
    });

    QUnit.test("manipulations.distribute_in", (assert) => {
      test_manip(assert, "distribute_in", "(x-3)^{2}-(x+2)3x+x+2", "(x-3)^{2}-(x3x+x3\\cdot 2)+x+2",  ["0/2/4", "0/2/3", "0/2/2"]);
    });

    //DISTRIBUTE IN with one one-factor term
    QUnit.test("manipulations.distribute_in", (assert) => {
      test_manip(assert, "distribute_in", "p(1+\\frac{ac}{a+c})=1", "p+p\\frac{ac}{a+c}=1", ["0/1/1", "0/1/2"]);
    });

    //DISTRIBUTE IN more than one factor per term.
    QUnit.test("manipulations.distribute_in", (assert) => {
      test_manip(assert, "distribute_in", "ab(x+y)", "abx+aby", ["0/1/1", "0/1/2", "0/1/3"]);
    });

    //DISTRIBUTE power in
    QUnit.test("manipulations.distribute_in", (assert) => {
      test_manip(assert, "distribute_in", "(ab(x+y))^{33x}", "a^{33x}b^{33x}(x+y)^{33x}", ["0/1/1"]);
    });

    //Split exponential with terms into several exponentials
    QUnit.test("manipulations.distribute_in", (assert) => {
      test_manip(assert, "distribute_in", "(ab(x+y))^{33x+y}", "(ab(x+y))^{33x}(ab(x+y))^{+y}", ["0/1/1/2"]);
    });

    //distribute power in fraction
    QUnit.test("manipulations.distribute_in", (assert) => {
      test_manip(assert, "distribute_in", "1=(\\frac{2}{3})^{-1}(\\frac{5}{4})^{-1}x", "1=\\frac{2^{-1}}{3^{-1}}(\\frac{5}{4})^{-1}x", ["0/3/1"]);
    });

  //
    //Merge factors into fraction
    QUnit.test("manipulations.merge", (assert) => {
      test_manip(assert, "merge", "ac\\frac{a}{b}\\frac{cd\\sqrt{k}}{xx}", "ac\\frac{acd\\sqrt{k}}{bxx}",  ["0/1/3", "0/1/4"]);
    });
    QUnit.test("manipulations.merge", (assert) => {
      test_manip(assert, "merge", "x^{4}\\frac{1}{4}\\frac{1}{z^{2}}", "x^{4}\\frac{1}{4z^{2}}",  ["0/1/2", "0/1/3"]);
    });
    QUnit.test("manipulations.merge", (assert) => {
      test_manip(assert, "merge", "\\log{\\frac{1}{y}x}=z", "\\log{\\frac{x}{y}}=z",  ["0/1/1/2/1/1", "0/1/1/2/1/2"]);
    });

    //Merge logs into log
    QUnit.test("manipulations.merge", (assert) => {
      test_manip(assert, "merge", "\\log{x}+\\log{y}=z", "\\log{xy}=z",  ["0/1", "0/2"]);
    });
    QUnit.test("manipulations.merge", (assert) => {
      test_manip(assert, "merge", "\\log_{a}{x}-\\log_{a}{y}=z", "\\log_{a}{x\\frac{1}{y}}=z",  ["0/1", "0/2"]);
    });
    QUnit.test("manipulations.merge", (assert) => {
      test_manip(assert, "merge", "\\log{x}+\\log{y+z}=z", "\\log{x(y+z)}=z",  ["0/1", "0/2"]);
    });
  //
    //Split factors out of a fraction
    QUnit.test("manipulations.split", (assert) => {
      test_manip(assert, "split", "ac\\frac{acd\\sqrt{k}}{bxx}", "ac\\frac{cd\\sqrt{k}}{xx}\\frac{a}{b}",  ["0/1/3/1/1/2", "0/1/3/1/1/3", "0/1/3/1/1/4", "0/1/3/2/1/2", "0/1/3/2/1/3"]);
    });

    //Split factors out of a log
    QUnit.test("manipulations.split", (assert) => {
      test_manip(assert, "split", "\\log{xassdaadsy}", "\\log{asads}+ \\log{xsday}",  ["0/1/1/2/1/1", "0/1/1/2/1/3", "0/1/1/2/1/5", "0/1/1/2/1/6", "0/1/1/2/1/10"]);
    });
  //

    //merge two exponentials
    QUnit.test("manipulations.evaluate", (assert) => {
      test_manip(assert, "evaluate", "a^{-1}a^{-1}", "a^{-2}",  ["0/1/1", "0/1/2"]);
    });

    //merge two terms
    QUnit.test("manipulations.evaluate", (assert) => {
      test_manip(assert, "evaluate", "x^{2}-3x^{2}+9-6x-6x+x+2", "-2 x^{2}+9-6x-6x+x+2",  ["0/2", "0/1"]);
    });
    QUnit.test("manipulations.evaluate", (assert) => {
      test_manip(assert, "evaluate", "-2x^{2}+9-12x+x+2", "-2x^{2}+9-11 x+2",  ["0/3", "0/4"]);
    });
    QUnit.test("manipulations.evaluate", (assert) => {
      test_manip(assert, "evaluate", "-2x^{2}+9-11 x+2", "-2x^{2}+11-11x",  ["0/2", "0/4"]);
    });
  //
  //merge two exponentials
  QUnit.test("manipulations.cancel_out", function( assert ) {
    test_manip(assert, "cancel_out", "\\frac{v^{2}}{r}=\\frac{GMmr}{r^{2}}", "\\frac{v^{2}}{r}=\\frac{GMm}{r}",  ["0/3/1/1/1/4", "0/3/1/2/1/1"]);
  });
  //
  //merge two exponentials
  QUnit.test("manipulations.operate", function( assert ) {
    test_manip(assert, "operate", "\\frac{d}{dx} (x^{5}+x^{3})", "5 x^{4} + 3 x^{2}",  ["0/1/1"]);
  });
