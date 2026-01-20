import React from 'react'
import ReactDOM from 'react-dom/client'
import styled from 'styled-components'
import LiveVisualization from "./container/liveVisualization/liveVisualization";
import SensorDropdownList from "./testAPI"

function LiveGraph() {

  
  const StyledIframe = styled.iframe`
  margin: 0;
  padding: 0;
  border: none;
  overflow: hidden;
`

  return (
    
    <LiveVisualization/>
    
  )}


  export default LiveGraph


