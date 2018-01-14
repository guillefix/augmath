import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom'

//Server API
import { createContainer } from 'meteor/react-meteor-data';
import { Recordings } from '../../api/collections.js';
import {loadRecording, beginPlaying} from '../../redux/actions/action-creators';
import { Meteor } from 'meteor/meteor';



class RecordingsList extends Component {
  render() {
    // console.log(this.props.equations);
    return (
          <div className="list-group">
            {this.props.recordings.map((rec) => (
              <RecordingEl key={rec._id} name={rec.name} recObj={rec.recObj}/>
            ))}
          </div>
    )
  }
}

RecordingsList.propTypes = {
  recordings: PropTypes.array.isRequired,
};

//RecordingsListComponent
export default createContainer(({query}) => {
  // console.log(query);
  let recs;
  if (query === "") {
    recs = [];
  } else {
    let regex = new RegExp(query,"g");
    recs = Recordings.find({name: regex}).fetch();
  }
  return {
    recordings: recs,
    currentUser: Meteor.user(),
  };
}, RecordingsList);


class RecordingEl extends React.Component {
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
    const { recObj } = this.props;
    const { store } = this.context;
    const { dispatch } = store;
    // console.log(this.props);
    // <PlainEq maths={this.props.mathStr} />
    return (
      <div className="equation-list" onMouseOver={this.showButtons.bind(this)} onMouseOut={this.hideButtons.bind(this)}>
        <span>{this.props.name}</span>
        <div className="list_rec_buttons" ref="buttons">
          <br/>
          <button type="button" className="btn btn-default" onClick={() => {
              dispatch(loadRecording(recObj));
              dispatch(beginPlaying());
            }}>
            <span className="glyphicon glyphicon-chevron-left"></span>
          </button>
        </div>
      </div>
    )
  }
}
RecordingEl.contextTypes = {
  store: React.PropTypes.object
};
