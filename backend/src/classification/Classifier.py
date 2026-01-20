from abc import abstractmethod
from src.Core.streaming_type import Streaming_Type
from src.Core.sensor import Sensor
from tensorflow.keras.optimizers import SGD
from keras.models import model_from_json
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import time


class Classifier():

    instances = []
    gui_instance = None
    live_classifier = []

    @classmethod
    def get_classifier_of_name(cls, name):
        for classifier in cls.instances:
            if(classifier.name == name):
                return classifier
        return None

    @classmethod
    def get_live_classifier_of_name(cls, name):
        for classifier in cls.live_classifier:
            if classifier.name == name:
                return classifier

        return None

    def __init__(self, classification_type, algorithm_type, necessary_sensors, measurement_types, number_of_levels):
        print(number_of_levels)
        self.classification_type = classification_type
        self.necessary_sensors = necessary_sensors
        self.algorithm_type = algorithm_type
        self.activated_algorithm = ''
        self.measurement_types = measurement_types
        self.number_of_levels = number_of_levels
        self.label_for_levels = []
        self.current_streaming_type = Streaming_Type.Real
        self._streaming = False
        self.classification_flag = False
        self.current_sensor = None
        self.text_result = None
        self.data_storage_real_classification = []
        self.data_storage_fake_classification = []
        self.classification_label_storage = []
        self.test_data = []
        self.prediction_label = ''
        self.button = None
        self.button_label = None
        self.activated = False
        
        Classifier.instances.append(self)

        if(len(self.label_for_levels) == 0):
            self.label_for_levels = self.create_standard_labels() #In case there were no labels provided, we can generate them based on the levels classification type

          
        

    @property
    def streaming(self):
        return self._streaming

    @streaming.setter
    def streaming(self, value):
        self._streaming = value
        



    def create_standard_labels(self):
        labels_for_two_levels = ["Low", 'High']
        labels_for_five_levels = ["No", "Low", "Medium", "High", "Higher"] #maybe find something better

        if(self.number_of_levels == 2):
            for label in labels_for_two_levels:
                self.label_for_levels.append(label + self.classification_type)
        elif(self.number_of_levels == 5):
            for label in labels_for_five_levels:
                self.label_for_levels.append(label + self.classification_type)
        else: # if not three or five levels -> provide the most basic labeling we can come up with (e.g. level 1 stress)
            for number in range(self.number_of_levels):
                self.label_for_levels.append("level {0} {1}".format(number, self.classification_type))
        return self.label_for_levels


    number_of_levels = None
    # Maybe also for replay data. But I think it always depends on a replay file from a sensor



    def stream_fake_data_of_level(self, level):
        label_to_write_into_storage = self.label_for_levels[int(level)-1]
        self.data_storage_fake_classification.append(label_to_write_into_storage)

    def get_data_of_current_streaming_type(self):
        if(self.current_streaming_type == Streaming_Type.Real):
            return self.data_storage_real_classification
        else:
            return self.data_storage_fake_classification

    def change_current_streaming_type(self, streaming_type):
        self.current_streaming_type = Streaming_Type[streaming_type]



    def stop_classification(self):
        self.streaming = False
        self.activated = False



    def to_dict(self):
        
        #returns a dictionary representation so the info can be parsed to the frontend
        dict_rep = {}
        dict_rep["classification_type"] = self.classification_type,
        dict_rep["algorithm_type"] = [algorithm.name for algorithm in self.algorithm_type]
        dict_rep["necessary_sensors"] = [sensor.name for sensor in self.necessary_sensors]
        dict_rep["measurement_types"] = [measurement_type.to_dict()["name"] for measurement_type in self.measurement_types] 
        dict_rep["number_of_levels"] = self.number_of_levels,
        dict_rep["label_for_levels"] = self.label_for_levels 
                            
        return dict_rep

    @abstractmethod
    def start_real_classification(self):
        pass
        # first make a check with check_if_classification_is_possible and then start the classification









