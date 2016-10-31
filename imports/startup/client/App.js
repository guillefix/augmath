import React from 'react';
import ReactDOM from 'react-dom';
import Tools from './tools.js';
import katex from 'katex';
import EquationsPanel from './equations-panel.js';
import * as manips from '../../maths/manipulations.js';
import {clear_math, select_node, parse_poly, tot_width, replace_in_mtstr, getIndicesOf, parse_mtstr, get_next, get_prev} from "../../maths/functions";
import TreeModel from '../../TreeModel-min.js';
import 'nestedSortable';
import * as Actions from './actions/action-creators';

export default class App extends React.Component {
  constructor() {
    super();
    this.update = this.update.bind(this);
    let init_math_str = "\\frac{v^{2}}{r}=\\frac{GMm}{r^{2}}+3abcd";
    this.state = {
      mathStr: init_math_str, //mathStr is the UI math string, to keep MathQL and MathInput in sync
      mtype: "term",
      depth: 1,
      eqZoom: 14};
  }
  update(newStr) {
    this.setState({mathStr: newStr})
  }
  componentDidMount() {
    const thisApp = this;
    const { store } = this.context;
    this.dispatch = store.dispatch;
    const dispatch = this.dispatch;
    const state = store.getState();
    store.subscribe(() => {
      const state = store.getState();
      if (!state.doing_manip) {
        thisApp.setState({mtype: state.mtype,
          depth: state.depth,
          mathStr: state.mathHist[state.current_index].mathStr,
          eqZoom: state.eqZoom})
      }
    })
    // this.create_events(this.state.mtype, this.state.depth)

    $(document).on( "keyup", function (e) { //right
        if (e.keyCode == 39) {
          if (this.selection.selected_nodes && this.selection.selected_nodes.length > 0) {
            let index = parseInt(this.selection.selected_nodes[0].model.id.split("/")[this.selection.selected_nodes[0].model.id.split("/").length-1]); //no +1 because the tree index is 1 based not 0 based
              let new_node = this.selection.selected_nodes[0].parent.children[index] || undefined;
              if (new_node) {
                if (new_node.type !== this.selection.selected_nodes[0].type) {
                  dispatch(Actions.updateSelect({mtype:new_node.type}));
                }
                select_node(new_node, thisApp.state.multi_select, thisApp.state.var_select);
              }
            }
        }
    });
    $(document).on( "keyup", function (e) { //left
        if (e.keyCode == 37) {
          if (this.selection.selected_nodes && this.selection.selected_nodes.length > 0) {
            var index = parseInt(this.selection.selected_nodes[0].model.id.split("/")[this.selection.selected_nodes[0].model.id.split("/").length-1])-2;
              let new_node = this.selection.selected_nodes[0].parent.children[index] || undefined;
              if (new_node) {
                if (new_node.type !== this.selection.selected_nodes[0].type) {
                  dispatch(Actions.updateSelect({mtype:new_node.type}));
                }
                select_node(new_node, thisApp.state.multi_select, thisApp.state.var_select);
              }
            }
        }
    });
    $(document).on( "keyup", function (e) { //down
        if (e.keyCode == 40) {
          if (this.selection.selected_nodes && this.selection.selected_nodes.length > 0) {
            if (this.selection.selected_nodes[0].children.length > 0) {
              let new_node = this.selection.selected_nodes[0].children[0];
              const state = store.getState();
              dispatch(Actions.updateSelect({mtype:new_node.type, depth:++state.depth}));
              select_node(new_node, thisApp.state.multi_select, thisApp.state.var_select);
            }
          }
        }
    });
    $(document).on( "keyup", function (e) { //up
        if (e.keyCode == 38) {
          if (this.selection.selected_nodes && this.selection.selected_nodes.length > 0) {
            if (this.selection.selected_nodes[0].parent !== math_root) {
              let new_node = this.selection.selected_nodes[0].parent;
              const state = store.getState();
              dispatch(Actions.updateSelect({mtype:new_node.type, depth:--state.depth}));
              select_node(new_node, thisApp.state.multi_select, thisApp.state.var_select);
            }
          }
        }
    });

    $(document).on( "keyup", function (e) { //ctrl+m for multiselect
        if (e.keyCode == 77 && e.ctrlKey) {
          const state = store.getState();
          $("#multi_select").prop("checked", !state.multi_select);
          dispatch(Actions.updateSelect({multi_select: !state.multi_select}));
          // console.log(thisApp.state.multi_select);
        }
    });
  }

  render() {
    return (
      <div>
        <div className="col-md-3 toolbar">
          <Tools ref={(ref) => this.toolsPane = ref} mtype={this.state.mtype} depth={this.state.depth} />
        </div>
        <div className="col-md-6">
          <Toolbar />
          <MathInput mathStr={this.state.mathStr} update={this.update}/>

          <MathArea mtype={this.state.mtype} depth={this.state.depth} eqZoom={this.state.eqZoom} />
        </div>
        <div className="col-md-3">
          <EquationsPanel />
        </div>
      </div>
    );
  }
}
App.contextTypes = {
  store: React.PropTypes.object
};

class Toolbar extends React.Component {
  render() {
    const { store } = this.context;
    const { dispatch } = store;
    return (
      <div className="row">
  			<div className="bottom-buffer btn-toolbar" role="toolbar">
      			  <div className="btn-group">
      			    <button id="tb-undo" className="btn btn-default" onClick={()=>{
                    const state = store.getState();
                    dispatch(Actions.updateIndex(state.current_index-1))
                  }}>Undo</button>
      			    <button id="tb-redo" className="btn btn-default" onClick={()=>{
                    const state = store.getState();
                    dispatch(Actions.updateIndex(state.current_index+1))
                  }}>Redo</button>
      			  </div>
      			<button type="button" className="btn btn-default " id="tb-flip_equation" onClick={dispatch.bind(null, Actions.manipulate("flip_equation"))}>
  					Flip equation
  				  </button>
  				<button type="button" className="btn btn-default " id="tb-change_side" onClick={dispatch.bind(null, Actions.manipulate("change_side"))}>
  					Change side
  				</button>

  				<div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-move_up" onClick={dispatch.bind(null, Actions.manipulate("move_up"))}>
  							<span className="glyphicon glyphicon-arrow-up"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_left" onClick={dispatch.bind(null, Actions.manipulate("move_left"))}>
  						<span className="glyphicon glyphicon-arrow-left"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_right" onClick={dispatch.bind(null, Actions.manipulate("move_right"))}>
  						<span className="glyphicon glyphicon-arrow-right"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_down" onClick={dispatch.bind(null, Actions.manipulate("move_down"))}>
  							<span className="glyphicon glyphicon-arrow-down"></span>
  					</button>
  				</div>

  				<div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-distribute-in" onClick={dispatch.bind(null, Actions.manipulate("distribute_in"))}>
  						Distribute in
  					</button>
  					<button type="button" className="btn btn-default" id="tb-collect-out" onClick={dispatch.bind(null, Actions.manipulate("collect_out"))}>
  						Collect out
  					</button>
  				</div>

          <div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-split" onClick={dispatch.bind(null, Actions.manipulate("split"))}>
  						Split out
  					</button>
  					<button type="button" className="btn btn-default" id="tb-merge" onClick={dispatch.bind(null, Actions.manipulate("merge"))}>
  						Merge in
  					</button>
  				</div>
          <br />
          <br />
  				<button type="button" className="btn btn-default" id="tb-eval" onClick={dispatch.bind(null, Actions.manipulate("evaluate"))}>
  					Evaluate/Simplify
  				</button>
  				<button type="button" className="btn btn-default" id="tb-operate" onClick={dispatch.bind(null, Actions.manipulate("operate"))}>
  					Operate
  				</button>
          <button type="button" className="btn btn-default" id="tb-cancel-out" onClick={dispatch.bind(null, Actions.manipulate("cancel_out"))}>
  					Cancel out
  				</button>
  			</div>
  		</div>
    );
  }
}
Toolbar.contextTypes = {
  store: React.PropTypes.object
};

class MathInput extends React.Component {
  latexStr() {
    return ReactDOM.findDOMNode(this.refs.latexInput).value
  }
  toggleLatexInput() {
    this.math_str_el.toggle();
    this.math_str_el.is(":visible") ? $("#show_latex").text("Hide LaTeX") : $("#show_latex").text("Show LaTeX")
  }
  componentDidMount() {
    this.math_str_el = $("#MathInput input");
    this.math_str_el.hide();
  }
  render() {
    const { store } = this.context;
    const { dispatch } = store;
    return (
      <div className="row">
  			<p id="MathInput">Input some equation (<a id="show_latex" onClick={this.toggleLatexInput.bind(this)}>show LaTeX</a>): &nbsp;
          <MQInput mathStr={this.props.mathStr} update={this.props.update}/>
          &nbsp;
          <input size="50" ref="latexInput" value={this.props.mathStr}
            onChange={() => {this.props.update(this.latexStr())}}
            onKeyUp={(e) =>{
              let index = store.getState().current_index;
              if (e.keyCode == 13) dispatch(Actions.addToHist(this.props.mathStr, ++index))
            }}/>
          &nbsp;
          <button type="button" className="btn btn-default" id="keep" onClick={dispatch.bind(null, Actions.addToEqs(this.props.mathStr))}>
  					Keep
  			  </button>
  			</p>
  		</div>
    )
  }
}
MathInput.contextTypes = {
  store: React.PropTypes.object
};

class MQInput extends React.Component {
  mqlatex() {
    return this.mathquill.latex().replace(/[^\x00-\x7F]/g, "")
      .replace(/\^([a-z0-9])/g, "^{$1}")
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
  }
  componentDidMount() {
    let MQ = MathQuill.getInterface(2);
    this.mathquill = MQ.MathField($('#mathquill')[0]);
    this.mathquill.latex(this.props.mathStr)
  }
  shouldComponentUpdate(nextProps, nextState) {
    return this.mqlatex() !== nextProps.mathStr
  }
  componentDidUpdate(prevProps, prevState) {
    this.mathquill.latex(this.props.mathStr)
  }
  render() {
    const { store } = this.context;
    const { dispatch } = store;
    const state = store.getState();
    return (
      <span id="mathquill"
        onKeyUp={(e) => {
          const state = store.getState();
          let index = state.current_index;
          if (e.keyCode == 13) dispatch(Actions.addToHist(this.props.mathStr, ++index))
          else this.props.update(this.mqlatex()) }}>...</span>
    );
  }
}
MQInput.contextTypes = {
  store: React.PropTypes.object
};

class MathArea extends React.Component {
  render() {
    const {store} = this.context;
    const state = store.getState();
    let equations = state.equations;
    let eqNum = equations.length;
    let selectedNodes = state.selectedNodes;
    return (
      <div className="row">
        <div className="math-container">
          {equations.map((x, i) => {
            let sel = selectedNodes.filter(x => parseInt(x.split('/')[0]) === i)
            // console.log("math", i, x);
            return <Equation mtype={this.props.mtype} depth={this.props.depth} selectedNodes={sel} eqZoom={this.props.eqZoom} math={x} eqNum={eqNum} index={i} key={i} selected={state.current_eq === i} ref={state.current_eq === i ? "math" : undefined}/>
          }).reverse()}
  			</div>
      </div>
    )
  }
}
MathArea.contextTypes = {
  store: React.PropTypes.object
};

class Equation extends React.Component {
  constructor() {
    super();
    this.selection = {};
  }
  componentDidMount() {
    console.log("mounting comp", this.props.index, this.props.math);
    const { store } = this.context;
    const state = store.getState();
    this.unsubscribe = store.subscribe(this.doManip.bind(this));
    let math_el = ReactDOM.findDOMNode(this.refs.math);
    katex.render(this.props.math, math_el, { displayMode: true });
    this.updateTree();
    window.$equals =  $(math_el).find(".base").find(".mrel");
    this.equals_position = $equals.offset();
    this.resetStyle();
    this.create_events(this.props.mtype, this.props.depth);
  }
  doManip() {
    // console.log(this);
    const { store } = this.context;
    let math_root = this.math_root;
    const state = store.getState();
    if (state.doing_manip && this.selection.selected_nodes.length > 0)
    {
      let promise, eqCoords = {};

      //useful variables
      let vars = {};

      eqCoords.beginning_of_equation = math_root.children[0].model.obj.offset();
      let width_last_term = tot_width(math_root.children[math_root.children.length-1].model.obj, true, true);
      eqCoords.end_of_equation = math_root.children[math_root.children.length-1].model.obj.offset();
      eqCoords.end_of_equation.left += width_last_term;
      eqCoords.equals_position = this.equals_position;

      vars.eqCoords = eqCoords;

      vars.math_root = this.math_root;
      vars.selection = this.selection;
      // console.log(this.selection);
      // console.log("vars.math_root", vars.math_root);
      // console.log(this.selection.selected_nodes);
      if (state.manip === "replace") {
        promise = manips[state.manip].call(vars, state.manip_data, state.replace_ind);
      } else if (state.manip === "flip_equation") {
        promise = manips[state.manip].call(vars, state.mathHist[state.current_index]);
      } else if (state.manip === "add_both_sides") {
        promise = manips[state.manip].call(vars, state.manip_data, state.mathHist[state.current_index]);
      } else {
        promise = manips[state.manip].call(vars);
      }
      promise.then((data) => {
        console.log("going to update equation", data);
        let index = state.current_index;
        store.dispatch(Actions.addToHist(data, ++index));
      })
    }
    // else {
    //   this.forceUpdate();
    // }
  }
  componentDidUpdate(prevProps, prevState) {
    console.log("updating comp", this.props.index, this.props.math);
    let math_el = ReactDOM.findDOMNode(this.refs.math);

    const { store } = this.context;
    const state = store.getState();

    this.unsubscribe();
    this.unsubscribe = store.subscribe(this.doManip.bind(this)); //rebinding

    //reset selected
    let selNum = this.props.selectedNodes.length;

    //If math string is changed
    // console.log(this.props.index, prevProps.math, this.props.math);
    if (prevProps.math !== this.props.math ) { //|| prevProps.eqNum !== this.props.eqNum
      katex.render(this.props.math, math_el, { displayMode: true });
      this.updateTree();
      this.create_events(this.props.mtype, this.props.depth);
    }
    if (prevProps.mtype !== this.props.mtype || prevProps.depth !== this.props.depth)
      this.create_events(this.props.mtype, this.props.depth);

    this.resetStyle();

    //update selected nodes
    if (selNum === 0) {
      this.resetSelected();
    } else {
      for (var i = 0; i < selNum; i++) {
        this.selectNode(this.props.selectedNodes[i], state.multi_select, state.var_select)
      }
    }
  }
  updateTree() {
    const { store } = this.context;
    const state = store.getState();
    let math_root;

    let math_el = ReactDOM.findDOMNode(this.refs.math);
    let root_poly = $(math_el).find(".base");

    tree = new TreeModel();

    math_root = tree.parse({});
    math_root.model.id = this.props.index.toString;
    math_root.model.obj = root_poly;

    parse_poly(math_root, root_poly, this.props.index, true);

    this.math_root = math_root;
  }
  resetStyle() {
    let math_el = ReactDOM.findDOMNode(this.refs.math);

    //setting zoom
    $(math_el).css("font-size", this.props.eqZoom.toString()+"px");

    $(math_el).css("height", "100%")

    //repositioning equals so that it's always in the same place. put in fixed value
    let root_poly = $(math_el).find(".base");
    window.$equals = root_poly.find(".mrel");
    if ($equals.length !== 0) {
      $(math_el).css("left","0px", "top", "0px");
      let new_equals_position = $equals.offset();
      // console.log("hi", this.props.index, this.equals_position, new_equals_position);
      let h_eq_shift = this.equals_position.left-new_equals_position.left
      let v_eq_shift = this.equals_position.top-new_equals_position.top
      $(math_el).css("left",h_eq_shift.toString()+"px", "top", v_eq_shift.toString()+"px");
    }
  }
  create_events(type, depth) {
    const { store } = this.context;
    const state = store.getState();
    const dispatch = store.dispatch;
    let math_root = this.math_root;
    let thisComp = this;
    // console.log("creating events", type,depth);
    let math_el = ReactDOM.findDOMNode(this.refs.math);
    $(math_el).find("*").off();
    var  index;
    //DRAG AND DROP. Goes here because I should group stuff depending on which manipulative is selectable really
    // $(".base").attr('id', 'sortable');

    let dragDrop = "eq";

    if (dragDrop === "eq") {
      $(math_el).find( ".draggable" ).draggable( "destroy" );
      $(math_el).find(".draggable").droppable( "destroy" );
      $(math_el).find(".draggable").removeClass("draggable");
      math_root.walk(function (node) {
        let obj;
        if (node.type === "rel" && node.parent.type !== "rel" && typeof node.parent.model.obj !== "undefined") {
          obj = node.parent.model.obj;
          // console.log("hello here", type, depth, obj);
          obj.data('root', node.parent)
          console.log(node.parent);
          obj.addClass("draggable")
          obj.draggable({
            revert: true
          });
          obj.droppable({
            drop: function( event, ui ) {
              // let root = $( this ).data('root');
              let root = ui.draggable.data('root');
              console.log(root);
              if (root.children[1].type === "rel") {
                let varText = root.text.split("=")[0];
                let newText = root.text.split("=")[1];
                // dispatch(Actions.updateSelect({var_select: true}))
                let node = math_root.first(node => node.text === varText);
                thisComp.selectNode(node.model.id, false, true);
                // dispatch(Actions.selectNode(node.model.id));
                // console.log(node);
                let texts = thisComp.selection.selected_nodes.map(x => newText);
                let newStr = replace_in_mtstr(math_root, thisComp.selection.selected_nodes, texts);
                // dispatch(Actions.selectNode(node.model.id))
                dispatch(Actions.addToHist(newStr, state.current_index, node.model.id.split('/')[0]))
              }
            }
          });
        }
      });
    }

    if (dragDrop === "subs") {
      $(math_el).find( ".draggable" ).draggable( "destroy" );
      $(math_el).find(".draggable").droppable( "destroy" );
      $(math_el).find(".draggable").removeClass("draggable");
      math_root.walk(function (node) {
        let obj;
        if (node.type === type && node.model.id.split("/").length === depth+1 && typeof node.model.obj !== "undefined") {
          obj = node.model.obj;
          console.log("hello here", type, depth, obj);
          obj.data('node', node)
          obj.addClass("draggable")
          obj.draggable({
            revert: true
          });
          obj.droppable({
            drop: function( event, ui ) {
              let node = $( this ).data('node');
              let text = ui.draggable.data('node').text;
              // console.log(node);
              let newStr = replace_in_mtstr(math_root, [node], [text]);
              // dispatch(Actions.selectNode(node.model.id))
              dispatch(Actions.addToHist(newStr, state.current_index, node.model.id.split('/')[0]))
            }
          });
        }
      });
    }

    //SORTABLE
    if (dragDrop === "move") {
      $(".sortable").removeClass("sortable")
      $( ".sortable" ).disableSelection();
      math_root.walk(function (node) {

        let obj;
        // console.log("hello here", type, depth);
        if (node.type === type && node.model.id.split("/").length === depth+1 && typeof node.model.obj !== "undefined") {
          node.model.obj.data('node', node)
          // console.log(node.parent.parent);
          if (type === "factor") {
            obj = node.model.obj.parent();
            obj.addClass("sortable")
            obj.sortable({
              forceHelperSize: true,
              placeholder: "sortable-placeholder",
              connectWith: ".sortable"
            });
          } else if (type === "term") {
            obj = node.model.obj.parent();
            obj.addClass("sortable")
            obj.sortable({
              forceHelperSize: true,
              placeholder: "sortable-placeholder",
              connectWith: ".sortable",
              helper(e, item) {
                // console.log(item);
                // console.log(e);
                let term_objs = item.data('node').model.obj.clone();
                let helper_obj = $("<span></span>").append(term_objs);
                helper_obj.data('node',item.data('node'));
                return helper_obj
              },
              start(e, ui) {
                ui.item.data('node').model.obj.css("display", "none");
              },
              stop(e, ui) {
                let node = ui.item.data('node');
                let elements = node.model.obj.clone(true).css("display", "inherit");
                // console.log(elements, ui.item.prev());
                // let item = ui.item.prev();
                node.model.obj.not(ui.item).remove();
                if (node.type === "term" && ui.item.next().length > 0 && ui.item.next().text() !== "+" && ui.item.next().text() !== "-" && ui.item.next().text() !== "=") {
                  $('<span class="mbin ui-sortable-handle" style="display: inline-block;">+</span>').insertAfter(ui.item)
                  ui.item.after(elements);
                  ui.item.remove();
                } else if (node.type === "term" && ui.item.prev().length > 0 && ui.item.text() !== "+" && ui.item.text() !== "-" && ui.item.text() !== "=") {
                  $('<span class="mbin ui-sortable-handle" style="display: inline-block;">+</span>').insertAfter(ui.item)
                  ui.item.next().after(elements);
                  ui.item.remove();
                } else {
                  ui.item.after(elements);
                  ui.item.remove();
                }
              }
            });
          }
        }
      });
      // $("#sortable").sortable({
      //  forceHelperSize: true,
      //  placeholder: "sortable-placeholder",
      // });

      // $("#sortable").nestedSortable({
      //   // forceHelperSize: true,
      //   // placeholder: "sortable-placeholder",
      //   listType: 'span',
      //   items: 'span.mord',
      //   isAllowed(placeholder, placeholderParent, currentItem) {
      //     let hasparent = typeof placeholderParent !== "undefined";
      //     if (hasparent && placeholderParent.is(".mord:has(> .mord)")) {
      //       console.log(placeholderParent);
      //     }
      //     return hasparent ? placeholderParent.is(".mord:has(> .mord)") : false;
      //   },
      //   // relocate( event, ui ) {
      //   //
      //   //   window.setTimeout(rerender, 50); //probably not a very elegant solution
      //   //
      //   //   function rerender() {
      //   //     var root_poly = $("#math .base");
      //   //
      //   //     tree = new TreeModel();
      //   //
      //   //     math_root = tree.parse({});
      //   //     math_root.model.id = "0";
      //   //     //KaTeX offers MathML semantic elements on the HTML, could that be used?
      //   //
      //   //     parse_poly(math_root, root_poly, 0, true);
      //   //
      //   //     let newmath = parse_mtstr(math_root, [], []);
      //   //
      //   //     console.log(newmath);
      //   //
      //   //     thisApp.prepare(newmath);
      //   //   }
      //   //
      //   // }
      //   // connectWith: "#sortable,.sortable"
      //   // over: (event, ui) => {
      //   //   console.log(ui);
      //   //   ui.placeholder.next().css("color","blue")
      //   //   ui.item.css("color","green")
      //   // }
      // });

      $( ".sortable" ).droppable({
          drop: function( event, ui ) {

            window.setTimeout(rerender, 50); //probably not a very elegant solution

            function rerender() {
              console.log("hiihi");

              var root_poly = $(".math .base").first();

              tree = new TreeModel();

              math_root = tree.parse({});
              math_root.model.id = "0";
              math_root.model.obj = root_poly;

              parse_poly(math_root, root_poly, 0, true);


              let newmath = replace_in_mtstr(math_root, [], []);

              store.dispatch(Actions.addToHist(newmath, state.current_index+1))
            }

          }
      });
    }

    //CLICK/SELECT
    math_root.walk(function (node) {
      if (node.model.id !== "0" && node.type === type && getIndicesOf("/", node.model.id).length === depth) {
          // console.log("adding event", node);
          node.model.obj.off("click")
          node.model.obj.on("click", dispatch.bind(null, Actions.selectNode(node.model.id)));
          node.model.obj.css({"display":"inline-block"});
        }
    });
    //Draggable.create(".mord", {type:"x,y", edgeResistance:0.65, throwProps:true});
  }
  resetSelected() {
    this.selection.selected_nodes = [];
    this.selection.selected_text = "";
    this.math_root.walk(function (node) {
      if (node.selected) {
        node.selected = false;
        node.model.obj.removeClass("selected")
      }
    });
    this.selection.$selected = $(".selected");
    // selected_width = tot_width(this.selection.$selected, true);
    this.selection.selected_position = this.selection.$selected.offset();
    var replace_el = document.getElementById("replace");
    replace_el.value = this.selection.selected_text;
  }
  selectNode(nodeId, multi_select=false, var_select=false) {
    // console.log("selectNode");
    let math_root = this.math_root;
    let node = math_root.first(x => x.model.id === nodeId)
    let $this = node.model.obj;
    const thisComp = this;
    $this.toggleClass("selected");
    node.selected = !node.selected;
    if (!multi_select) {
      math_root.walk(function (node2) {
        if (node2.model.id !== node.model.id && node2.selected) {
          node2.selected = false;
          node2.model.obj.removeClass("selected")
        }
      });
    }
    if (!multi_select) {
      this.selection.selected_nodes = [];
    }
    if (var_select) {
      let thisComp = this;
      math_root.walk(function (node2) {
        let has_matching_children = false
        node2.walk(function (node3) {
          if (node3.model.id !== node2.model.id && node3.text === node.text) has_matching_children = true;
        });
        if (node2.model.id !== node.model.id && node2.text === node.text && !has_matching_children) {
          // console.log(node2.text, node2.selected);
          node2.selected = node.selected;
          if (node.selected) {
            node2.model.obj.addClass("selected");
            thisComp.selection.selected_nodes.push(node2);
          } else {
            node2.model.obj.removeClass("selected");
          }
        }
      });
    }
    this.selection.selected_text = "";
    this.selection.selected_nodes.push(node);
    // console.log(this.selection.selected_nodes);
    // this.selection.selected_text += node.text;
    math_root.walk(function (node) {
      if (node.selected) {thisComp.selection.selected_text += node.text;}
    });
    if (var_select) {
      thisComp.selection.selected_text = node.text;
    }
    thisComp.selection.$selected = $(".selected");
    // selected_width = tot_width(this.selection.$selected, true);
    thisComp.selection.selected_position = thisComp.selection.$selected.offset();
    var replace_el = document.getElementById("replace");
    replace_el.value = thisComp.selection.selected_text;
  }
  render() {
    return <p id={this.props.selected ? "math" : undefined} className="math" ref="math">...</p>
  }
}
Equation.contextTypes = {
  store: React.PropTypes.object
};
