import React from 'react';
import ReactDOM from 'react-dom';
import Tools from '../components/tools/tools.js';
import EquationsPanel from './equations-panel.js';
import MathInput from '../components/intmath/mathinput.js';
import MQInput from '../components/intmath/mqinput.js';
import MathArea from '../components/intmath/matharea.js';
import Toolbar from '../components/tools/toolbar.js';
import * as Actions from '../actions/action-creators';

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
    //Boilerplate
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

    //Key controls
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
