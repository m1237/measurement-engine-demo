import React from "react";
//import Jumbotron from 'react-bootstrap/Jumbotron';
import Navbar from "./component/navbar/navbar";
import { Route, Routes, useNavigate } from "react-router-dom";
import LiveVisualization from "./container/liveVisualization/liveVisualization";
import SensorDropdownList from "./testAPI"

const FrontendRoot: React.FC = () => {
  const navigate = useNavigate();
  return (
    <>
      <Routes>
        <Route path="/" element={<Navbar startedInSuperVisorMonitor={false} />} />
        <Route path="Live_visualization" element={<LiveVisualization />} />
      </Routes>
    </>
  );
};

export default FrontendRoot;
