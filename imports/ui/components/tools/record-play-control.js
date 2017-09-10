import React from 'react';
import ReactDOM from 'react-dom';
import * as act from '../../../redux/actions/action-creators';
import { Recordings } from '../../../api/collections.js';


export default class RecordPlayControl extends React.Component {
  constructor() {
    super();
    this.state = {playingIndex: 0, showSaveRec: false};
  }
  hideSaveRec() {
    this.setState({ showSaveRec: false })
  }
  componentDidMount() {
    const { store } = this.context;
    store.subscribe(()=>{
      state = store.getState();
      let recordingEl = ReactDOM.findDOMNode(this.refs.recording);
      if (state.recording.doingRecording !== recordingEl.checked) {
        recordingEl.checked = !recordingEl.checked;
      }
    })
  }

  render() {
    const { store } = this.context;
    const state = store.getState();
    const dispatch = store.dispatch;
    const thisComp = this;
    return (
      <div>
        <h4>Recording</h4>
        <div>
          <li className="list-group-item">
            <input type="checkbox" ref="recording" name="recording" id="recording" onChange={(e)=>{
                if (e.target.checked) {
                  dispatch(act.beginRecording())
                } else {
                  dispatch(act.stopRecording())
                }
              }
            }/><label htmlFor="recording">Recording</label>
          </li>
          <button type="button" className="list-group-item" id="make_json" onClick={() => {
              thisComp.setState({ showSaveRec: true })
            }}>
            Save Recording
          </button>
          { this.state.showSaveRec ? <SaveRecording hideMe={this.hideSaveRec.bind(this)}/> : null }
          <button type="button" className="list-group-item" id="play" onClick={() => {
              const { store } = this.context;
              const state = store.getState();
              if (!state.recording.doingPlaying) {
                thisComp.setState({playingIndex: 0});
                dispatch(act.beginPlaying())
              } else {
                thisComp.setState({playingIndex: 0});
                dispatch(act.stopPlaying())
              }
            }}>Stop / Play
          </button>
          <button type="button" className="list-group-item" id="prev_step" onClick={() => {
              const { store } = this.context;
              const state = store.getState();
              if (state.recording.doingPlaying) {
                let actions = state.recording.recordedActions;
                let idx = thisComp.state.playingIndex-2;
                while (idx >0 && actions[idx].type !== "MANIPULATION" && actions[idx].type !== "ADD_TO_HISTORY") idx--;
                if (actions[idx].type === "MANIPULATION" || actions[idx].type === "ADD_TO_HISTORY") {
                  idx++;
                  thisComp.setState({playingIndex: idx});
                }
                dispatch(act.updateIndex(state.current_index-1));
              }
            }}>
            Previous Step
          </button>
          <button type="button" className="list-group-item" id="next_step" onClick={() => {
              const { store } = this.context;
              const state = store.getState();
              if (state.recording.doingPlaying) {
                console.log(state.recording.recordedActions[thisComp.state.playingIndex]);
                let newIndex = thisComp.state.playingIndex+1;
                if (newIndex <= state.recording.recordedActions.length) {
                  dispatch(state.recording.recordedActions[thisComp.state.playingIndex]);
                  thisComp.setState({playingIndex: newIndex});
                }
              }
            }}>
            Next Step
          </button>
        </div>
      </div>
    )
  }
}

RecordPlayControl.contextTypes = {
  store: React.PropTypes.object
};

class SaveRecording extends React.Component {
  handleSubmit(e) {
    e.preventDefault();
    const name = ReactDOM.findDOMNode(this.refs.name).value.trim();
    const { store } = this.context;
    const state = store.getState();
    Recordings.insert({
      name,
      recObj: state.recording,
      owner: Meteor.userId(),
      username: Meteor.user().username,
      createdAt: new Date(), // current time
    });
    ReactDOM.findDOMNode(this.refs.name).value = '';
    this.props.hideMe();
  }
  render() {
    return (
      <form onSubmit={this.handleSubmit.bind(this)}>
        <label htmlFor="save-rec-name">Name: </label>
        <input type="text" className="form-control" ref="name" id="save-rec-name" placeholder="Add description..." />
        <div className="tags-input">Tags (comming soon) </div>
        <br/>
        <div id="save-rec-submit">
          <input type="submit" className="btn btn-primary" value="Submit"/> &nbsp;
            <button className="btn btn-default" onClick={(e)=>{
                e.preventDefault();
                this.props.hideMe();
              }}>Cancel</button>
        </div>
      </form>
    )
  }
}
SaveRecording.contextTypes = {
  store: React.PropTypes.object
};
