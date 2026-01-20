import errno
import json
import math
import threading
from abc import abstractmethod
from datetime import datetime
from collections import deque
import time
from typing import Dict
from src.Core.sensor_types import Sensor_Type
from src.Post_Processing.Response import Response
from src.Sensors.Basic_Statistic_For_Sensors import Basic_Statistics_For_Sensors
from src.Measurement_Types.Measurement_Types import Measurement_Type
from src.Helper import Write_To_File_Helper
from src.Core.streaming_type import Streaming_Type
from src.Core.Log_Types import Log_Type
import plotly.graph_objects as go
import sys
sys.stdout.flush()


class Sensor(object):

    instances = [] #sensors are stored here
    gui_instance = None #put it here as when the sensors are initialized the gui is not intialized yet
    data_server_instance = None
    recording = False #There is just one recording flag for the system as a whole. It determines if the data is actually saved to the respective storages.

    DATE_FORMAt_STORAGE = "%Y-%m-%d %H:%M:%S.%f"
    MORE_READABLE_DATA_FORMAT = "%H:%M:%S.%f"
    VISUALIZATION_MAX_LENGTH = 1000 #determines how long the deque should be that stores the data to be visualized
    functions_for_specific_options = {}  # here we store the reference to the functions that are created by in a concrete sub class. The will then be added to the set function of the specific optiosn. It must be here as at creation_time the __init__functions  havn'r been executed yet

    @classmethod
    def get_sensor_of_name(cls, sensor_name):
        for sensor in cls.instances:
            if(sensor.sensor_type.name == sensor_name):
                return sensor
        return None

    @classmethod
    def get_sensor_of_type(cls, sensor_type):
        for sensor in cls.instances:
            if sensor.sensor_type == sensor_type:
                return sensor

        return None

    def __init__(self, sensor_type: Sensor_Type, measurement_types_and_frequency: Dict[Measurement_Type, int], specific_options:Dict = None):

        '''
            Initiates a new sensor in the system.

            :param sensor_type: Expects a member of the enum "Sensor_Type" (located in src/sensor_types.py).
            If you are working with a sensor that has not yet been connected to the system you have to add the
            name/identifier of your sensor to the enum and then parse it here as an argument

            :param measurement_types_and_frequency: Here, one can define the different measurement-types that the sensor supports.
            The function expects a dictionary here, whereas the key is the measurement-type and the value is an integer
            that defines the frequency with which the data of the specific measurement-type is streamed.
            A measurement-type needs to inherit from 'src/Measurement_Types/Measurement_Types/Measurement_Type'.
            The folder src/Measurement_Types already contains a lot of typcial measurement-types that you can just
            use here.

            :param specific_options: Optional argument that offers the chance to add specific options for the sensor to
            the GUI. Specifically, you can add a dropdown-menu, a range-slide, or a checkox to the GUI of you sensor with
            which you can enable user-inputs that are specific to your sensor.For more info on this, please refer to the
            documentation.

        '''

        self.sensor_type = sensor_type
        self.measurement_types = []

        if(type(measurement_types_and_frequency) is not dict):
            raise Exception("Instantiation of the Sensor failed as not dictionary was provided for measurement types and corresponding frequencies.")


        for key in measurement_types_and_frequency:
            #just fill in this list so it is easier to read which measurement-types belong to this sensor
            self.measurement_types.append(key)

        self.measurement_types_and_frequency = measurement_types_and_frequency
        self.streaming = False
        self._connected = False
        self.received_data = False
        self.current_streaming_type = Streaming_Type.Real
        self.replay_flag = False
        Sensor.instances.append(self)
        self.real_data_storage = {}
        self.external_data_storage = []
        self.visualization_data_storage = {}
        self.visualization_sample_storage = {}
        self.fake_data_storage = {}
        self.replay_data_storage = {}
        self.replay_file_locations = []  # Deprecated
        self.loop_replay_data = True #When false it will stop after replay file has been replayed once
        self.loaded_replay_data = {}    # Here all the data is loaded that was provided via replay-files
        self.fake_data_to_stream = {}   # Here are the values that the user wants to be streamed for certain type. This value is set by the interface.

        self.observers = {} #observers that will be notfied as soon as value update comes in

        self.on_connected_event = None #these are two special events that will be triggered when connect and or stream are set to true
        # if it was triggered for streaming type 'real'. It is a workaround because connect_and_stream does not have a return
        self.on_streaming_event = None


        self.streaming_measurement_types = set() #this is a set as it should conatain each measurement_type only once
        self.disconnect_desired = False
        self.specific_options = specific_options
        self.basic_statistics = Basic_Statistics_For_Sensors(self)
        self.create_plots_when_saved = False

        self.initialize_data_storage()
        self.initalize_specific_options()

    @property
    def streaming(self):
        return self._streaming

    @streaming.setter
    def streaming(self, value):

        new_value_set = True

        if hasattr(self, '_streaming') and value == self._streaming:
            new_value_set = False

        self._streaming = value

        if hasattr(self, 'on_streaming_event') and self.on_streaming_event:
            self.on_streaming_event.set() #notifies the 'trigger_connect_and_stream' function


        #this one is triggered when we have a unforseen event happening. We trigger this only when a new value arrives
        elif Sensor.data_server_instance and new_value_set and self.current_streaming_type == Streaming_Type.Real:

            Sensor.data_server_instance.update_streaming_label()



    @property
    def connected(self):
        return self._connected

    @connected.setter
    def connected(self, value):

        new_value_set = True

        if hasattr(self, '_connected') and value == self._connected:
            new_value_set = False

        self._connected = value

        if hasattr(self, 'on_streaming_event') and self.on_streaming_event:
            #We do not want to notify the frontend when on_streaming_event is active as this means that the connect_and_stream function will give the answer to the frontend
            pass

        elif new_value_set and self.current_streaming_type == Streaming_Type.Real:
            Sensor.data_server_instance.get_instance().sensor_update(self.sensor_type.name, value)

        #if not self.gui_instance is None:
        #    self.gui_instance.check_streaming_label_and_button()


#    @abstractmethod
#    def start_streaming_real_data(self): #To be implemented in the sub class. Later we can also do this for each measurement type.
#        pass

    @abstractmethod
    def connect_and_stream(self):
        '''
        Abstract method that needs to be implemented in the respective sub-classes. Here the concrete process of
        connecting to a sensor and feeding its values to the system is implemented. In order to store values to the
        system, you need to use the self.store_data() function. As soon as the sensor is connected and retrieving data you have
        to set 'self.streaming' to True. This is important to notify the rest of the system that this sensor is acutally streaming.

        '''

        pass

    @abstractmethod
    def disconnect(self):
        '''
            Will be triggered when the disconnect button is triggered in the user interface.
            'connected' and 'streaming' will automatically be set to false after this function was executed.
        '''
        pass

    def trigger_disconnect(self) -> bool:
        '''
        The function that is triggered by the server when disconnect is hit. It makes sure that connected and streaming are actually set to false.
        :return boolean that denotes if streaming and connection were deactivated
        '''
        self.disconnect_desired = True
        self.disconnect()
        self.connected = False
        self.streaming = False

        return True



    def initialize_data_storage(self, is_first_initialization = True):
        '''
        param is_first_initialization: This fucntion will be triggered when the application starts but also later when recording was set to off and post-processin was finished
        there are maybe differences in how we want to initalize/re-initialize the data storages
        '''
        for measurement_type in self.measurement_types:
            self.real_data_storage[measurement_type] = {}
            self.visualization_data_storage[measurement_type] = deque(maxlen=Sensor.VISUALIZATION_MAX_LENGTH)
            self.visualization_sample_storage[measurement_type] = deque(maxlen=Sensor.VISUALIZATION_MAX_LENGTH)#neccessary for the x-axis of visualization
            self.visualization_sample_storage[measurement_type].append(0)
            self.fake_data_storage[measurement_type] = {}
            self.replay_data_storage[measurement_type] = {}

            if is_first_initialization:
                #this function will not be triggered when it is a re-initialization
                self.fake_data_to_stream[measurement_type] = measurement_type.value_type.default_value

            #Maybe we also have to put the deque() functions here if it is neccessary for the visualization

    def initalize_specific_options(self):
        if self.specific_options:
            for key, value_options in self.specific_options.items():

                try:
                    addtional_function = Sensor.functions_for_specific_options[self.sensor_type.name][key]
                except KeyError:
                    addtional_function = None


                if isinstance(value_options, list):
                    if isinstance(value_options[0], str):
                        #dropdown    
                        setattr(self, key, value_options[0]) #create a new member variable of this class
    
                        def setter_function(new_value, func=addtional_function, value_options=value_options, key=key):#we need the value and the key arguments to have an early biding (instead of a late one)
                            if value_options.__contains__(new_value):
                                setattr(self, key, new_value)
    
                            else:
                                print("The variable {0} can not have the value {1}.".format(key, new_value))
                            if callable(func):
                                func(self, new_value)
                                
                    elif isinstance(value_options[0], int) or isinstance(value_options[0], float):
                        #slider
                        setattr(self, key, None)  # create a new member variable of this class

                        def setter_function(new_value, func=addtional_function, value_options=value_options, key=key): # we need the value and the key arguments to have an early biding (instead of a late one)

                            #we might receive strings here so we need a parsing process first
                            try:
                                new_value = float(new_value)
                            except:
                                print("The value that was provided for {0} was not a number.".format(key))
                            if new_value >= value_options[0] and new_value<= value_options[1]:
                                setattr(self, key, new_value)
                            else:
                                print("The variable {0} can not have the value {1} as it is out of range of the value-range {2}-{3}.".format(key, new_value, value_options[0], value_options[1]))
                            if callable(func):
                                func(self, new_value)

                elif isinstance(value_options, bool):
                    setattr(self, key, value_options)  # create a new member variable of this class

                    def setter_function(new_value, func=addtional_function, key=key):# we need the value and the key arguments to have an early biding (instead of a late one)

                        if new_value == 'true':
                            new_value = True
                        elif new_value == 'false':
                            new_value = False


                        if isinstance(new_value, bool):
                            setattr(self, key, new_value)

                            if callable(func):
                                func(self, new_value)

                        else:
                            print("The variable {0} can not have the value {1}.".format(key, new_value))



                function_name = 'set_' + key
                setattr(self, function_name, setter_function)

    @staticmethod
    def decorate_specific_options(sensor_name, option_name):

        def decorator(func):
            Sensor.register_function_for_specific_opiton(sensor_name, option_name, func)

        #setter = getattr(self)

        return decorator

    @staticmethod
    def register_function_for_specific_opiton(sensor_name, option_name, function):

        already_registered_sensors = Sensor.functions_for_specific_options.keys()

        if not already_registered_sensors.__contains__(sensor_name): #check if the first dictionary for the sensor has already been registered
             Sensor.functions_for_specific_options[sensor_name] = {} #only do this when it hasn't been done before

        Sensor.functions_for_specific_options[sensor_name][option_name] = function

    @staticmethod
    def start_recording() -> bool:
        """
        When recording-button is triggered, this function will run.
        :return Returns true if recording was started and false if it was not started.
        """

        recording_activated = False

        for sensor in Sensor.instances:


            if sensor.streaming:
                #usually when already streaming, we just want to set recording to true

                if sensor.current_streaming_type == Streaming_Type.Replay:
                    #special case for replay-data: When a data-file was added since last stime recording was started, we also have to start streaming for this data-file
                    sensor.start_streaming_replay_data()

                recording_activated = True

                if not Sensor.recording:
                    Sensor.recording = True

            elif sensor.current_streaming_type == Streaming_Type.Real:

                #The only things that are neccessary already come after 'if sensor.streaming'
                pass

            elif sensor.current_streaming_type == Streaming_Type.Fake:

                sensor.streaming = True # we can be sure it will stream now as streaming fake data always works

                for measurement_type in sensor.measurement_types:
                    sensor.start_function_in_a_thread(target=sensor.start_streaming_fake_data, args=(measurement_type,))

                recording_activated = True

                if not Sensor.recording:
                    Sensor.recording = True

            else:
                #replay

                if not sensor.loaded_replay_data:
                    Sensor.data_server_instance.update_log(
                        "Replay process for sensor {0} was not started as there were no replay files provided.".format(
                            sensor.sensor_type.name), Log_Type.Warning)
                    sensor.streaming = False

                else:

                    sensor.streaming = True # we take for granted that as soon as a replay file is found that the replay file is valid and streaming will start
                    #sensor.start_function_in_a_thread(target=sensor.start_streaming_replay_data)
                    sensor.start_streaming_replay_data()
                    recording_activated = True

                    if not Sensor.recording:
                        Sensor.recording = True #triggering this will cause the data to be actually stored


        return recording_activated

    @staticmethod
    def is_recording_possible() -> (bool, list):
        """
        returns a boolean that determines if the system would be ready for recording and a list of the sensor_names that would be ready for recording
        """

        recording_possible = False
        sensors_available_for_recording = []

        for sensor in Sensor.instances:

            if sensor.streaming:
                # when it is already streaming we just need to set recording to true

                recording_possible = True
                sensors_available_for_recording.append(sensor.sensor_type.name)


            elif sensor.current_streaming_type == Streaming_Type.Real:

                if sensor.streaming:
                    recording_possible = True
                    sensors_available_for_recording.append(sensor.sensor_type.name)


            elif sensor.current_streaming_type == Streaming_Type.Fake:

                recording_possible = True
                sensors_available_for_recording.append(sensor.sensor_type.name)

            else:
                # replay

                if sensor.loaded_replay_data:
                    sensors_available_for_recording.append(sensor.sensor_type.name)
                    recording_possible = True

        return (recording_possible, sensors_available_for_recording)


    def get_visualization_data(self, measurement_type, index):
        #self.visualization_sample_storage[measurement_type].append(index)
        return self.visualization_data_storage[measurement_type]

    def get_real_data(self, measurement_type):
        return self.real_data_storage[measurement_type]


    def get_fake_data(self, measurement_type):
        return self.fake_data_storage[measurement_type]

    def get_replay_data(self, measurement_type):
        return self.replay_data_storage[measurement_type]

    def get_data_of_given_type(self, measurement_type, streaming_type):
        if(streaming_type == Streaming_Type.Real):
            return self.real_data_storage[measurement_type]
        elif(streaming_type == Streaming_Type.Fake):
            return self.fake_data_storage[measurement_type]
        else:
            return self.replay_data_storage[measurement_type]

    def store_external_data(self, vas_data):
        global index
        index = 0
        self.external_data_storage.append(vas_data)
        index = index + 1
        return self.external_data_storage

    def trigger_connect_and_stream(self) -> bool:
        '''
        Function that is called when someone is trying to connect_and_stream data of a sensor (real data)
        '''

        self.on_streaming_event = threading.Event()

        self.start_thread = threading.Thread(target=self.connect_and_stream)
        self.start_thread.start()

        #self.start_function_in_a_thread(self.connect_and_stream)

        self.on_streaming_event.wait()

        self.on_streaming_event = None
        return self.streaming
    
    def trigger_start_real_classification(self) -> bool:
        pass


    def store_data(self, measurement_type: Measurement_Type, timestamp: datetime, data, streaming_type: Streaming_Type = Streaming_Type.Real):
        '''

        :param measurement_type: The measurement_type of the data. It needs to be one of the measurement-types that were provided in 'measurement_types_and_frequency'
        when initializing the sensor
        :param timestamp: Timestamp of the data-point. The expected format is the standard format for datetime in python - %Y-%m-%d %H:%M:%S.%f
        :param data: The actual data-point to be stored. The type of data must correspond to the value-type of the measurement-type you are providing
        Usually it is a float, int or tuple. If it is a tuple is provided, then length of it needs to correspond to value-type of the measurement-type.
        :param streaming_type: Can either be real, fake, or replay data. If this function is called from sub-class it almost always has to be real data.
        Default is Streaming_Type.Real


        '''

        if not Sensor.recording:
            return #only works when recording is set to true we will execute this function

        expected_number_of_values = measurement_type.value_type.number_of_dimensions
        expected_data_types = measurement_type.value_type.accepted_data_types

        '''
        if not expected_data_types.__contains__(type(data)):
            print(
                "Problem when trying to save data for measurement type '{0}' of sensor '{1}'. Measurement type '{0}' has the value type '{2}' "
                "which expects one of the follwing data types: {3}. However, data of type {4} was given.".format(
                    measurement_type.name, self.sensor_type.name,
                    measurement_type.value_type.__class__.__name__, str(expected_data_types) ,type(data)))
            return

        if hasattr(data, '__len__'): #first we check if we have a data type that has a length. If yes we check if the length is correct.
            if not isinstance(data, str):#if data is string we don't do this check. This check is meant for for list/tuples
                if len(data) != expected_number_of_values:
                    print(
                        "Problem when trying to save data for measurement type '{0}' of sensor '{1}'. Measurement type '{0}' has the value type '{2}' "
                        "which expects {3} single values as data. However, {4} different values were provided.".format(
                            measurement_type, self.sensor_type.name,
                            measurement_type.value_type.__class__.__name__, expected_number_of_values, len(data)))
                    return
        '''

        last_index = self.visualization_sample_storage[measurement_type][-1]
        self.visualization_sample_storage[measurement_type].append(last_index+1)
        self.visualization_data_storage[measurement_type].append(data)

        if measurement_type.name in self.observers:
            list_of_interested_observers = self.observers[measurement_type.name]

            for observer in list_of_interested_observers:
                observer.value_update(data, timestamps=timestamp, sensor_type=self.sensor_type, measurement_type=measurement_type)

        #actually store data
        self.get_data_of_given_type(measurement_type, streaming_type)[last_index+1] = data, str(timestamp) #store timestamps as strings. could be changed later
        self.streaming_measurement_types.add(measurement_type) #registers that there is acutally data streaming for this specific measurement_type. We are using a set here so measurement_types are only registered once here

        self.basic_statistics.update_statistics(data, measurement_type, streaming_type)


    def register_observer(self, observer, measurement_type):

        required_function_name = 'value_update'

        if not hasattr(observer, required_function_name) and callable(observer.value_update):
            print("Error when trying to register new observer '{0}' for subject '{1}'. An object that wants to serve as an observer requires"
                  " a '{2}' method.".format(observer, self.sensor_type, required_function_name))

            return

        if not self.measurement_types.__contains__(measurement_type):
            print("Error when trying to register new observer '{0}' for subject '{1}'. The observer tries to register for updates on measurement type '{2}'"
                  ". However, this measurement type is not provided by sensor of type '{1}'.".format(observer, self.sensor_type, measurement_type))
            return


        if not self.observers.keys().__contains__(measurement_type.name):
            self.observers[measurement_type.name] = []

        #now we can finally add the observer to the list of observers for the specific measurement_type
        self.observers[measurement_type.name].append(observer)

    def remove_observer(self, observer):

        for measurement_type_name in self.observers:
            list_of_observers = self.observers[measurement_type_name]

            try:
                list_of_observers.remove(observer) #throws an error when the element does not exist
            except ValueError:
                pass


    def get_data_of_current_streaming_type(self, measurement_type):
        if (self.current_streaming_type == Streaming_Type.Real):
            return self.real_data_storage[measurement_type]
        elif (self.current_streaming_type == Streaming_Type.Fake):
            return self.fake_data_storage[measurement_type]
        else:
            return self.replay_data_storage[measurement_type]

    def get_frequency_of_measurement_type(self, measurement_type):

        for key in self.measurement_types_and_frequency:
            if key == measurement_type:
                frequency = self.measurement_types_and_frequency[key]
                if frequency == 0:
                    #return("Data type {0} for sensor {1} does not seem to contain a frequency.".format(measurement_type.name, self.sensor_type.name))
                    return None
                else:
                    return self.measurement_types_and_frequency[key]

        #return("There is no frequency data for type {0} in the sensor of type {1}.".format(measurement_type.name, self.sensor_type.name))
        return None


    def handle_metadata(self, path):
        path = path + "/metadata.json"

        try:
            with open(path, "r+") as data_file:
                 data = json.load(data_file)

                 for measurement_type in self.measurement_types:
                      data.update({measurement_type.name : self.sensor_type.name})

                 json.dump(data, data_file, indent=1)
                 data_file.close()

        except FileNotFoundError:
                with open(path, "w+") as data_file:
                   data = {}

                   for measurement_type in self.measurement_types:
                        data[measurement_type.name ] = self.sensor_type.name

                   json.dump(data, data_file, indent=1)
                   data_file.close()

        except OSError as exc:  # Guard against race condition
               if exc.errno != errno.EEXIST:
                   raise


    def check_replay_file_for_validity(self, data):
        """
        Function that checks if the data that was read out of a file has the same format and info as the files the measurement-engine saves

        :return this function returns 2 values. The first one is a boolean that denotes if the replay file was valid or not. The second one is the measurement-type it is targeting (if it is valid)
        """

        #We need this module as it contains the keys we are searching for
        import src.Helper.Write_To_File_Helper as helper



        if not isinstance(data, dict):
            print("Invalid format", flush=True)
            return False, None

        if helper.META_INFO_KEY not in data:
            print("no meta-info found in data", flush=True)
            return False, None

        if helper.DATA_KEY not in data:
            print("no data key found", flush=True)
            return False, None

        meta_info = data[helper.META_INFO_KEY]

        if helper.META_INFO_SENSOR_KEY not in meta_info:
            print("no sensor info found", flush=True)
            return False, None

        if helper.META_INFO_MEASUREMENT_KEY not in meta_info:
            print("no measurement-type info found", flush=True)
            return False, None

        provided_sensor_name = meta_info[helper.META_INFO_SENSOR_KEY]

        if self.sensor_type.name != provided_sensor_name:
            print("Replay file is meant for a different sensor.", flush=True)
            return False, None


        provided_measurement_type_name = meta_info[helper.META_INFO_MEASUREMENT_KEY]

        target_measurement_type = Measurement_Type.getMeasurementTypeOfName(provided_measurement_type_name) #function returns 0 if this measurement-type does not exist

        if target_measurement_type == 0:
            print("Unknown measurement-type provided")
            return False, None

        if not target_measurement_type in self.measurement_types:
           print("Measurement-type is not supported by the sensor.")
           return False, None

        number_of_expected_values = target_measurement_type.value_type.number_of_dimensions

        for key, value in data["data"].items():

            if not (isinstance(key, str) and key.isdigit()):
                print("no index found")
                return False, None

            if not (isinstance(value, list) and len(value) == 2):
                print("no value and timestamp found")
                return False, None

            if not (isinstance(value[0], float) or (isinstance(value[0], int)or (isinstance(value[0], list)))):
                print("Values can either be single values or list of values", value[0], type(value[0]))

                return False, None

            if ((isinstance(value[0], float) or isinstance(value[0], float)) and number_of_expected_values != 1):
                print("if we have a float or int the number of expected values must be 1")
                return False, None 

            if isinstance(value[0], list) and len(value[0]) != number_of_expected_values:
                print(value[0])
                print("we have a list of values but it does not fit the number of expected values")
                return False, None

            if not isinstance(value[1], str):
                print("timestamp must be string")
                return False, None

            try:

                datetime.strptime(value[1], '%Y-%m-%d %H:%M:%S.%f')

            except ValueError:
                #not in real date format
                print("Invalid timestamp:", value[1])
                return False, None
                break

        return True, target_measurement_type

    def store_loaded_replay_data(self, data):
        '''

        returns two variables the. The first one denotes if adding the replay file worked. If the first variable is True
        then the second one denotes if which measurement-type this file was saved for.
        '''

        data_valid, measurement_type = self.check_replay_file_for_validity(data)

        if not data_valid:
            return False, measurement_type

        else:
            self.loaded_replay_data[measurement_type] = data
            Sensor.data_server_instance.update_log(
                "Replay data for type {0} of sensor {1} was added.".format(measurement_type.name,
                                                                           self.sensor_type.name), Log_Type.Success)
            return True, measurement_type


    def delete_stored_replay_data(self, measurement_type):

        if Sensor.recording:
            return False #we don't want to remove a file while it is streaming

        if measurement_type in self.loaded_replay_data: #check if key exists
            del self.loaded_replay_data[measurement_type]

            self.streaming_measurement_types.remove(measurement_type)

            if len(self.loaded_replay_data) == 0 and self.streaming and self.current_streaming_type == Streaming_Type.Replay:
                #we know that we removed the last replay-file and that the sensor is currently in replay mode. So if it is streaming it is now not doing this anymore
                self.streaming = False

            return True



        else:
            #there was no replay data saved for this measurement-type
            return False

    def start_streaming_replay_data(self):

        for key in self.loaded_replay_data:

            if not key in self.streaming_measurement_types: #the key is the measurement-type here. If it is already streaming we do not want to add another instance. Can happen when recording is re-triggered and another file was added.

                data = self.loaded_replay_data[key]
                data = data["data"]
                function_thread = threading.Thread(target=self.stream_replay_data_thread, args=(key, data))
                function_thread.start()


        '''
        if not self.replay_file_locations: #check if there are replay files provided
            Sensor.interaction.get_instance().change_text("There is no data path for replay file of the {0} device".format(self.sensor_type.name)) # Will be logged on the GUI probably
            self.streaming = False
            return

        for replay_file_location in self.replay_file_locations:
            with open(replay_file_location) as test:
                data = json.load(test)
                data = data["data"]
                file_measurement_type = self.read_measurement_type(replay_file_location)
                function_thread = threading.Thread(target=self.stream_replay_data_thread, args=(file_measurement_type, data))
                function_thread.start()
                self.streaming = True
        '''


    def stream_replay_data_thread(self, measurement_type, loaded_data):

        while self.streaming and self.loop_replay_data: #loop multiple time over one file if neccessary
            for index, data in loaded_data.items(): #loop over the data of the file
                if not self.streaming:
                    return

                if not measurement_type in self.loaded_replay_data:
                    #this case can happen when replay-file was removed while sensor is streaming
                    return

                current_time = str(datetime.now())
                self.store_data(measurement_type, current_time, data[0], Streaming_Type.Replay)


                current_timestamp = datetime.strptime(data[1], Sensor.DATE_FORMAt_STORAGE)

                try:
                    next_timestamp = loaded_data[str(int(index)+1)][1]
                    # parse it to datetime
                    next_timestamp = datetime.strptime(next_timestamp, Sensor.DATE_FORMAt_STORAGE)
                    delta_time = next_timestamp - current_timestamp
                    delta_seconds = delta_time.total_seconds()

                except KeyError:
                    # if we land here we are in the last entry as we did not find a 'next_timestamp'
                    #then we can break as the replay file is over

                    continue

                    break


                time.sleep(delta_seconds)

            #Sensor.data_server_instance.update_log("Replay process of {0} data for the {1} device was stopped as the complete file was replayed.".format(measurement_type.name, self.sensor_type.name), Log_Type.Info)


    def start_streaming_fake_data(self, measurement_type):

        while self.streaming:
            current_time = str(datetime.now())
            self.store_data(measurement_type, current_time, self.fake_data_to_stream[measurement_type],
                            Streaming_Type.Fake)
            time.sleep(0.1)


            #for sensor in Sensor.instances:
            #    if sensor.streaming == True:
            #        for measurement_type in sensor.measurement_types:
            #            print(sensor.sensor_type.name, measurement_type.name)
            '''
            if measurement_type.name == "ACC":
                for round in range(1000):
                    for x in range(20):
                        self.store_data(measurement_type, Streaming_Type.Fake, [random.uniform(0, 0.01),random.uniform(0, 0.01),random.uniform(0, 0.01)], current_time)
                        print(measurement_type.name, self.get_fake_data(measurement_type)[-1])
                        time.sleep(1)
                    for x in range(20):
                        self.store_data(measurement_type, Streaming_Type.Fake, [random.uniform(0.01, 0.2),random.uniform(0.01, 0.2),random.uniform(0.01, 0.2)], current_time)
                        # self.get_fake_data(measurement_type).append(random.uniform(0.01, 0.2))
                        print(measurement_type.name, self.get_fake_data(measurement_type)[-1])
                        time.sleep(1)
            else:
                for round in range(1000):
                    for x in range(20):
                        self.store_data(measurement_type, Streaming_Type.Fake, random.uniform(0, 0.01), current_time)
                        print(measurement_type.name, self.get_fake_data(measurement_type)[-1])
                        time.sleep(1)
                    for x in range(20):
                        self.store_data(measurement_type, Streaming_Type.Fake, random.uniform(0.01, 0.2), current_time)
                        # self.get_fake_data(measurement_type).append(random.uniform(0.01, 0.2))
                        print(measurement_type.name, self.get_fake_data(measurement_type)[-1])
                        time.sleep(1)
'''



    def change_current_streaming_type(self, streaming_type):

        if Sensor.recording:
            #We do not allow a sensor to change streaming type when recording is activated
            return

        self.streaming = False
        self.connected = False

        if self.current_streaming_type == Streaming_Type.Real and self.streaming:
            self.trigger_disconnect()

        self.current_streaming_type = Streaming_Type[streaming_type]


    def stop_recording(self):
        '''
        This function is basically responsible for triggering the post-processing and post-visualization
        '''

        if(self.sensor_type.name != "Engine"):
            Write_To_File_Helper.write_to_json_for_sensor(self)
        else:
            Write_To_File_Helper.write_to_json_for_engine(self)

        #if(self.create_plots_when_saved):

        if self.sensor_type.name != "Engine":
            self.plot_data_for_each_measurement_type()
        else:
            self.plot_data()

        if self.sensor_type.name != "Engine":
            self.initialize_data_storage(False)
        else:
            self.initialize_data_storage()

        self.basic_statistics.create_storages_for_features()#also once again re-initiate the storages here


    '''
    def start_streaming(self):

        if(self.current_streaming_type == Streaming_Type.Real):

            if self.connected:
                self.start_function_in_a_thread(target = self.start_streaming_real_data)
            else:
                Sensor.data_server_instance.update_log("{0} sensor needs to be connected before you can start streaming real data".format(self.sensor_type.name), Log_Type.Warning)

        elif self.current_streaming_type == Streaming_Type.Fake :
            self.connected = True  # we act as if it the sensor was connected. Might be useful for algorithms that check if sensor is connected before they try fetching data
            self.streaming = True
            for measurement_type in self.measurement_types:
               self.start_function_in_a_thread(target = self.start_streaming_fake_data, args = (measurement_type,))
        else:


            if not self.loaded_replay_data:
                Sensor.data_server_instance.update_log(
                    "Replay process for sensor {0} was not started as there were no replay files provided.".format(
                        self.sensor_type.name), Log_Type.Warning)
                self.streaming = False
                return

            #before the new thread starts we want to have the info that it is connected
            self.connected = True  # we act as if it the sensor was connected. Might be useful for algorithms that check if sensor is connected before they try fetching data

            self.start_function_in_a_thread(target = self.start_streaming_replay_data)
    '''


    def get_average_value(self, measurement_type, streaming_type=None):
        provided_streaming_type = streaming_type
        if not streaming_type:
            provided_streaming_type = self.current_streaming_type
        return self.basic_statistics.average_storages[measurement_type][provided_streaming_type.name]
    def get_max_value(self, measurement_type, streaming_type=None):
        provided_streaming_type = streaming_type
        if not streaming_type:
            provided_streaming_type = self.current_streaming_type
        return self.basic_statistics.max_value_storages[measurement_type][provided_streaming_type.name]
    def get_min_value(self, measurement_type, streaming_type=None):
        provided_streaming_type = streaming_type
        if not streaming_type:
            provided_streaming_type = self.current_streaming_type
        return self.basic_statistics.min_value_storages[measurement_type][provided_streaming_type.name]
    def get_variance_value(self, measurement_type, streaming_type=None):
        provided_streaming_type = streaming_type
        if not streaming_type:
            provided_streaming_type = self.current_streaming_type
        return self.basic_statistics.variance_storages[measurement_type][provided_streaming_type.name]
    def get_std_deviation_value(self, measurement_type, streaming_type=None):
        provided_streaming_type = streaming_type
        if not streaming_type:
            provided_streaming_type = self.current_streaming_type
        return math.sqrt(self.basic_statistics.variance_storages[measurement_type][provided_streaming_type.name])

    def read_measurement_type(self, file_path):
        split_path = file_path.split("/")
        measurement_type = split_path[-1][0:-5]  #
        return Measurement_Type[measurement_type]

    def start_function_in_a_thread(self, target, args=()):
        #from src.data_server import Data_Server
        #Data_Server().get_instance().socketio.start_background_task(target=target)


        self.start_thread = threading.Thread(target=target, args=args)
        self.start_thread.start()

    def plot_data_for_each_measurement_type(self, format = "html"):
        for i, measurement_type in enumerate(self.measurement_types):
            if i == len(self.measurement_types)-1:
                self.plot_data(measurement_type, format, is_last_one_for_sensor=True)
            else:
                self.plot_data(measurement_type, format)


    def plot_data(self, measurement_type, format = "html", plot_mode = "lines+markers", plot_type = "scatter", is_last_one_for_sensor = False):

        #right now it is only triggered by the stop_streaming function when streaming type is real
        data = self.get_data_of_current_streaming_type(measurement_type)
        

        if len(data) <= 0:
            #check if there is even data -
            if is_last_one_for_sensor:
                #we still might want to save the tables if this was the last round
                for response in Response.instances:
                    response.write_current_table_to_file()

            return

        number_of_sub_plots_neccessary = measurement_type.value_type.number_of_dimensions

        x, y = Sensor.split_data_into_x_and_y_for_graphs(data, measurement_type.value_type)
        fig = go.Figure()

        for i in range(number_of_sub_plots_neccessary):


            if number_of_sub_plots_neccessary == 1:
                relevant_y_data = y
            else:
                #take the n th sub list
                relevant_y_data = y[i]

            plot = {
                'x': x,
                'y': relevant_y_data,
                'mode': plot_mode,
                'type': plot_type
            }

            if measurement_type.value_type.has_labels:
                #if it has labels for the dimensions than we will add them to the plot
                plot['name'] = measurement_type.value_type.dimension_labels[i]

            fig.add_trace(plot)

        fig.update_xaxes(title_text="Timestamp")
        fig.update_yaxes(title_text=measurement_type.name + "(" + measurement_type.unit.name + ")")
        fig.update_layout(title_text=self.sensor_type.name + ' - ' + measurement_type.name)
        fig.update_xaxes(rangeslider=dict(visible=True))

        '''
        if measurement_type.value_type == Value_Type.Vector:
            #TODO: this is hardcoded for a three dimensional xyz vector. This could be more abstrac in the future. Also only works with a scatter plot

            x, y = Sensor.split_data_into_x_and_y_for_graphs(data, measurement_type.value_type)
            y_one = y[0]
            y_two = y[1]
            y_three = y[2]


            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x = x,
                y = y_one,
                name = 'x-axis'
            ))

            fig.add_trace(go.Scatter(
                x=x,
                y=y_two,
                name='y-axis'
            ))

            fig.add_trace(go.Scatter(
                x=x,
                y=y_three,
                name='z-axis'
            ))

            fig.update_layout(
                title = self.sensor_type.name + ' - ' + measurement_type.name,
                xaxis_title = "Number of Samples",
                yaxis_title = measurement_type.name + "(" + measurement_type.unit.name + ")"
            )

        else:

            x,y = Sensor.split_data_into_x_and_y_for_graphs(data, measurement_type.value_type)

            #This one would read out the labeling entries (maybe in the future we want to put this info into graphs)
            
            from src.labeling import Label_Data
            label_data = Label_Data.get_instance().data_storage
            if label_data:
                label_types = label_data.keys()

                for label in label_types:
                    entries = label_data[label]
                    print(entries)
           
            print("data that was used to make the graph: " + str(len(y)))
            plot = {
                'x': x,
                'y': y,
                'mode': plot_mode,
                'type': plot_type,
                'name': self.sensor_type.name + ' - ' + measurement_type.name,
            }

            fig = go.Figure(plot)
            


            fig.update_xaxes(title_text = "Number of Samples")
            fig.update_yaxes(title_text = measurement_type.name + "(" + measurement_type.unit.name + ")")
            fig.update_layout(title_text = self.sensor_type.name + ' - ' + measurement_type.name)
            fig.update_xaxes(rangeslider=dict(visible=True))

            #add a horizontal line where the average is laying
            
            fig.add_hline(y=self.get_average_value(measurement_type,Streaming_Type.Real.name), line_dash="dot", row=3, col="all",
              annotation_text="Mean value ({})".format(round(self.get_average_value(measurement_type,Streaming_Type.Real.name)),2),
              annotation_position="bottom right")
            

            #extra step of processing based on responses
        '''
        from src.Post_Processing.Process_Algorithm import Process_Algorithm

        #we first make trigger the cleaning algorithms as their data might be used by others
        for algorithm in Process_Algorithm.cleaning_algorithms:
            if algorithm.activated:
                algorithm.trigger_data_set_process_algorithm(y, x, self.sensor_type, measurement_type)

        #then we trigger the rest of the data-set processing algorithms
        for algorithm in Process_Algorithm.data_set_processing_algorithms:
            #befor triggering we check if it was a cleaning algorithm. In this case we do not need to trigger the algorithm.
            if algorithm.activated:
                if not Process_Algorithm.cleaning_algorithms.__contains__(algorithm):
                    algorithm.trigger_data_set_process_algorithm(y,x,self.sensor_type, measurement_type)

        Response.request_response_data_from_protocol()
        Response.load_responses_from_file()
        for response in Response.instances:
            print("responses : ", Response, flush= True)
            response.add_response_to_graph(fig, x, self.sensor_type, measurement_type)

            response.trigger_processing_algorithms_for_response(y, x, self.sensor_type, measurement_type, is_last_one_for_sensor)

        from src.Post_Processing.Process_Algorithm import Process_Algorithm
        for algorithm in Process_Algorithm.axis_annotation_algorithms:
            if algorithm.activated:
                algorithm.trigger_axis_annotation_processing(y, x, self.sensor_type, measurement_type, fig)

        from src.Post_Processing.Response_Meta_Processing import Response_Meta_Processing
        meta_processing_instance = Response_Meta_Processing.get_instance()
        #it autmatically creates the new graph that contains the specific responses and then also triggers the execution of algorithms
        meta_processing_instance.make_comparison_graph_for_responses(x, y, self.sensor_type, measurement_type)

        #Plots with cleaned data have not been saved so far as they might have been annotated by algorithms
        import src.Post_Processing.Visualization_Helper as vis_helper
        for sensor_type_name in vis_helper.plots_of_cleaned_data:
           for measurement_type_name in vis_helper.plots_of_cleaned_data[sensor_type_name]:
              figure = vis_helper.plots_of_cleaned_data[sensor_type_name][measurement_type_name][0]
              filename = vis_helper.plots_of_cleaned_data[sensor_type_name][measurement_type_name][1]
              figure.write_html(filename)

        # we are now emptying the list so we don't save it again on the next sensor
        vis_helper.plots_of_cleaned_data = {}

        filename = Write_To_File_Helper.get_data_path_for_saving_plot(format, self.sensor_type.name, measurement_type.name)

        if(format == "html"):
            fig.write_html(filename)
        else:
            fig.write_image(filename)

        filename = Write_To_File_Helper.get_data_path_for_saving_plot(format, self.sensor_type.name, "total_graph")
        with open(filename, 'a') as f:
            #It appends all the graphs about the specific measurement_types to one graph for the whole sensor
            f.write(fig.to_html(full_html=False, include_plotlyjs='cdn'))
            f.close()

    @staticmethod
    def split_data_into_x_and_y_for_graphs(data, value_type):
        # method that takes stored data and splits it into data for x and y coordinates of a plotly graph
        # this functionality will also be used by other classes. That's why it is a static method.

        number_of_neccessary_y_values = value_type.number_of_dimensions

        x = []
        y = []

        if number_of_neccessary_y_values > 1:

            for n in range(number_of_neccessary_y_values):
                #if we are dealing with more than one value at a time we need that many individual lists of values
                y.append([])

        for i in range(len(data)):  ## get the last n numbers of the data storage, whereas n equals sample-size
            #read out y-data
            if number_of_neccessary_y_values == 1:
                y.append(data[i + 1][0])

            else:
                for a in range(number_of_neccessary_y_values):
                    #for each dimension we fill a distinct list. All the values that belong to one dimension are in one list.
                    y[a].append(data[i + 1][0][a])

            #read out x-data
            date: datetime = datetime.strptime(data[i + 1][1],
                                               Sensor.DATE_FORMAt_STORAGE)  # makes date object out of string
            date_formatted = date.strftime(
                Sensor.MORE_READABLE_DATA_FORMAT)  # formats the date in a readable way for annotating the x-axis. #TODO this much info still looks a little bit clunky in the graph. See if we can make it look better.
            x.append(date_formatted)

        return x, y

    def to_dict(self):

        '''
        This dict represtnation will be used to provide info for the frontend about each sensor. If more info is required this can be extended later on.
        '''
        
        specific_option_list = []

        if self.specific_options:

            for opt in self.specific_options:
                specific_option_list.append({
                    "option_name": opt,
                    "option_value": self.specific_options[opt]
                })

        dict_rep = {
            "name": self.sensor_type.name,
            "measurement_types": [measurement_type.to_dict() for measurement_type in self.measurement_types],
            "specific_options": specific_option_list
        }


        return dict_rep
        '''
        old hardcoded version of this function
        if value_type == Value_Type.Vector:
            y_one = []
            y_two = []
            y_three = []
            x = []

            for i in range(len(data)):  ## get the last n numbers of the data storage, whereas n equals sample-size
                y_one.append(data[i + 1][0][0])
                y_two.append(data[i + 1][0][1])
                y_three.append(data[i + 1][0][2])
                date: datetime = datetime.strptime(data[i + 1][1], Sensor.DATE_FORMAt_STORAGE)  # makes date object out of string
                date_formatted = date.strftime(Sensor.MORE_READABLE_DATA_FORMAT)  # formats the date in a readable string for the x-axis. #TODO see if this can also be stored as a date and how this changes the graph and maybe even searching for correct x-values
                x.append(date_formatted)

            return x,(y_one,y_two,y_three)
        else:
            x = []
            y = []
            for i in range(len(data)):  ## get the last n numbers of the data storage, whereas n equals sample-size
                y.append(data[i + 1][0])
                date: datetime = datetime.strptime(data[i + 1][1], Sensor.DATE_FORMAt_STORAGE)  # makes date object out of string
                date_formatted = date.strftime(Sensor.MORE_READABLE_DATA_FORMAT)  # formats the date in a readable way for annotating the x-axis. #TODO this much info still looks a little bit clunky in the graph. See if we can make it look better.
                x.append(date_formatted)

            return x,y
        '''