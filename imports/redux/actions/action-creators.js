//action creator functions here

//update equation

// export const updateEq = (mathStr) => ({
//   type: 'UPDATE_EQUATION',
//   mathStr
// })

export const addToHist = (mathStr, index, eqIndex) => ({
  type: 'ADD_TO_HISTORY',
  mathStr,
  index,
  eqIndex
})

export const addToEqs = (eq) => ({
  type: 'ADD_TO_EQUATIONS',
  eq
})

export const updateIndex = (index) => ({
  type: 'UPDATE_INDEX',
  index
})

export const manipulate = (manip, manip_data = null) => ({
  type: 'MANIPULATION',
  manip,
  manip_data
})

export const updateSelect = (newSelectVars, resetMtype = false) => {
  if (resetMtype && typeof newSelectVars.mtype !== "undefined") {
    let newDepth;
    switch(newSelectVars.mtype) {
      case "factor":
        newDepth = 2
        break;
      case "term":
        newDepth = 1
        break;
      default:
        newDepth = 3
    }
    //this isn't very safe, as something wrong may be going to the state..
    newSelectVars.depth = newDepth;
  }
  return {type: 'UPDATE_SELECT', newSelectVars}
}

export const updateZoom = (newZoom) => ({
  type: 'UPDATE_ZOOM',
  newZoom
})

export const selectNode = (nodeId, mtype, depth) => ({
  type: 'SELECT_NODE',
  mtype,
  depth,
  nodeId
})

export const resetSelected = () => ({
  type: 'RESET_SELECTED'
})

export const updateSelectedText = (newText) => ({
  type: 'UPDATE_SELECTED_TEXT',
  newText
})

export const updateddmode = (newMode) => ({
  type: 'UPDATE_DRAGDROP_MODE',
  newMode
})

export const changeStepDuration = (newStepDur) => ({
  type: 'CHANGE_STEP_DURATION',
  newStepDur
})

export const selectEquation = (newEqIndex) => ({
  type: 'SELECT_EQUATION',
  newEqIndex
})

//RECORDING

export const beginRecording = () => ({
  type: 'BEGIN_RECORDING',
})

export const stopRecording = () => ({
  type: 'STOP_RECORDING',
})

export const beginPlaying = () => ({
  type: 'BEGIN_PLAYING',
})

export const stopPlaying = () => ({
  type: 'BEGIN_PLAYING',
})

// export const updateState = (state) => ({
//   type: 'UPDATE_STATE',
//   state
// })

export const loadRecording = (recObj) => ({
  type: 'LOAD_RECORDING',
  recObj
})
