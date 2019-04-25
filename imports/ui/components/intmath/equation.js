import React from 'react';
import ReactDOM from 'react-dom';
import * as Actions from '../../../redux/actions/action-creators';

import * as manips from '../../../maths/manipulations.js';
import {tree_to_math_str, clear_math, select_node, parse_poly, tot_width, replace_in_mtstr, getIndicesOf, parse_mtstr, get_next, get_prev, get_all_prev, compare_trees} from "../../../maths/functions";
import TreeModel from '../../../TreeModel-min.js';
import "jquery-ui"
// var draggable = require( "jquery-ui/ui/widgets/draggable" );
import 'nestedSortable';
import katex from '../../../katex.min.js';
// import katex from '/imports/katex.min.js';
import classNames from 'classnames';


export default class Equation extends React.Component {
  constructor() {
    super();
    this.selection = {};
    this.shouldResetSelectedNodes = true;
  }
  componentDidMount() {
    console.log("mounting comp", this.props.index, this.props.math);
    const { store } = this.context;
    const thisComp = this
    const state = store.getState();
    this.unsubscribe = store.subscribe(this.doManip.bind(this));
    katex.render(this.props.math, this.math_el, { displayMode: true });
    this.updateTree();
    let $equals =  $(this.math_el).find(".base").find(".mrel");
    this.equals_position = $equals.offset();
    this.resetStyle();
    this.create_events();
  }
  componentDidUpdate(prevProps, prevState) {
    console.log("updating equation", this.props.index, this.props.math);
    const { store } = this.context;
    const state = store.getState();
    const dispatch = store.dispatch;
    this.unsubscribe();
    this.unsubscribe = store.subscribe(this.doManip.bind(this)); //rebinding

    //Drag and drop

    // let currentDD = store.getState().dragDrop;
    // function handleDDChange() {
    //   let nextDD = store.getState().dragDrop;
    //   if (nextDD !== currentDD) {
    //     console.log("changed drag-drop mode", currentDD, nextDD);
    //     currentDD = nextDD;
    //     this.create_events(this.props.mtype, this.props.depth);
    //   }
    // }

    // store.subscribe(handleDDChange.bind(this));

    //If math string is changed
    if (prevProps.math !== this.props.math ) { //|| prevProps.eqNum !== this.props.eqNum
      katex.render(this.props.math, this.math_el, { displayMode: true });
      this.updateTree();
      this.create_events();
    }
    if (prevProps.dragDrop !== this.props.dragDrop)
      this.create_events(this.props.mtype, this.props.depth);

    this.resetStyle();

    this.updateSelected()
  }
  create_events() {
    const { store } = this.context;
    const state = store.getState();
    const dispatch = store.dispatch;
    let math_root = this.math_root;
    let thisIndex = this.props.index
    // console.log("creating events", type,depth);
    let math_el = this.math_el;
    $(math_el).find("*").off();
    var  index;
    //DRAG AND DROP. Goes here because I should group stuff depending on which manipulative is selectable really

    // let dragDrop = state.dragDrop;
    //
    // if (dragDrop === "apply")
    // {
    //   $(math_el).find( ".draggable" ).draggable( "destroy" );
    //   $(math_el).find(".draggable").droppable( "destroy" );
    //   $(math_el).find(".draggable").removeClass("draggable");
    //   math_root.walk(function (node) {
    //     let obj;
    //     if (node.type === "rel" && node.parent.type !== "rel" && typeof node.parent.model.obj !== "undefined") {
    //       obj = node.parent.model.obj;
    //       // console.log("hello here", type, depth, obj);
    //       obj.data('root', node.parent)
    //       console.log(node.parent);
    //       obj.addClass("draggable")
    //       obj.draggable({
    //         revert: true
    //       });
    //       obj.droppable({
    //         drop: function( event, ui ) {
    //           //math_root is the one I am dropping onto, root is the one which I just dropped.
    //           let root = ui.draggable.data('root');
    //           console.log(root);
    //           let eqNode1 = root.first(x => x.type === "rel")
    //           let eqNode2 = math_root.first(x => x.type === "rel")
    //           let allPrev1 = get_all_prev(root, eqNode1);
    //           let tempNode1 = {children: allPrev1, type:"temp", type2: "temp"}
    //           let allPrev2 = get_all_prev(math_root, eqNode2);
    //           let tempNode2 = {children: allPrev2, type:"temp", type2: "temp"}
    //           let comp = compare_trees(tempNode1, tempNode2)
    //           console.log(comp)
    //           if (comp.same
    //             && !(comp.subs.length === 1
    //               && comp.subs[0][0].model.id.split("/").length < 4
    //               && root.children[1].type === "rel")) {
    //             console.log("comp.subs",comp.subs);
    //             let nodes = [];
    //             let texts = [];
    //             for (var i = 0; i < comp.subs.length; i++) {
    //               let node = comp.subs[i][0];
    //               let subText = comp.subs[i][1].text;
    //               thisComp.selectNode(node.model.id, false, true, root, false);
    //               nodes = [ ...nodes, ...thisComp.selection.selected_nodes];
    //               let tempTexts = thisComp.selection.selected_nodes.map(x => subText);
    //               texts = [ ...texts, ...tempTexts];
    //               console.log("nodes, texts",i, nodes, texts);
    //             }
    //             let relText = math_root.first(node => node.type === "rel").text;
    //             let newLHS = replace_in_mtstr(root, nodes, texts).split("=")[1];
    //             let oldRHS = math_root.text.split(relText)[1];
    //             dispatch(Actions.addToHist(newLHS+relText+oldRHS, state.current_index+1, thisIndex))
    //           }
    //           else if (root.children[1].type === "rel") { // only one term on LHS
    //             console.log("second type of apply");
    //             let varText = root.text.split("=")[0];
    //             let newText = root.text.split("=")[1];
    //             // dispatch(Actions.updateSelect({var_select: true}))
    //             let node = math_root.first(node => node.text === varText);
    //             thisComp.selectNode(node.model.id, false, true, math_root, false);
    //             // dispatch(Actions.selectNode(node.model.id));
    //             // console.log(node);
    //             console.log(thisComp.selection.selected_nodes);
    //             let texts = thisComp.selection.selected_nodes.map(x => newText);
    //             let newStr = replace_in_mtstr(math_root, thisComp.selection.selected_nodes, texts);
    //             // dispatch(Actions.selectNode(node.model.id))
    //             dispatch(Actions.addToHist(newStr, state.current_index+1, thisIndex))
    //           }
    //         }
    //       });
    //     }
    //   });
    // }
    //
    // if (dragDrop === "subs")
    // {
    //   console.log("hi")
    //   // console.log($(math_el).find( ".draggable" ));
    //   $(math_el).find( ".draggable" ).draggable( "destroy" );
    //   $(math_el).find(".draggable").droppable( "destroy" );
    //   $(math_el).find(".draggable").removeClass("draggable");
    //   math_root.walk(function (node) {
    //     let obj;
    //     // console.log(node);
    //     if (node.type === type && node.model.id.split("/").length === depth+1 && typeof node.model.obj !== "undefined") {
    //       obj = node.model.obj;
    //       // console.log("hello here", type, depth, obj);
    //       obj.data('node', node)
    //       obj.addClass("draggable")
    //       obj.draggable({
    //         revert: true
    //       });
    //       obj.droppable({
    //         drop: function( event, ui ) {
    //           let node = $( this ).data('node');
    //           let text = ui.draggable.data('node').text;
    //           console.log("dropping", node);
    //           thisComp.selectNode(node.model.id, false, true, math_root,false);
    //           let n = thisComp.selection.selected_nodes.length;
    //           let newStr = replace_in_mtstr(math_root, thisComp.selection.selected_nodes, thisComp.selection.selected_nodes.map(x=>text));
    //           // dispatch(Actions.selectNode(node.model.id))
    //           dispatch(Actions.addToHist(newStr, state.current_index+1, thisIndex))
    //         }
    //       });
    //     }
    //   });
    // }
    //
    // if (dragDrop === "move")
    // {
    //   $(math_el).find( ".draggable" ).draggable( "destroy" );
    //   $(math_el).find(".draggable").droppable( "destroy" );
    //   $(math_el).find(".draggable").removeClass("draggable");
    //   $(math_el).find(".sortable").sortable("destroy")
    //   $(math_el).find(".sortable").removeClass("sortable")
    //   $(math_el).find( ".sortable" ).disableSelection();
    //   math_root.walk(function (node) {
    //
    //     let obj;
    //     // console.log("hello here", type, depth);
    //     if (node.type === type && node.model.id.split("/").length === depth+1 && typeof node.model.obj !== "undefined") {
    //       node.model.obj.data('node', node)
    //       // console.log(node.parent.parent);
    //       if (type === "factor") {
    //         obj = node.model.obj.parent();
    //         obj.addClass("sortable")
    //         obj.sortable({
    //           forceHelperSize: true,
    //           placeholder: "sortable-placeholder",
    //           connectWith: ".sortable"
    //         });
    //       } else if (type === "term") {
    //         obj = node.model.obj.parent();
    //         obj.addClass("sortable")
    //         obj.sortable({
    //           forceHelperSize: true,
    //           placeholder: "sortable-placeholder",
    //           connectWith: ".sortable",
    //           helper(e, item) {
    //             // console.log(item);
    //             // console.log(e);
    //             let term_objs = item.data('node').model.obj.clone();
    //             let helper_obj = $("<span></span>").append(term_objs);
    //             helper_obj.data('node',item.data('node'));
    //             return helper_obj
    //           },
    //           start(e, ui) {
    //             ui.item.data('node').model.obj.css("display", "none");
    //           },
    //           stop(e, ui) {
    //             let node = ui.item.data('node');
    //             let elements = node.model.obj.clone(true).css("display", "inherit");
    //             // console.log(elements, ui.item.prev());
    //             // let item = ui.item.prev();
    //             node.model.obj.not(ui.item).remove();
    //             if (node.type === "term" && ui.item.next().length > 0 && ui.item.next().text() !== "+" && ui.item.next().text() !== "-" && ui.item.next().text() !== "=") {
    //               $('<span class="mbin ui-sortable-handle" style="display: inline-block;">+</span>').insertAfter(ui.item)
    //               ui.item.after(elements);
    //               ui.item.remove();
    //             } else if (node.type === "term" && ui.item.prev().length > 0 && ui.item.text() !== "+" && ui.item.text() !== "-" && ui.item.text() !== "=") {
    //               $('<span class="mbin ui-sortable-handle" style="display: inline-block;">+</span>').insertAfter(ui.item)
    //               ui.item.next().after(elements);
    //               ui.item.remove();
    //             } else {
    //               ui.item.after(elements);
    //               ui.item.remove();
    //             }
    //             let new_math_str = tree_to_math_str(math_el);
    //             dispatch(Actions.addToHist(new_math_str, state.current_index+1, thisIndex))
    //           }
    //         });
    //       }
    //     }
    //   });
    //
    //   $( ".sortable" ).droppable({
    //       drop: function( event, ui ) {
    //
    //         window.setTimeout(rerender, 50); //probably not a very elegant solution
    //
    //         function rerender() {
    //           console.log("hiihi");
    //
    //           var root_poly = $(".math .base").first();
    //
    //           tree = new TreeModel();
    //
    //           math_root = tree.parse({});
    //           math_root.model.id = "0";
    //           math_root.model.obj = root_poly;
    //
    //           parse_poly(math_root, root_poly, 0, true);
    //
    //
    //           let newmath = replace_in_mtstr(math_root, [], []);
    //
    //           store.dispatch(Actions.addToHist(newmath, state.current_index+1, parseInt(node.model.id.split('/')[0])))
    //         }
    //
    //       }
    //   });
    // }

    //CLICK/SELECT
    math_root.walk(function (node) {
        let depth = getIndicesOf("/", node.model.id).length;
        node.model.obj.on("click", dispatch.bind(null, Actions.selectNode(node.model.id, node.type, depth)));
        node.model.obj.css({"display":"inline-block"});
    });
  }
  resetStyle() {
    let math_el = this.math_el;

    //setting zoom
    // $(math_el).css("font-size", this.props.eqZoom.toString()+"px");

    // $(math_el).css("height", "100%")

    //repositioning equals so that it's always in the same place. put in fixed value
    let root_poly = $(math_el).find(".base");
    let $equals = root_poly.children(".mrel");
    if ($equals.length !== 0) {
      $(math_el).css("left","0px", "top", "0px");
      let new_equals_position = $equals.offset();
      // console.log("hi", this.props.index, this.equals_position, new_equals_position);
      let h_eq_shift = this.equals_position.left-new_equals_position.left
      let v_eq_shift = this.equals_position.top-new_equals_position.top
      $(math_el).css("left",h_eq_shift.toString()+"px", "top", v_eq_shift.toString()+"px");
    }
  }
  updateTree() {
    const { store } = this.context;
    const state = store.getState();
    let math_root;

    let math_el = this.math_el;
    let root_poly = $(math_el).find(".base");

    let tree = new TreeModel();

    math_root = tree.parse({});
    math_root.model.id = this.props.index.toString();
    math_root.model.obj = root_poly;

    parse_poly(math_root, root_poly, this.props.index, true);

    this.math_root = math_root;
  }
  doManip() {
    const { store } = this.context;
    let math_root = this.math_root;
    const state = store.getState();
    if (state.doing_manip && state.mathHist[state.current_index].current_eq === this.props.index)
    {
      console.log("doing Manip", state.manip, this.selection.selected_nodes);
      let promise, eqCoords = {};

      //useful variables
      let vars = {};

      eqCoords.beginning_of_equation = math_root.children[0].model.obj.offset();
      let width_last_term = tot_width(math_root.children[math_root.children.length-1].model.obj, true, true);
      eqCoords.end_of_equation = math_root.children[math_root.children.length-1].model.obj.offset();
      eqCoords.end_of_equation.left += width_last_term;
      eqCoords.equals_position = this.equals_position;

      vars.eqCoords = eqCoords;
      vars.$equals =  $(this.math_el).find(".base").find(".mrel");

      vars.math_root = this.math_root;
      vars.selection = this.selection;
      vars.step_duration = state.step_duration;
      vars.mathStr = this.props.math;

      if (state.manip === "replace" && this.selection.selected_nodes.length > 0) {
        promise = manips[state.manip].call(vars, state.manip_data, state.replace_ind || state.var_select);
      } else if (state.manip === "flip_equation") {
        promise = manips[state.manip].call(vars, this.props.math);
      } else if (state.manip === "add_both_sides") {
        promise = manips[state.manip].call(vars, state.manip_data, this.props.math);
      } else if (this.selection.selected_nodes.length > 0){
        promise = manips[state.manip].call(vars);
      }
      if (typeof promise !== "undefined") {
        promise.catch(err=>{
          console.log("manip failed", err);
          let index = state.current_index;
          store.dispatch(Actions.addToHist(state.equations[state.current_eq], index, state.current_eq));
        }).then((data) => {
          let mathstr = data.math_str
          let nodeId = data.selected_node
          console.log("going to update equation", data);
          let index = state.current_index;
          store.dispatch(Actions.addToHist(mathstr, ++index, state.current_eq));
          store.dispatch(Actions.selectNode(nodeId));
        })
      } else {
        console.log("manip failed");
        let index = state.current_index;
        store.dispatch(Actions.addToHist(state.equations[state.current_eq], index, state.current_eq));
      }
    }
  }
  var_select(nodeId, math_root = this.math_root) {
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
  updateSelected(math_root = this.math_root) {
    math_root.walk(function (node) {
        node.selected = false;
        node.model.obj.removeClass("selected");
      })

    this.selection.selected_text = "";
    this.selection.selected_nodes = []

    for (let nodeId of this.props.selectedNodes) {
      let node = math_root.first(n => n.model.id === nodeId)
      node.selected = true;
      node.model.obj.addClass("selected");
      this.selection.selected_nodes.push(node)
    }

    for (let nodeId of this.props.selectedNodes.sort()) {
      let node = math_root.first(n => n.model.id === nodeId)
      this.selection.selected_text += node.text;
    }

    this.selection.$selected = $(".selected");
    this.selection.selected_position = this.selection.$selected.offset();

  }
  handleClick() {
    const { store } = this.context;
    const state = store.getState();
    if ( state.mathHist[state.current_index].current_eq !== this.props.index) {
      const { dispatch } = store;
      dispatch(Actions.selectEquation(this.props.index))
    }
  }
  render() {
    const { selected } = this.props;
    return <div className={classNames({"selected-equation" : selected })} onClick={this.handleClick.bind(this)}>
      <p ref={(p) => this.math_el = p} className="math">...</p>
    </div>
  }
}
Equation.contextTypes = {
  store: React.PropTypes.object
};
