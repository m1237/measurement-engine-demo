import errno
import json
import os
import threading
import abc
import time
from datetime import datetime

import itertools

from src.Measurement_Types.Measurement_Types import Measurement_Type
from src.Server.data_server import Data_Server
from src.Core.sensor import Sensor
from src.Core.streaming_type import Streaming_Type


class Processing_Algorithm():


    instances = []

    @classmethod
    def get_processing_algorithm_of_name(cls, name):
        for algo in cls.instances:
            if algo.name == name:
                return algo

        return("No Algorithm found!")

    """
          Construct a new 'Processing_Algorithm' object.

          :param frequency: the frequency in HZ. Determines how often this algorithm should be executed when live.
          :param window_size: the window size is a factor that determines how much data should be used for one calculation of the algorithm. This factor is multiplied with the sampling frequency of the required measurement type.
           So if the sensor has a frequency of 64 hz and window size is 2, the algorithm will use the last 128 samples to calculate its result.
           . Default: 1.
           :param requires_signal_rate: this info is important for the user interface. If this is true, then we need an additional sensor input for someone who wants to process a whole data set as we need knowledge about the signal rate
           :param requires_segment_width: this info is important for the user interface. If this is true, then we need two additional input fields for a use to provide a segment width and overlap when processing of a whole data set is rquired. 

    """
    def __init__(self, name, unit, is_eligible_for_live_processing, required_measurement_type:Measurement_Type, frequency, window_size = 1, available_in_gui = True, requires_signal_rate = True, requires_segment_width = True):
        self.name = name
        self.unit = unit
        self.is_eligible_for_live_processing = is_eligible_for_live_processing
        self.required_measurement_type = required_measurement_type
        self.frequency = frequency
        self.window_size = window_size
        self.available_in_gui = available_in_gui
        self.sensors_this_algorithm_is_running_on = [] #As the same algorithm can run on the data of more than one sensor, this needs to be a list.
        self.data_storage = {}
        self.run_live_processing = {} #This is acutally a dictionary as this can run for more than one algorithm.
        self.suitable_sensors = []
        self.create_list_of_suitable_sensors()
        self.requires_signal_rate = requires_signal_rate
        self.signal_rates = {}
        self.requires_segment_width = requires_segment_width
        Processing_Algorithm.instances.append(self)


    def change_live_processing_status(self, value, sensor_name):
        self.run_live_processing[sensor_name] = value
        Data_Server.get_instance().update_processing_algorithm(self.name, sensor_name, value)

    #called at inializaton to have this overview in the sensor
    def create_list_of_suitable_sensors(self):
        for sensor in Sensor.instances:
            if sensor.measurement_types.__contains__(self.required_measurement_type):
                self.suitable_sensors.append(sensor.sensor_type.name) #I choose just the name, so it is easier to make the comparison with JINA2 on the html page.

    def start_live_processing_for_sensor(self, sensor: Sensor):

        self.sensors_this_algorithm_is_running_on.append(sensor)
        self.data_storage[sensor.sensor_type.name] = []

        if not self.is_eligible_for_live_processing:
            print("The {0} algorithm is not eligible for live streaming.".format(self.name))
            return

        current_streaming_type = sensor.current_streaming_type

        if current_streaming_type == Streaming_Type.Real:
            if not sensor.connected:
                message = "The sensor {0} is not connected so the data processing can't be started".format(sensor.name)
                Data_Server.get_instance().update_log(message)
                print(message)
                return


        if not sensor.measurement_types.__contains__(self.required_measurement_type):
            message = "The sensor {0} doesn't contain the neccessary {1} data to start this algorithm.".format(sensor.name, self.required_measurement_type.name)
            Data_Server.get_instance().update_log(message)
            print(message)
            return

        relevant_data = sensor.get_data_of_given_type(self.required_measurement_type, current_streaming_type)
        if len(relevant_data) == 0:
            message = "The storage of {0} data for measurement type {1} of the {2} sensor doesn't contain any data. The processsing was not started.".format(current_streaming_type.name, self.required_measurement_type.name, sensor.name)
            Data_Server.get_instance().update_log(message)
            print(message)
            return

        signal_rate = sensor.get_frequency_of_measurement_type(self.required_measurement_type)
        self.signal_rates[sensor.sensor_type.name] = signal_rate

        thread = threading.Thread(target=self.start_process_data_live_threat, args=(self.window_size*signal_rate, sensor, self.frequency))
        thread.start()

    def write_to_json_for_sensor(self, sensor_name):

        #TODO: Update this so it takes a function of Write_To_File_Helper
        if len(self.data_storage[sensor_name]) == 0:
            return

        from src.Deprecated.gui_interaction import Interaction
        experiment_number = Interaction.get_instance().get_experiment_name()
        filename = 'Storage/{0}/{1}/{2}.json'.format(experiment_number, sensor_name, self.name)

        print("in write_to json in process: " + os.path.dirname(filename))
        if not os.path.exists(os.path.dirname(filename)):
            try:
                os.makedirs(os.path.dirname(filename))
            except OSError as exc:  # Guard against race condition
                if exc.errno != errno.EEXIST:
                    raise

        with open(filename, "w") as data_file:

            json.dump({"data": self.data_storage[sensor_name]}, data_file, indent=1)

            data_file.close()


    def store_data(self, data, sensor_name, timestamp = None):
        #very simplistic - but there might be more functionality in the future
        if timestamp == None:
            timestamp = datetime.utcnow()
        self.data_storage[sensor_name].append((data, str(timestamp)))

    def stop_streaming(self):
        for sensor in self.sensors_this_algorithm_is_running_on:
            self.change_live_processing_status(False, sensor.sensor_type.name)
            self.write_to_json_for_sensor(sensor.sensor_type.name)

    def start_process_data_live_threat(self, sample_size, sensor, frequency):

        self.change_live_processing_status(True, sensor.sensor_type.name)#inform GUI

        while self.run_live_processing[sensor.sensor_type.name]:

            data_to_process = []

            if sample_size < Sensor.VISUALIZATION_MAX_LENGTH:
                #then we can simply use thei visualization storage to read out the data
                relevant_data = sensor.visualization_data_storage[self.required_measurement_type]


                if len(relevant_data) < sample_size:
                    #There is less data in the storage then sample-size for this algorithm
                    continue

                data_to_process = list(itertools.islice(relevant_data, (len(relevant_data)-1) - sample_size, len(relevant_data)))

            else:
                # now we have to read it out of the actual storage
                relevant_data = sensor.get_data_of_current_streaming_type(self.required_measurement_type)

                if len(relevant_data) < sample_size:
                    continue

                for i in range(len(relevant_data) - sample_size, len(relevant_data) - 1): ## get the last n numbers of the data storage, whereas n equals sample-size
                    data_to_process.append(relevant_data[i][0]) #have to do it like this as dictionaries are not indexed



            processed_data = self._process_data_live(data_to_process, sensor.get_frequency_of_measurement_type(self.required_measurement_type))
            if processed_data:
                self.store_data(processed_data, sensor.sensor_type.name, self.signal_rates[sensor.sensor_type.name])
            else:
                raise ValueError("The process_data function has not returned any data!")

            time.sleep(1/frequency)

    '''
        This function has to return the value that results after processing of given data
    '''

    def process_data_set(self, data, sensor: Sensor = None, signal_rate = 0, segment_width = None, segment_overlap = None):

        #if signal rate is required then we need either a sensor or a signal rate provided to retrieve that info
        if self.requires_signal_rate:
            if not sensor and signal_rate == 0:
                raise ValueError("To process a data set, the algorithm requires either a sensor or a signal rate.")

        #if a sensor is provided, we read out its singal frequency
        if sensor:
            signal_rate = sensor.get_frequency_of_measurement_type(self.required_measurement_type)

        if self.requires_segment_width:
            if segment_width == None:
                return("This algorithm requires a segment width to work.")

            if segment_overlap == None:
                return("This algorithm requires a segment overlap value to work.")

        #if the data was provided directly as a list then just put it into the algorithm
        if type(data) == list:
            return self._process_data_set(data, signal_rate, segment_width = segment_width, segment_overlap = segment_overlap)
        else:
            #from here I expect that data was stored in a way how we store it.
            data = data["data"]
            actual_data = []

            ## just remove the unneccessary parts.
            for i in range(len(data)):
                actual_data.append(data[str(i+1)][0])

            return self._process_data_set(actual_data, signal_rate= signal_rate, segment_width = segment_width, segment_overlap = segment_overlap)
        
    def to_dict(self):
        dict_representation = {}
        dict_representation["name"] = self.name
        dict_representation["suitable_sensors"] = self.suitable_sensors
        dict_representation["measurement_type"] = self.required_measurement_type.to_dict()["name"]
        return dict_representation

    '''
        Usually sensor_name is assigned when in live processign, while the singal rate is assinged when a whole data_set is processed
    '''
    @abc.abstractmethod
    def _process_data_live(self, data, signal_rate = 0):
        pass

    @abc.abstractmethod
    def _process_data_set(self, data, signal_rate = 0, segment_width = None, segment_overlap = None ):
        pass

