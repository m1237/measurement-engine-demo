"use strict";
exports.__esModule = true;
var child_process_1 = require("child_process");
require("tree-kill");
var MeasurementEngineBackend = /** @class */ (function () {
    function MeasurementEngineBackend(relativeFilePath) {
        this.relativeExecutablePath = relativeFilePath;
    }
    MeasurementEngineBackend.prototype.startBackend = function () {
        //before we can trigger the python script we need to activate the virutal environment ('venv') first       
        this.child = (0, child_process_1.spawn)('backend\\venv\\Scripts\\activate.bat && python', [process.cwd() + '\\' + this.relativeExecutablePath], {
            shell: true
        });
        this.child.stdout.on('data', function (data) { return console.log("stdout: ".concat(data)); });
        this.child.stderr.on('data', function (data) { return console.error("stderr: ".concat(data)); });
        this.child.on('close', function (code) { return console.log("child process exited with code ".concat(code)); });
    };
    MeasurementEngineBackend.prototype.shutdownBackend = function () {
        var kill = require('tree-kill');
        kill(this.child.pid);
        console.log('Killed PID: ' + this.child.pid);
    };
    return MeasurementEngineBackend;
}());
exports["default"] = MeasurementEngineBackend;
