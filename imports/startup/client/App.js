import React from 'react';
import ReactDOM from 'react-dom';
import Tools from './tools.js';
import katex from 'katex';
import EquationsPanel from './equations-panel.js';
import * as manips from '../../maths/manipulations.js';
import {clear_math, select_node, parse_poly, tot_width, replace_in_mtstr, getIndicesOf, parse_mtstr} from "../../maths/functions";
import TreeModel from '../../TreeModel-min.js';
import 'nestedSortable';
import * as Actions from './actions/action-creators';

//these objects hold some useful variables used in the (still not pure functions) functions in manipulations.js and functions.js

export let selection = {};

selection.$selected = $();
selection.selected_nodes = [];
selection.selected_text = "";

export default class App extends React.Component {
  constructor() {
    super();
    this.update = this.update.bind(this);
    let init_math_str = "\\frac{v^{2}}{r}=\\frac{GMm}{r^{2}}+3abcd";
    this.state = {
      mathStr: init_math_str,
      mtype: "term",
      depth: 1,
      eqZoom: 14};
  }
  update(newStr) {
    this.setState({mathStr: newStr})
  }
  componentDidUpdate(prevProps, prevState) {
    this.create_events(this.state.mtype, this.state.depth)
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
          mathStr: state.mathHist[state.current_index],
          eqZoom: state.eqZoom})
      }
    })
    this.create_events(this.state.mtype, this.state.depth)

    $(document).on( "keyup", function (e) { //right
        if (e.keyCode == 39) {
          if (selection.selected_nodes && selection.selected_nodes.length > 0) {
            let index = parseInt(selection.selected_nodes[0].model.id.split("/")[selection.selected_nodes[0].model.id.split("/").length-1]); //no +1 because the tree index is 1 based not 0 based
              let new_node = selection.selected_nodes[0].parent.children[index] || undefined;
              if (new_node) {
                if (new_node.type !== selection.selected_nodes[0].type) {
                  dispatch(Actions.updateSelect({mtype:new_node.type}));
                }
                select_node(new_node, thisApp.state.multi_select, thisApp.state.var_select);
              }
            }
        }
    });
    $(document).on( "keyup", function (e) { //left
        if (e.keyCode == 37) {
          if (selection.selected_nodes && selection.selected_nodes.length > 0) {
            var index = parseInt(selection.selected_nodes[0].model.id.split("/")[selection.selected_nodes[0].model.id.split("/").length-1])-2;
              let new_node = selection.selected_nodes[0].parent.children[index] || undefined;
              if (new_node) {
                if (new_node.type !== selection.selected_nodes[0].type) {
                  dispatch(Actions.updateSelect({mtype:new_node.type}));
                }
                select_node(new_node, thisApp.state.multi_select, thisApp.state.var_select);
              }
            }
        }
    });
    $(document).on( "keyup", function (e) { //down
        if (e.keyCode == 40) {
          if (selection.selected_nodes && selection.selected_nodes.length > 0) {
            if (selection.selected_nodes[0].children.length > 0) {
              let new_node = selection.selected_nodes[0].children[0];
              const state = store.getState();
              dispatch(Actions.updateSelect({mtype:new_node.type, depth:++state.depth}));
              select_node(new_node, thisApp.state.multi_select, thisApp.state.var_select);
            }
          }
        }
    });
    $(document).on( "keyup", function (e) { //up
        if (e.keyCode == 38) {
          if (selection.selected_nodes && selection.selected_nodes.length > 0) {
            if (selection.selected_nodes[0].parent !== math_root) {
              let new_node = selection.selected_nodes[0].parent;
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
  create_events(type, depth) {
    const { store } = this.context;
    const state = store.getState();
    console.log("creating events", type,depth);
    $("#math .base").off();
    var  index;
    //reset stuff
    math_root.walk(function (node) {
      node.selected = false;
    });
    $(".selected").removeClass("selected");
    selection.selected_nodes = [];
    selection.selected_text = "";
    //DRAG AND DROP. Goes here because I should group stuff depending on which manipulative is selectable really
    // $(".base").attr('id', 'sortable');
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
              let elements = ui.item.data('node').model.obj.clone().css("display", "inherit");
              ui.item.after(elements);
              ui.item.data('node').model.obj.remove();
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

          window.setTimeout(rerender, 100); //probably not a very elegant solution

          function rerender() {
            var root_poly = $("#math .base");

            tree = new TreeModel();

            math_root = tree.parse({});
            math_root.model.id = "0";
            math_root.model.obj = root_poly;
            //KaTeX offers MathML semantic elements on the HTML, could that be used?

            parse_poly(math_root, root_poly, 0, true);

            let newmath = parse_mtstr(math_root, [], []);

            store.dispatch(Actions.addToHist(newmath, state.current_index+1))
          }

        }
    });
    math_root.walk(function (node) {
      if (node.model.id !== "0" && node.type === type && getIndicesOf("/", node.model.id).length === depth) {
          // console.log(node);
          node.model.obj.off("click")
          node.model.obj.on("click", function() {select_node(node, state.multi_select, state.var_select);});
          node.model.obj.css({"display":"inline-block"});
        }
    });
    //Draggable.create(".mord", {type:"x,y", edgeResistance:0.65, throwProps:true});
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
          <MathArea eqZoom={this.state.eqZoom} mathStr={this.state.mathStr}/>
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
          <button type="button" className="btn btn-default" id="keep">
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
  componentDidMount() {
    const { store } = this.context;
    store.subscribe(() => {
      const state = store.getState();
      const thisComp = this;
      if (state.doing_manip) {
        //useful variables
        let promise, eqCoords = {};

        let vars = {};

        eqCoords.beginning_of_equation = math_root.children[0].model.obj.offset();
        let width_last_term = tot_width(math_root.children[math_root.children.length-1].model.obj, true, true);
        eqCoords.end_of_equation = math_root.children[math_root.children.length-1].model.obj.offset();
        eqCoords.end_of_equation.left += width_last_term;
        eqCoords.equals_position = thisComp.equals_position;

        vars.eqCoords = eqCoords;

        if (state.manip === "replace") {
          promise = manips[state.manip](state.manip_data, state.replace_ind);
        } else if (state.manip === "flip_equation") {
          promise = manips[state.manip](state.mathHist[state.current_index]);
        } else if (state.manip === "add_both_sides") {
          promise = manips[state.manip](state.manip_data, state.mathHist[state.current_index]);
        } else {
          promise = manips[state.manip].call(vars);
        }
        promise.then((data) => {
          console.log("going to update equation", data);
          let index = state.current_index;
          store.dispatch(Actions.addToHist(data, ++index));
        })
      } else {
        thisComp.updateMath(state.mathHist[state.current_index]);
      }
    });
    this.equals_position = {top: 0, left: 0}
    this.h_eq_shift = 0;
    this.v_eq_shift = 0;
    this.updateMath(this.props.mathStr)
  }
  updateMath(math) {
    const { store } = this.context;
    const state = store.getState();

    math = clear_math(math);

    let math_el = ReactDOM.findDOMNode(this.refs.math);
    katex.render(math, math_el, { displayMode: true });

    var root_poly = $("#math .base");

    tree = new TreeModel();

    window.math_root = tree.parse({});
    math_root.model.id = "0";
    math_root.model.obj = root_poly;

    parse_poly(math_root, root_poly, 0, true);

    let thisComp = this;

    // if (this.state.recording) {
    //   var ids = [];
    //   for (var i=0; i<selection.selected_nodes.length; i++) {
    //     ids.push(selection.selected_nodes[i].model.id);
    //   }
    //   selection.selected_nodes_id_rec.push(ids);
    //   math_str_rec.push(math);
    // }

    //setting zoom
    $(math_el).css("font-size", this.props.eqZoom.toString()+"px");

    //repositioning equals so that it's always in the same place. put in fixed value
    window.$equals = $("#math .base").find(".mrel");
    if ($equals.length !== 0) {
      this.new_equals_position = $equals.offset();
      // console.log(this.new_equals_position, this.equals_position);
      if (this.equals_position.left !== 0) {this.h_eq_shift += this.equals_position.left-this.new_equals_position.left;}
      if (this.equals_position.top !== 0) {this.v_eq_shift += this.equals_position.top-this.new_equals_position.top;}
      // console.log("KEKS", this.h_eq_shift, this.v_eq_shift);
      $(math_el).css("left",this.h_eq_shift.toString()+"px", "top", this.v_eq_shift.toString()+"px");
      this.equals_position = $equals.offset();
    }

  }
  // componentDidUpdate(prevProps, prevState) {
  //   // let math_el = ReactDOM.findDOMNode(this.refs.math);
  //   this.updateMath(this.props.mathStr);
  // }
  render() {
    return (
      <div className="row">
        <div className="math-container">
  				<p ref="math" id="math">...</p>
  			</div>
      </div>
    )
  }
}
MathArea.contextTypes = {
  store: React.PropTypes.object
};
