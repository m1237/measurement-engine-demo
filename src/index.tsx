import React from "react";
import ReactDOM from "react-dom/client";
import FrontendRoot from "./Frontend";
// import "bootstrap/dist/css/bootstrap.min.css";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { BrowserRouter } from "react-router-dom";
import './index.css'

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <FrontendRoot />
      </Provider>
    </BrowserRouter>
  </React.StrictMode>
);
