
import  MeasurementEngineBackend from './SubProcessHandler'
import process from 'node:process';


let backend = new MeasurementEngineBackend(false, false)

process.on( 'SIGINT', function() {
  console.log( "\ngracefully shutting down from  SIGINT (Crtl-C)" )
  backend.shutdownBackend()
  //process.exit( )
})

function delay(time: any) {
  return new Promise(resolve => setTimeout(resolve, time))
}

const readline = require('readline');

if (process.platform === "win32") {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', function () {
    console.log('CTRL+C was pressed');
    //process.emit('SIGINT');
  });
}


backend.startBackend()

//delay(20000).then(() => backend.shutdownBackend() )

process.on('exit', function (){
  //not in use right now. Shutting down the backend from here didn't realy work.
  console.log('Goodbye!');
  backend.shutdownBackend()
});
