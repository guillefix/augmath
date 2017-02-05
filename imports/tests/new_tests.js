import store from './redux/store';
import * as act from './redux/actions/action-creators';

const dispatch = store.dispatch;

dispatch(act.changeStepDuration(0))

function test_manip(assert, manip, math_str_init, math_str_exp, node_ids) {
  console.log("BEGIN TEST");

  const state = store.getState();
  dispatch(act.addToHist(math_str_init, state.current_index))

  //
  if (node_ids.length > 1) { dispatch(act.updateSelect({multi_select: true})) }
  //
  for (var i=0; i<node_ids.length; i++) { //selecting nodes in node_ids
    dispatch(act.selectNode(node_ids[i]));
  }

 var done = assert.async();

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


}
    //work with \mid
    QUnit.test("manipulations.change_side", (assert) => {
      test_manip(assert, "change_side", "", "P(B\\mid A)=\\frac{P(A\\mid B)P(B)}{P(A)}",  ["0/1"]);
    })
