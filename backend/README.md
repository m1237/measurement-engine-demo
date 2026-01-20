# Measurement Engine

A measurement platform that can collect data from Empatica E4, Polar H10, Polar OH1+, Unity and visualize it on a web browser.

## Usage

To use the engine, firstly dependencies must be installed in the reqirements.txt file.

### Using with Empatica E4:

Following program and driver must be installed for real-time data streaming 
 
1- <a href="https://developer.empatica.com/windows-streaming-server.html">Empatica Streaming Server</a> 

2- <a href="https://support.empatica.com/hc/en-us/article_attachments/4403625196433/E4_USB_Drivers__Win_.zip">Empatica USB Driver</a>


For Data Collected Account:

https://www.empatica.com/connect
User: lugrinj@hotmail.com

Password: VRLAB2021HCI3


**Attention:** The password has to be updated now and then (approx. half year).If you are instructed to change the password, please count up the existing passwords last number by one and make sure to save the current password here!
Manual: https://empatica.app.box.com/v/e4-user-manual



API (cf. www.empatica.com/get-started-e4)

Purchase code: bb41d79f

API Key:86af8229ec3149e5a45cb6aff7d7795e

First, plug the Empatica dongle to the USB port and then run Empatica server. To switch on the Empatica just hold its button for a few seconds until you see a blinking blue light on the wristband. Then, the light will turn green and a few seconds later will disappear. That means a connection was established for streaming mode. Now, you can run the measurement engine.

Running src/gui.py file creates GUI to use the engine.

Recommended IDE : <a href="https://www.jetbrains.com/pycharm/">PyCharm</a>

### Using with Polar Sensors:

To use Polar OH1 armband, firstly plug its dongle into the USB port and just the button for a few seconds to switch on the device. Then you can use it with a measurement engine.

To use Polar H10 chest strap, firstly place the sensor to the strap and plug its dongle into the USB port. You must trigger the sensor by making electrode surfaces wet to activate it (if it does not work, please check the device battery) Then you can use it with the measurement engine.

### Usage

Usually you have to hit the Connect button of the sensor and wait until the layout of the button changes to 'connected'.
For the poloar sensors this sometimes lasts 20-30 seconds. As soon as one sensor or the 3D engine is connected you can press the streaming button. Wehen you press the streaming button again to switch it off, the data should atomatically be stored.
If you are unsure if things work you can also go to the 'store_data' function and print out the data on the console.

## How to build

- You need to have an installation of pyInstaller (https://pyinstaller.org/en/stable/)
- In src.DataServer we need to explicitly impor the threading of engineio (from engineio.async_drivers import threading)
- There we also need to explicitly determine the static and template folder (template_folder = os.path.join(sys._MEIPASS, 'templates')
                static_folder = os.path.join(sys._MEIPASS, 'static')
- We need a 'gui.spec' file on the same layer as the 'gui.py'. In this spec file we want to explicitly metnione, that the static and templates folder is imported. 
 `datas=[('src/templates', 'templates'), ('src/static', 'static')]`
- I linke dthe spec file that worked for me [here](https://gitlab2.informatik.uni-wuerzburg.de/GE/Dev/ViaVR/hci/measurement-engine/-/wikis/home)
- Usually this spec file is automatically created when we activate pyinstaller. Howerver we need to make aformentioned changes to this file. More info on spec files: https://pyinstaller.org/en/stable/spec-files.html
- When building the app we want to do it explicitly with the spec file (this is why we can't just let it be genearted by the build). We do this with the command 'pyinstaller gui.spec'
- After this command the .exe should be in dist/gui/gui.exe