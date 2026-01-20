# measurement-engine-packaged

## Structure

- The python backend is located in `/backend`. It contains the raw python code of the measurement engine without dependencies
- The react-frontend is located in `/src`. It contains the `index.tsx` file that is the entry point when for the react frontend when the measurement-engine is started standalone.
- When started as part of the supervisor-monitor the frontend is splitted into the user-interface and the live-visualization. The user-interface is located in `FrontendRootSupervisor.tsx` and the LiveVisualzation in `LiveGraph.tsx`
- Before the overall integration into to the supervisor monitor can happen, the .ts and .tsx files need to be translated to .js. This translation happens automatically when the app is installed. It can also be triggered manually via `npm run compile`. It takes the scripts from the `/src` folder and creates a .js version of these scripts in the `/lib` folder.


## Install - Standalone

- Prerequisites:
    - node.js version 16.x.x
    - python 3.9.6

- You need to have node installed. We work with node version 16.x.x. You can consider using a [node-version manager](https://github.com/coreybutler/nvm-windows) to handel different node versions
- locate your terminal at the root directory: `npm install`
- it will install the package and run the scripts that are defined for `install` in `package.json`
- important is the line `python -m venv backend/venv && backend\venv\Scripts\activate.bat && pip install -r backend/requirements.txt`
- it creates a virtual envrironment `venv` in the python backend and then activates this evironment and then installs all the dependencies that are defined in the `requirements.txt` in the pyhthon backend
- Note: We are expecting the user to have python 3.9.6 installed as the standard python version that is used when the `python + filePath` command is triggered. You can check your version with `python -V`

## Starting measurement-engine-packaged in a standalone version

- The measurement-engine has the particularity that it is intended to function both as a stand-alone programme and as part of the supervisor-monitor
- To start 'measurement-engine-packaged' as a standalone version go to the root and `npm start`
- I will start the Frontend/React application defined by `lib/index.js` (starting frontend) and at the same time start the backend via the script `lib/runAppStandalone.js` (starting backend). Note that both these scripts have their counterparts in the `/src` folder. This process is defined in `package.json`
- The frontend should automatically show up in the browser on `localhost:3004`. When you look into you terminal you should also see the messages from the measuement-engine running on `localhost:5005`. Alternativeley you can try to reach `localhost:5005` via your browser.
- When you hit Ctrl+C in the terminal, both the front- and the backend should stop. However, there were sometimes issues with ending the backend. When problems occur it might be the case that the backend was not shutdown properly. To be sure, you could also see if you can reach 'localhost:5005' in you browser. If you can still reach it you have to shut down the process by hand via the terminal -> `netstat -ano | findstr :5005` and `taskkill /PID <id> /F`
- if you want to just start the frotend/react components then take the command `npm run start:frontend`

### Starting the Backend (details - usually not relevant)

- For starting the backend one has to instantiate a `MeasurementEngineBackend`. The class is defined in `SubProcessHandler.ts`.
- The `MeasurementEngineBackend` object  get a boolean as an argument. If you are using the backend standalone you can provide `false`. If you use it together with the supervisor monitor you have to provide a `true`
- To start the backend, one has to call the `startBackend()` function of the `MeasurementEngineBackend` object
- It uses the [`child_process`](https://nodejs.org/api/child_process.html#child_processspawncommand-args-options) module of node.js
- The 'spwan' function creates the child process in which the backend lives in. What is important to note here is that the virtual environment `venv` is activated in the same child process. First the correct path to the activation file of the virtual envrionment is triggered (activate.bat), then the command is triggered that starts the python application -> `python + relativePathToExecutable`
- The `shutdownBackend()` function of `MeasurementEngineBackend` kills the child process
- The `runAppStandalone.ts` script shows how this very simple procedure works by creating the `MeasurementEngineBackend` object and later killing it when the node process is interupted
- The measurement-engine is also aware whether it was started in the supervisor-monitor or not. At the end of the python command there is a boolean added tha denotes whether it was started in supervisor-monitor or not


### Publishing a new version

- In order to update the supervisor-monitor with a newer version of the measurement-engine you have to publish the version on the package registry
- Make sure you are logged in at the package registry. [Documentation](https://gitlab.informatik.uni-wuerzburg.de/GE/Dev/ViaVR/components/package-registry#how-to-publish-packages-staff-only)
- Then you have to update the version-number in `package.json`. Have a look at [semantic versioning](https://docs.npmjs.com/about-semantic-versioning) for node packages
- `npm publish`
- Navigate to the `package.json` of the `web-based-supervisor-monitor` and update its dependency of the measurement-engine to the version you just published
- When you do a `npm install` it should install the updated version of the `measurement-engine` in its `node_modules` folder

### Connect the supervisor monitor to a unity instance

- Before testing the supervisor-monitor you have to set it up with a Unity instance
- Clone [this](https://gitlab2.informatik.uni-wuerzburg.de/GE/Dev/ViaVR/components/unity-supervisor-monitor-integration) project and open it with the correct uniy version (2021.2.0f1)
- Open one of the scenes in `Samples/VIA-VR Supervisor Monitor/0.1.0-preview1` (should work for each of the three examples - was tested with StreamExample)
- Run the scene, then run the suprvisor-monitor
- In the supervisor-monitor the unity instance should appear, click on conect and confirm the connection in Unity

## ~~Connecting with the supervisor monitor / The overall VIA-VR integration~~

- The relevant repo of the supervisor monitor is located here: https://gitlab2.informatik.uni-wuerzburg.de/GE/Dev/ViaVR/components/web-based-supervisor-monitor
- The relevant branch is the `hci-integration` branch
- Clone the repo into the same parent folder
- Locate your terminal to the root of `measurement-engine-packaged` project and `npm run compile` to trigger the compile script
- This should add a `lib` directory to the project that contains javascript versions of the .ts/.tsx files that are located in the `src`
- Locate your terminal to the root of the supervisor monitor and `npm install`
- This should also install the measurement-engine-packaged. If not that do it manually with `npm i ../measurements-engine-packaged` to install the measurement-engine as a node module
- Changes that you make in the `measurement-engine-packaged` repo should automatically be transferred to its installation in the superivsor-montitor in `web-based-supervisor-monitor/node_modules/measurement-engine-packaged`
- In the web-based-superivsor-monitor the following files are relevant:
    - In `backend/main.ts` there is the init function that should also start the backend of the measurement engine -> `measurementEngine.startBackend()`
    - In `frontened/src/Components/PanelView/GraphSettings.tsx` is where the UI of the measurement engine is located. Usually we just have to place a reference to the root-componen of our GUI here (defined in `measurement-engine-packaged/lib/Frontend.js` / `measurement-engine-packaged/src/Frontend.tsx`)
    - In `frontened/src/Components/PanelView/Graph.tsx` is where the live visualization is embedded (used to be the dashapp but will change to the new reacts solution)
- When you are referencing things from the `measurement-engine-packaged` then always take the reference from the javascript files in the `lib` folder
- To run and test everything locate your terminal to the root folder of the web-based supervisor monitor and do `npm start`
- Attention: The default view of the supervisor monitor first requried you to connect to a Unity session which is (right now) not relevant for the integration of the measuremen-engine. You can change the default view to the panel view where you can see the measuremen engine frontend(s). To do this, go to `web-based-supervisor-monitor/backend/MainWindow.ts` and change the line `loadPage(MainWindow.window, 'index')` to `loadPage(MainWindow.window, 'panel-view')`
- When ending the application, you have to close the frontend window to trigger the process that shuts down the servers. If you just hit `Ctrl+C` in the terminal the measurement-engine won't shut down properly and re-starting it could cause errors. To be sure, you could also see if you can reach 'localhost:5005' in you browser. If you can still reach it you have to shut down the process by hand via the terminal -> `netstat -ano | findstr :5005` and `taskkill /PID <id> /F`
- IMPORTANT: The shutting down process of the measurement-engine backend in the supervisor monitor doesn't work reliably. Always check if the process is still running before restaring it

