import React from "react";
//import Jumbotron from 'react-bootstrap/Jumbotron';
import Navbar from "./component/navbar/navbar";
import { Provider } from "react-redux";
import { store } from "./redux/store";

const FrontendRoot: React.FC = () => {
  return (
    <>
    <Provider store={store}>
        <Navbar startedInSuperVisorMonitor={true}/>
    </Provider>
    </>
  );
};

export default FrontendRoot;