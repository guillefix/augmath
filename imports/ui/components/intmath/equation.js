import React from 'react';
import ReactDOM from 'react-dom';
import * as Actions from '../../../redux/actions/action-creators';

import * as manips from '../../../maths/manipulations.js';
import {clear_math, select_node, parse_poly, tot_width, replace_in_mtstr, getIndicesOf, parse_mtstr, get_next, get_prev, get_all_prev, compare_trees} from "../../../maths/functions";
import TreeModel from '../../../TreeModel-min.js';
import 'nestedSortable';
import katex from 'katex';
import classNames from 'classnames';


export default class Equation extends React.Component {
  constructor() {
    super();
    this.selection = {};
  }
  componentDidMount() {
    console.log("mounting comp", this.props.index, this.props.math);
    const { store } = this.context;
    const state = store.getState();
    this.unsubscribe = store.subscribe(this.doManip.bind(this));
    katex.render(this.props.math, this.math_el, { displayMode: true });
    this.updateTree();
    let $equals =  $(this.math_el).find(".base").find(".mrel");
    this.equals_position = $equals.offset();
    this.resetStyle();
    this.create_events(this.props.mtype, this.props.depth);
  }
  doManip() {
    // console.log(this);
    const { store } = this.context;
    let math_root = this.math_root;
    const state = store.getState();
    if (state.doing_manip && state.mathHist[state.current_index].current_eq === this.props.index)
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
      vars.step_duration = state.step_duration;
      vars.mathStr = this.props.math;
      vars.$equals =  $(this.math_el).find(".base").find(".mrel");

      if (state.manip === "replace" && this.selection.selected_nodes.length > 0) {
        promise = manips[state.manip].call(vars, state.manip_data, state.replace_ind);
      } else if (state.manip === "flip_equation") {
        promise = manips[state.manip].call(vars, this.props.math);
      } else if (state.manip === "add_both_sides") {
        promise = manips[state.manip].call(vars, state.manip_data, this.props.math);
      } else if (this.selection.selected_nodes.length > 0){
        promise = manips[state.manip].call(vars);
      }
      if (typeof promise !== "undefined") {
        promise.then((data) => {
          console.log("going to update equation", data);
          let index = state.current_index;
          store.dispatch(Actions.addToHist(data, ++index));
        })
      }
    }
  }
  componentDidUpdate(prevProps, prevState) {
    console.log("updating equation", this.props.index, this.props.math);
    // let math_el = ReactDOM.findDOMNode(this.refs.math);

    const { store } = this.context;
    const state = store.getState();

    this.unsubscribe();
    this.unsubscribe = store.subscribe(this.doManip.bind(this)); //rebinding

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
    if (prevProps.mtype !== this.props.mtype || prevProps.depth !== this.props.depth)
      this.create_events(this.props.mtype, this.props.depth);

    this.resetStyle();

    //update selected nodes
    if (selNum === 0) {
      this.resetSelected();
    } else {
      for (var i = 0; i < selNum; i++) {
        let node = this.props.selectedNodes[i];
        if (prevProps.selectedNodes.indexOf(node) === -1)
          this.selectNode(node, state.multi_select, state.var_select)
      }
    }
  }
  updateTree() {
    const { store } = this.context;
    const state = store.getState();
    let math_root;

    let math_el = this.math_el;
    let root_poly = $(math_el).find(".base");

    tree = new TreeModel();

    math_root = tree.parse({});
    math_root.model.id = this.props.index.toString();
    math_root.model.obj = root_poly;

    parse_poly(math_root, root_poly, this.props.index, true);

    this.math_root = math_root;
  }
  resetStyle() {
    let math_el = this.math_el;

    //setting zoom
    $(math_el).css("font-size", this.props.eqZoom.toString()+"px");

    $(math_el).css("height", "100%")

    //repositioning equals so that it's always in the same place. put in fixed value
    let root_poly = $(math_el).find(".base");
    let $equals = root_poly.find(".mrel");
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
              // let root = $( this ).data('root');
              let root = ui.draggable.data('root');
              console.log(root);
              let eqNode1 = root.first(x => x.type === "rel")
              let eqNode2 = math_root.first(x => x.type === "rel")
              let allPrev1 = get_all_prev(root, eqNode1);
              let tempNode1 = {children: allPrev1, type:"temp", type2: "temp"}
              let allPrev2 = get_all_prev(math_root, eqNode2);
              let tempNode2 = {children: allPrev2, type:"temp", type2: "temp"}
              let comp = compare_trees(tempNode1, tempNode2)
              if (comp.same) {
                console.log(comp.subs);
                let nodes = [];
                let texts = [];
                for (var i = 0; i < comp.subs.length; i++) {
                  let node = comp.subs[i][0];
                  let subText = comp.subs[i][1].text;
                  thisComp.selectNode(node.model.id, false, true, root);
                  nodes = [ ...nodes, ...thisComp.selection.selected_nodes];
                  let tempTexts = thisComp.selection.selected_nodes.map(x => subText);
                  texts = [ ...texts, ...tempTexts];
                }
                let newLHS = replace_in_mtstr(root, nodes, texts).split("=")[1];
                let oldRHS = math_root.text.split("=")[1];
                dispatch(Actions.addToHist(newLHS+"="+oldRHS, state.current_index+1, node.model.id.split('/')[0]))
              }
              else if (root.children[1].type === "rel") {
                console.log("second type of apply");
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

    if (dragDrop === "subs")
    {
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
              // console.log(node);
              thisComp.selectNode(node.model.id, false, true);
              let n = thisComp.selection.selected_nodes.length;
              let newStr = replace_in_mtstr(math_root, thisComp.selection.selected_nodes, thisComp.selection.selected_nodes.map(x=>text));
              // dispatch(Actions.selectNode(node.model.id))
              dispatch(Actions.addToHist(newStr, state.current_index, node.model.id.split('/')[0]))
            }
          });
        }
      });
    }

    //SORTABLE
    if (dragDrop === "move")
    {
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
  selectNode(nodeId, multi_select=false, var_select=false, math_root = this.math_root) {
    console.log("selectNode", nodeId, multi_select);
    // let math_root = this.math_root;
    let node = math_root.first(x => x.model.id === nodeId)
    let $this = node.model.obj;
    console.log($this);
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


//OLD STUFF IN create_events

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
