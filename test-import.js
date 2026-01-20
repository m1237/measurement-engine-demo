"use strict";
exports.__esModule = true;
var SubProcessHandler_1 = require("./src/SubProcessHandler");
//import FrontendRoot from 'C:/Users/muy23fs/Desktop/me_packaged_vs_code_2/measurement-engine-packaged/src/Frontend';
//import 'index';
var relativePathToExe = 'backend/gui.py';
var b = 3;
function delay(time) {
    return new Promise(function (resolve) { return setTimeout(resolve, time); });
}
//let a = Greeter
var backend = new SubProcessHandler_1["default"](relativePathToExe);
backend.startBackend();
//let frontendReactRootElement = FrontendRoot
//delay(10000).then(() => backend.shutdownBackend() ) 
