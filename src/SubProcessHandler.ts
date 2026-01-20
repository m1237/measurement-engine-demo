import {spawn, exec} from 'child_process'
import kill from 'tree-kill'
import { join } from 'path';


export default class MeasurementEngineBackend {

    private readonly relativePathToExe = '../backend/gui.py';
    private readonly realtivePathToVenv = '../backend/venv/Scripts/activate.bat';

    private readonly relativePathToExeWhenPackaged = '/../app.asar.unpacked/node_modules/@viavr/measurement-engine/backend/gui.py'
    private readonly relativePathToVenvWhenPackaged = '/../app.asar.unpacked/node_modules/@viavr/measurement-engine/backend/venv/Scripts/activate.bat'


    private startedInSuperVisorMonitor: boolean
    private isPackaged: boolean
    private appPath:string
    private child: any

    public constructor(startedInSuperVisorMonitor: boolean, isPackaged: boolean, appPath?: string) {
        
        this.startedInSuperVisorMonitor = startedInSuperVisorMonitor
        this.isPackaged = isPackaged
        this.appPath = appPath!
    }

    public startBackend(){
        const appPath = this.isPackaged ? this.appPath : __dirname; // Get the directory of the currently executing script (Electron app)

        let venvPath = join(appPath, this.isPackaged ? this.relativePathToVenvWhenPackaged : this.realtivePathToVenv);
        let exePath = join(appPath, this.isPackaged ? this.relativePathToExeWhenPackaged : this.relativePathToExe);     

        const command = `${venvPath} && python ${exePath} --startedInSuperVisor ${this.startedInSuperVisorMonitor} --packagedProject ${this.isPackaged}`; //we want to add a the boolean as this argument tells the backend code that it runs in the supervisor-monitor

        //before we can trigger the python script we need to activate the virutal environment ('venv') first       
        this.child = spawn(command, {
            shell: true
          })
        

        this.child.stdout.on('data', (data: any) => console.log(`stdout: ${data}`))
        this.child.stderr.on('data', (data: any) => console.error(`stderr: ${data}`))
        this.child.on('close', (code: any) => console.log(`child process exited with code ${code}`))
    }

    public shutdownBackend(){
        kill(this.child.pid, 'SIGKILL', function(err) {
            console.log('ERR: ' + err)
        });
        //kill(this.child.pid)
        console.log('Killed PID: ' + this.child.pid)
    }
}

