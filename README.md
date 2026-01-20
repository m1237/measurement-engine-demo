# measurement-engine-demo
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
