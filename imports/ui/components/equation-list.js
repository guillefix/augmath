import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom'
import PlainEq from './plain-eq'

//Server API
import { createContainer } from 'meteor/react-meteor-data';
import { Equations } from '../../api/equations.js';
import {addToEqs} from '../../redux/actions/action-creators';
import { Meteor } from 'meteor/meteor';



class EquationList extends Component {
  render() {
    console.log(this.props.equations);
    return (
      <div className="list-group">
      {this.props.equations.map((eq) => (
        <EqListEl key={eq._id} mathStr={eq.math} />
      ))}
    </div>
    )
  }
}

EquationList.propTypes = {
  equations: PropTypes.array.isRequired,
};

export default EquationListComponent = createContainer(({query}) => {
  // console.log(query);
  let eqs;
  if (query === "") {
    eqs = [];
  } else {
    let regex = new RegExp(query,"g");
    eqs = Equations.find({ $or: [{name: regex}, {math: regex}] }).fetch();
  }
  return {
    equations: eqs,
    currentUser: Meteor.user(),
  };
}, EquationList);


class EqListEl extends React.Component {
  componentDidMount(){
    $(ReactDOM.findDOMNode(this.refs.buttons)).hide()
  }
  showButtons() {
    $(ReactDOM.findDOMNode(this.refs.buttons)).show()
  }
  hideButtons() {
    $(ReactDOM.findDOMNode(this.refs.buttons)).hide()
  }
  render() {
    const { mathStr } = this.props;
    const { store } = this.context;
    const { dispatch } = store;
    // console.log(this.props);
    return (
      <div className="equation-list" onMouseOver={this.showButtons.bind(this)} onMouseOut={this.hideButtons.bind(this)}>
        <PlainEq maths={this.props.mathStr} />
        <div className="list_eq_buttons" ref="buttons">
          <br/>
          <button type="button" className="btn btn-default" onClick={dispatch.bind(null, addToEqs(mathStr))}>
            <span className="glyphicon glyphicon-chevron-left"></span>
          </button>
          &nbsp; Latex: <input size="20" value={this.props.mathStr} readOnly={true}/>
        </div>
      </div>
    )
  }
}
EqListEl.contextTypes = {
  store: React.PropTypes.object
};
