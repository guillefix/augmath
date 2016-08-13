import React from 'react';
import ReactDOM from 'react-dom';
import Tools from './tools.js';
import katex from 'katex';
import EquationsPanel from './equations-panel.js';
import * as manips from '../../maths/manipulations.js';
import * as hist from './history';
import {select_node, remove_events, parse_poly, tot_width, replace_in_mtstr, getIndicesOf, parse_mtstr} from "../../maths/functions";
import {add_to_history, active_in_history, remove_from_history} from "./history.js"
import TreeModel from '../../TreeModel-min.js';
import 'nestedSortable';

//these objects hold some useful variables used in the (still not pure functions) functions in manipulations.js and functions.js

export let eqCoords = {};
eqCoords.equals_position = {left: 0, top: 100};

export let selection = {};

selection.$selected = $();
selection.selected_nodes = [];
selection.selected_text = "";

export default class App extends React.Component {
  constructor() {
    super();
    this.update = this.update.bind(this);
    this.updateState = this.updateState.bind(this);
    this.updateSelect = this.updateSelect.bind(this);
    this.prepare = this.prepare.bind(this);
    this.state = {
      mathStr:"\\frac{v^{2}}{r}=\\frac{GMm}{r^{2}}",
      manip: "term",
      depth: 1,
      multi_select: false,
      var_select: false,
      replace_ind: false,
      current_index: 0,
      eqZoom: 14};
  }
  update(newStr, render) {
    this.setState({mathStr: newStr})
    if (render) this.prepare(newStr)
  }
  updateState(obj) {
    this.setState(obj);
  }
  componentDidUpdate(prevProps, prevState) {
    remove_events(prevState.manip, prevState.depth);
    // window.manip = this.state.manip;
    // window.depth = this.state.depth;
    // window.multi_select = this.state.multi_select;
    // window.var_select = this.state.var_select;
    window.replace_ind = this.state.replace_ind;
    this.create_events(this.state.manip, this.state.depth)
  }
  updateSelect(resetManip = false) {
    newManip = ReactDOM.findDOMNode(this.toolsPane.manipSelect).value;
    newDepth = parseInt(ReactDOM.findDOMNode(this.toolsPane.depthSelect).value);
    remove_events(this.state.manip, this.state.depth);
    if (resetManip) {
      switch(newManip) {
        case "factor":
          newDepth = 2
          break;
        case "term":
          newDepth = 1
          break;
        default:
          newDepth = 3
      }
    }
    this.create_events(newManip, newDepth);
    this.setState({manip: newManip, depth: newDepth});
  }
  componentDidMount() {
    // let manip_el = $("#manip");
    // let depth_el = $("#depth");
    // this.math_str_el = $("#MathInput input");
    // console.log(this.math_str_el);
    this.refs.MathInput.math_str_el.hide();
    //initial render
    let initial_math_str = "\\frac{v^{2}}{r}=\\frac{GMm}{r^{2}}";
    this.prepare(initial_math_str)
    window.prepare = this.prepare.bind(this)
    window.prepare = this.prepare.bind(this)
    let thisApp = this;
    $(document).on( "keyup", function (e) { //right
        if (e.keyCode == 39) {
          if (selection.selected_nodes && selection.selected_nodes.length > 0) {
            let index = parseInt(selection.selected_nodes[0].model.id.split("/")[selection.selected_nodes[0].model.id.split("/").length-1]); //no +1 because the tree index is 1 based not 0 based
              let new_node = selection.selected_nodes[0].parent.children[index] || undefined;
              if (new_node) {
                if (new_node.type !== selection.selected_nodes[0].type) {
                  thisApp.setState({manip:new_node.type});
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
                  thisApp.setState({manip:new_node.type});
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
              remove_events(manip, depth);
              let new_node = selection.selected_nodes[0].children[0];
              thisApp.setState({manip:new_node.type, depth:++thisApp.state.depth});
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
              thisApp.setState({manip:new_node.type, depth:--thisApp.state.depth});
              select_node(new_node, thisApp.state.multi_select, thisApp.state.var_select);
            }
          }
        }
    });

    $(document).on( "keyup", function (e) { //ctrl+m for multiselect
        if (e.keyCode == 77 && e.ctrlKey) {
          $("#multi_select").prop("checked", !thisApp.state.multi_select);
          thisApp.setState({multi_select: !thisApp.state.multi_select});
          console.log(thisApp.state.multi_select);
        }
    });
  }
  prepare(math) {
    this.setState({mathStr: math})
    //this function prepares and renders the function with LaTeX, it also calls parse_poly to create the tree
    math = math.replace(/\\frac{}/g, "\\frac{1}")
          // .replace(/ /g, "") some operators require the space, for exampl a \cdot b
          .replace(/\+/g, '--').replace(/(--)+-/g, '-').replace(/--/g, '+')
          .replace(/\(\+/g, "(")
          .replace(/^\+/, "")
          .replace(/=$/, "=0")
          .replace(/=+/, "=")
          .replace(/0\+/g, "")
          .replace(/0-/g, "-")
          .replace(/^=/, "0=")
          .replace(/\^{}/g, "");

    var math_el = document.getElementById("math");
    katex.render(math, math_el, { displayMode: true });
    // console.log(math);
    this.refs.MathInput.math_str_el.val(math);
    mathquill.latex(math);

    var root_poly = $("#math .base");

    tree = new TreeModel();

    window.math_root = tree.parse({});
    // console.log(math_root);
    math_root.model.id = "0";
    //KaTeX offers MathML semantic elements on the HTML, could that be used?

    parse_poly(math_root, root_poly, 0, true);

    math_root.walk(function (node) {
      if (node.type2 === "frac" && node.children[1].text === "") {prepare(replace_in_mtstr(node, node.children[0].text));}
    });

    if (!this.state.playing) {
      if (this.state.current_index < math_str.length) {
        remove_from_history(this.state.current_index);
        math_str[this.state.current_index] = math;
        add_to_history(this.state.current_index, this.state.current_index-1);
      } else {
        this.state.current_index = math_str.push(math)-1;
        add_to_history(this.state.current_index, this.state.current_index-1);
      }
    }

    active_in_history(this.state.current_index);

    if (this.state.recording) {
      var ids = [];
      for (var i=0; i<selection.selected_nodes.length; i++) {
        ids.push(selection.selected_nodes[i].model.id);
      }
      selection.selected_nodes_id_rec.push(ids);
      math_str_rec.push(math);
    }

    this.create_events(this.state.manip, this.state.depth, this.state.multi_select, this.state.var_select);

    {/*repositioning equals so that it's always in the same place. put in fixed value.*/}
    window.$equals = $("#math .base").find(".mrel");
    if ($equals.length !== 0) {
      eqCoords.new_equals_position = $equals.offset();
      if (eqCoords.equals_position.left !== 0) {h_eq_shift += eqCoords.equals_position.left-eqCoords.new_equals_position.left;}
      if (eqCoords.equals_position.top !== 0) {v_eq_shift += eqCoords.equals_position.top-eqCoords.new_equals_position.top;}
      math_el.setAttribute("style", "left:"+h_eq_shift.toString()+"px;"+"top:"+v_eq_shift.toString()+"px;");
      eqCoords.equals_position = $equals.offset();
    }
    {/*useful variables*/}
    eqCoords.beginning_of_equation = math_root.children[0].model.obj.offset();
    // eqCoords.width_last_term = tot_width(math_root.children[math_root.children.length-1].model.obj, true, true);
    eqCoords.end_of_equation = math_root.children[math_root.children.length-1].model.obj.offset();
    eqCoords.end_of_equation.left += eqCoords.width_last_term;

    $(math_el).css("font-size", this.state.eqZoom.toString()+"px")
  }
  create_events(type, depth) {
    // console.log("creating events", type,depth);
    var  index;
    //reset stuff
    math_root.walk(function (node) {
      node.selected = false;
    });
    $(".selected").removeClass("selected");
    selection.selected_nodes = [];
    selection.selected_text = "";
    //DRAG AND DROP. Goes here because I should group stuff depending on which manipulative is selectable really
    $(".base").attr('id', 'sortable');
    math_root.walk(function (node) {
        if (node.type === "factor" && node.model.id.split("/").length === 6) {
          // console.log(node.parent.parent);
          let obj = node.parent.parent.model.obj;
          obj.addClass("sortable")
          obj.sortable({
            forceHelperSize: true,
            placeholder: "sortable-placeholder",
            connectWith: "#sortable,.sortable"
          });
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
    let thisApp = this;
    $( "#sortable,.sortable" ).droppable({
        drop: function( event, ui ) {

          window.setTimeout(rerender, 100); //probably not a very elegant solution

          function rerender() {
            var root_poly = $("#math .base");

            tree = new TreeModel();

            math_root = tree.parse({});
            math_root.model.id = "0";
            //KaTeX offers MathML semantic elements on the HTML, could that be used?

            parse_poly(math_root, root_poly, 0, true);

            let newmath = parse_mtstr(math_root, [], []);

            thisApp.prepare(newmath);
          }

        }
    });
    math_root.walk(function (node) {
      if (node.model.id !== "0" && node.type === type && getIndicesOf("/", node.model.id).length === depth) {
          // console.log(node);
          node.model.obj.off("click")
          node.model.obj.on("click", function() {select_node(node, thisApp.state.multi_select, thisApp.state.var_select);});
          node.model.obj.css({"display":"inline-block"});
        }
    });
    //Draggable.create(".mord", {type:"x,y", edgeResistance:0.65, throwProps:true});
  }
  updateZoom(e) {
    // this.refs.toolsPane.refs.zoomslider
    this.setState({eqZoom: e.target.value})
    // console.log(e.target.value);
    $("#math").css("font-size", e.target.value.toString()+"px")
  }
  render() {
    return (
      <div>
        <div className="col-md-3 toolbar">
          <Tools updateZoom={this.updateZoom.bind(this)} ref={(ref) => this.toolsPane = ref} state={this.state} updateState={this.updateState} updateSelect={this.updateSelect} manip={this.state.manip} depth={this.state.depth} />
        </div>
        <div className="col-md-6">
          <Toolbar />
          <MathInput ref="MathInput" mathStr={this.state.mathStr} update={this.update}/>
          <MathArea />
        </div>
        <div className="col-md-3">
          <EquationsPanel />
        </div>
      </div>
    );
  }
}

class Toolbar extends React.Component {
  render() {
    return (
      <div className="row">
  			<div className="bottom-buffer btn-toolbar" role="toolbar">
      			  <div className="btn-group">
      			    <button id="tb-undo" className="btn btn-default" onClick={hist.undo}>Undo</button>
      			    <button id="tb-redo" className="btn btn-default" onClick={hist.redo}>Redo</button>
      			  </div>
      			<button type="button" className="btn btn-default " id="tb-flip_equation" onClick={manips.flip_equation}>
  					Flip equation
  				  </button>
  				<button type="button" className="btn btn-default " id="tb-change_side" onClick={manips.change_side}>
  					Change side
  				</button>

  				<div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-move_up" onClick={manips.move_up}>
  							<span className="glyphicon glyphicon-arrow-up"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_left" onClick={manips.move_left}>
  						<span className="glyphicon glyphicon-arrow-left"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_right" onClick={manips.move_right}>
  						<span className="glyphicon glyphicon-arrow-right"></span>
  					</button>
  					<button type="button" className="btn btn-default" id="tb-move_down" onClick={manips.move_down}>
  							<span className="glyphicon glyphicon-arrow-down"></span>
  					</button>
  				</div>

  				<div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-distribute-in" onClick={manips.distribute_in}>
  						Distribute in
  					</button>
  					<button type="button" className="btn btn-default" id="tb-collect-out" onClick={manips.collect_out}>
  						Collect out
  					</button>
  				</div>

          <div className="btn-group">
  					<button type="button" className="btn btn-default" id="tb-split" onClick={manips.split}>
  						Split out
  					</button>
  					<button type="button" className="btn btn-default" id="tb-merge" onClick={manips.merge}>
  						Merge in
  					</button>
  				</div>
          <br />
          <br />
  				<button type="button" className="btn btn-default" id="tb-eval" onClick={manips.evaluate}>
  					Evaluate/Simplify
  				</button>
  				<button type="button" className="btn btn-default" id="tb-operate" onClick={manips.operate}>
  					Operate
  				</button>
          <button type="button" className="btn btn-default" id="tb-cancel-out" onClick={manips.cancel_out}>
  					Cancel out
  				</button>
  			</div>
  		</div>
    );
  }
}

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
  }
  render() {
    return (
      <div className="row">
  			<p id="MathInput">Input some equation (<a id="show_latex" onClick={this.toggleLatexInput.bind(this)}>show LaTeX</a>): &nbsp;
          <MQInput mathStr={this.props.mathStr} update={this.props.update}/>
          &nbsp;
          <input size="50" ref="latexInput" value={this.props.mathStr}
            onChange={() => {this.props.update(this.latexStr())}}
            onKeyUp={(e) =>{if (e.keyCode == 13) this.props.update(this.props.mathStr, true)}}/>
          &nbsp;
          <button type="button" className="btn btn-default" id="keep">
  					Keep
  			  </button>
  			</p>
  		</div>
    )
  }
}

class MQInput extends React.Component {
  mqlatex() {
    return mathquill.latex().replace(/[^\x00-\x7F]/g, "")
      .replace(/\^([a-z0-9])/g, "^{$1}")
      .replace(/\\left/g, "")
      .replace(/\\right/g, "")
  }
  shouldComponentUpdate(nextProps, nextState) {
    return this.mqlatex() !== nextProps.mathStr
  }
  render() {
    if (mathquill) mathquill.latex(this.props.mathStr)
    return (
      <span id="mathquill"
        onKeyUp={(e) => {
          if (e.keyCode == 13) this.props.update(this.mqlatex(), true)
          else this.props.update(this.mqlatex(), false) }}>...</span>
    );
  }
  componentDidMount() {
    let MQ = MathQuill.getInterface(2);
    window.mathquill = MQ.MathField($('#mathquill')[0]);
    mathquill.latex(this.props.mathStr)
  }
}

class MathArea extends React.Component {
  render() {
    return (
      <div className="row">
        <div className="math-container">
  				<p id="math">...</p>
  			</div>
      </div>
    )
  }
}
