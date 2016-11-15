import React from 'react';
import ReactDOM from 'react-dom';
import * as act from '../../../redux/actions/action-creators';

export default class Recording extends React.Component {
  constructor() {
    super();
    this.state = {playingIndex: 0};
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
        <button type="button" className="list-group-item" id="make_json">
          Save Recording
        </button>
        <button type="button" className="list-group-item" id="play" onClick={() => {
            thisComp.setState({playingIndex: 0});
            dispatch(act.beginPlaying())
          }}>
          Play
        </button>
        <button type="button" className="list-group-item" id="prev_step" onClick={() => {
            const { store } = this.context;
            const state = store.getState();
            if (state.recording.doingPlaying) {
              let newIndex = thisComp.state.playingIndex-1;
              if (newIndex >= 0) {
                thisComp.setState({playingIndex: newIndex});
                dispatch(act.updateState(state.recording.recordedStates[newIndex]));
              }
            }
          }}>
          Previous Step
        </button>
        <button type="button" className="list-group-item" id="next_step" onClick={() => {
            const { store } = this.context;
            const state = store.getState();
            if (state.recording.doingPlaying) {
              console.log(state.recording.recordedActions[thisComp.state.playingIndex]);
              dispatch(state.recording.recordedActions[thisComp.state.playingIndex]);
              let newIndex = thisComp.state.playingIndex+1;
              if (newIndex < state.recording.recordedActions.length) {
                thisComp.setState({playingIndex: newIndex});
              }
            }
          }}>
          Next Step
        </button>
      </div>
    )
  }
}

Recording.contextTypes = {
  store: React.PropTypes.object
};
