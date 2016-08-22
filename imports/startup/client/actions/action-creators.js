//action creator functions here

//update equation

// export const updateEq = (mathStr) => ({
//   type: 'UPDATE_EQUATION',
//   mathStr
// })

export const addToHist = (mathStr, index) => ({
  type: 'ADD_TO_HISTORY',
  mathStr,
  index
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
    newSelectVars.depth = newDepth;
  }
  return {type: 'UPDATE_SELECT', newSelectVars}
}

export const updateZoom = (newZoom) => ({
  type: 'UPDATE_ZOOM',
  newZoom
})

export const selectNode = (nodeId) => ({
  type: 'SELECT_NODE',
  nodeId
})

export const resetSelected = () => ({
  type: 'RESET_SELECTED'
})
