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
    this.create_events(this.props.mtype, this.props.depth);
  }
  componentDidUpdate(prevProps, prevState) {
    console.log("updating equation", this.props.index, this.props.math);
    // let math_el = ReactDOM.findDOMNode(this.refs.math);

    const { store } = this.context;
    const state = store.getState();
    const dispatch = store.dispatch;
    this.unsubscribe();
    this.unsubscribe = store.subscribe(this.doManip.bind(this)); //rebinding

    //Drag and drop

    let currentDD = store.getState().dragDrop;
    function handleDDChange() {
      let nextDD = store.getState().dragDrop;
      if (nextDD !== currentDD) {
        console.log("changed drag-drop mode", currentDD, nextDD);
        currentDD = nextDD;
        this.create_events(this.props.mtype, this.props.depth);
      }
    }

    store.subscribe(handleDDChange.bind(this));

    //reset selected
    let selNum = this.props.selectedNodes.length;
    //If math string is changed
    // console.log(this.props.index, prevProps.math, this.props.math);
    if (prevProps.math !== this.props.math ) { //|| prevProps.eqNum !== this.props.eqNum
      katex.render(this.props.math, this.math_el, { displayMode: true });
      this.updateTree();
      this.create_events(this.props.mtype, this.props.depth);
    }
    if (prevProps.dragDrop !== this.props.dragDrop || prevProps.depth !== this.props.depth)
      this.create_events(this.props.mtype, this.props.depth);

    this.resetStyle();

    //update selected nodes
    if (selNum === 0 && this.shouldResetSelectedNodes) {
      this.resetSelected();
    } else if (this.shouldResetSelectedNodes){
      console.log(prevProps.selectedNodes,this.props.selectedNodes);
      for (var i = 0; i < selNum; i++) {
        let node = this.props.selectedNodes[i];
        if (prevProps.selectedNodes.indexOf(node) === -1) {
          this.selectNode(node, state.multi_select, state.var_select)
        }
      }
      if (state.multi_select) {
        for (var i = 0; i < prevProps.selectedNodes.length; i++) {
          let node = prevProps.selectedNodes[i];
          if (this.props.selectedNodes.indexOf(node) === -1)
          this.selectNode(node, state.multi_select, state.var_select)
        }
      }
    } else {
      console.log("doing this.shouldResetSelectedNodes = true;");
      //this is just for some cases where the state says we should change
      //the selected nodes, but we don't want for some reason (see this.selectNode)
      //like when updating varSelects after moving with keyboard.
      this.shouldResetSelectedNodes = true;
      let nodes = []
      for (var i = 0; i < this.selection.selected_nodes.length; i++) {
        let nodeId = this.selection.selected_nodes[i].model.id;
        nodes = [...nodes, nodeId];
      }
      this.resetSelected();
      for (var i = 0; i < nodes.length; i++) {
        let nodeId = nodes[i];
        dispatch(Actions.selectNode(nodeId))
      }
    }
  }
  create_events(type, depth) {
    const { store } = this.context;
    const state = store.getState();
    const dispatch = store.dispatch;
    let math_root = this.math_root;
    let thisComp = this;
    let thisIndex = this.props.index
    console.log("creating events", type,depth);
    let math_el = this.math_el;
    $(math_el).find("*").off();
    var  index;
    //DRAG AND DROP. Goes here because I should group stuff depending on which manipulative is selectable really
    // $(".base").attr('id', 'sortable');

    let dragDrop = state.dragDrop;

    if (dragDrop === "apply")
    {
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
              //math_root is the one I am dropping onto, root is the one which I just dropped.
              let root = ui.draggable.data('root');
              console.log(root);
              let eqNode1 = root.first(x => x.type === "rel")
              let eqNode2 = math_root.first(x => x.type === "rel")
              let allPrev1 = get_all_prev(root, eqNode1);
              let tempNode1 = {children: allPrev1, type:"temp", type2: "temp"}
              let allPrev2 = get_all_prev(math_root, eqNode2);
              let tempNode2 = {children: allPrev2, type:"temp", type2: "temp"}
              let comp = compare_trees(tempNode1, tempNode2)
              console.log(comp)
              if (comp.same
                && !(comp.subs.length === 1
                  && comp.subs[0][0].model.id.split("/").length < 4
                  && root.children[1].type === "rel")) {
                console.log("comp.subs",comp.subs);
                let nodes = [];
                let texts = [];
                for (var i = 0; i < comp.subs.length; i++) {
                  let node = comp.subs[i][0];
                  let subText = comp.subs[i][1].text;
                  thisComp.selectNode(node.model.id, false, true, root, false);
                  nodes = [ ...nodes, ...thisComp.selection.selected_nodes];
                  let tempTexts = thisComp.selection.selected_nodes.map(x => subText);
                  texts = [ ...texts, ...tempTexts];
                  console.log("nodes, texts",i, nodes, texts);
                }
                let newLHS = replace_in_mtstr(root, nodes, texts).split("=")[1];
                let oldRHS = math_root.text.split("=")[1];
                dispatch(Actions.addToHist(newLHS+"="+oldRHS, state.current_index+1, thisIndex))
              }
              else if (root.children[1].type === "rel") {
                console.log("second type of apply");
                let varText = root.text.split("=")[0];
                let newText = root.text.split("=")[1];
                // dispatch(Actions.updateSelect({var_select: true}))
                let node = math_root.first(node => node.text === varText);
                thisComp.selectNode(node.model.id, false, true, math_root, false);
                // dispatch(Actions.selectNode(node.model.id));
                // console.log(node);
                console.log(thisComp.selection.selected_nodes);
                let texts = thisComp.selection.selected_nodes.map(x => newText);
                let newStr = replace_in_mtstr(math_root, thisComp.selection.selected_nodes, texts);
                // dispatch(Actions.selectNode(node.model.id))
                dispatch(Actions.addToHist(newStr, state.current_index+1, thisIndex))
              }
            }
          });
        }
      });
    }

    if (dragDrop === "subs")
    {
      console.log("hi")
      // console.log($(math_el).find( ".draggable" ));
      $(math_el).find( ".draggable" ).draggable( "destroy" );
      $(math_el).find(".draggable").droppable( "destroy" );
      $(math_el).find(".draggable").removeClass("draggable");
      math_root.walk(function (node) {
        let obj;
        // console.log(node);
        if (node.type === type && node.model.id.split("/").length === depth+1 && typeof node.model.obj !== "undefined") {
          obj = node.model.obj;
          // console.log("hello here", type, depth, obj);
          obj.data('node', node)
          obj.addClass("draggable")
          obj.draggable({
            revert: true
          });
          obj.droppable({
            drop: function( event, ui ) {
              let node = $( this ).data('node');
              let text = ui.draggable.data('node').text;
              console.log("dropping", node);
              thisComp.selectNode(node.model.id, false, true, math_root,false);
              let n = thisComp.selection.selected_nodes.length;
              let newStr = replace_in_mtstr(math_root, thisComp.selection.selected_nodes, thisComp.selection.selected_nodes.map(x=>text));
              // dispatch(Actions.selectNode(node.model.id))
              dispatch(Actions.addToHist(newStr, state.current_index+1, thisIndex))
            }
          });
        }
      });
    }

    if (dragDrop === "move")
    {
      $(math_el).find( ".draggable" ).draggable( "destroy" );
      $(math_el).find(".draggable").droppable( "destroy" );
      $(math_el).find(".draggable").removeClass("draggable");
      $(math_el).find(".sortable").sortable("destroy")
      $(math_el).find(".sortable").removeClass("sortable")
      $(math_el).find( ".sortable" ).disableSelection();
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
                let new_math_str = tree_to_math_str(math_el);
                dispatch(Actions.addToHist(new_math_str, state.current_index+1, thisIndex))
              }
            });
          }
        }
      });

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

              store.dispatch(Actions.addToHist(newmath, state.current_index+1, parseInt(node.model.id.split('/')[0])))
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

      vars.math_root = this.math_root;
      vars.selection = this.selection;
      vars.step_duration = state.step_duration;
      vars.mathStr = this.props.math;
      vars.$equals =  $(this.math_el).find(".base").find(".mrel");

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
          console.log("going to update equation", data);
          let index = state.current_index;
          store.dispatch(Actions.addToHist(data, ++index, state.current_eq));
        })
      } else {
        console.log("manip failed");        
        let index = state.current_index;
        store.dispatch(Actions.addToHist(state.equations[state.current_eq], index, state.current_eq));
      }
    }
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
    // var replace_el = document.getElementById("replace");
    // replace_el.value = this.selection.selected_text;
    // const { store } = this.context;
    // const dispatch = store.dispatch;
    // dispatch(Actions.updateSelectedText(""));
  }
  selectNode(nodeId, multi_select=false, var_select=false, math_root = this.math_root, mayUpdateSelect=true) {
    //if  mayUpdateSelect is false, then we keep changes "local", i.e. we don't dispatch with Redux.
    console.log("selectNode", nodeId, multi_select, var_select);
    // let math_root = this.math_root;
    const thisComp = this;
    let node = math_root.first(x => x.model.id === nodeId)

    if ((node.type !== this.props.mtype || getIndicesOf("/", node.model.id).length !== this.props.depth)
    && mayUpdateSelect) {
      multi_select = false;
    }

    if (typeof node === "undefined") return;
    let $this = node.model.obj;
    // console.log($this);
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
    if (node.selected) this.selection.selected_nodes.push(node);    
    // console.log("node.text",node.text);
    if (var_select) {
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
    
    math_root.walk(function (node) {
      if (node.selected) {thisComp.selection.selected_text += node.text;}
    });
    if (var_select) {
      thisComp.selection.selected_text = node.text;
    }
    thisComp.selection.$selected = $(".selected");
    // selected_width = tot_width(this.selection.$selected, true);
    thisComp.selection.selected_position = thisComp.selection.$selected.offset();

    
    const { store } = thisComp.context;
    const dispatch = store.dispatch;
    if (mayUpdateSelect) dispatch(Actions.updateSelectedText(thisComp.selection.selected_text));

    //////this.shouldResetSelectedNodes = false; will mean that we can change the varSelects, without
    //reseting the selectedNodes;
    //if the node is of a different type (caused by navigating the eq with arrows for instance),
    //then change type first and then select
    //we have math_root === thisComp.math_root because the drag&drop triggers this otherwise
    if ((node.type !== this.props.mtype || getIndicesOf("/", node.model.id).length !== this.props.depth)
      && mayUpdateSelect) {
      console.log("doing this.shouldResetSelectedNodes = false;");
      let varSelects = {depth: getIndicesOf("/", node.model.id).length, mtype: node.type};
      $this.toggleClass("selected");
      thisComp.shouldResetSelectedNodes = false;
      dispatch(Actions.updateSelect(varSelects))
    }
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
    // return <span className={classNames({"selected-equation" : selected })} onClick={this.handleClick.bind(this)}>
    //   <span ref={(p) => this.math_el = p} className="math">...</span>
    // </span>
    return <div className={classNames({"selected-equation" : selected })} onClick={this.handleClick.bind(this)}>
      <p ref={(p) => this.math_el = p} className="math">...</p>
    </div>
  }
}
Equation.contextTypes = {
  store: React.PropTypes.object
};
