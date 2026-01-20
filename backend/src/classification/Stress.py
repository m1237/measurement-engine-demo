from src.Measurement_Types.EDA import EDA
from src.classification.Classifier import Classifier
from src.classification.classification_types import Classification_Type
from src.Core.sensor_types import Sensor_Type
import time
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from src.Measurement_Types.Measurement_Types import Measurement_Type
from src.Core.sensor import Sensor
from tensorflow.keras.optimizers import SGD
from keras.models import model_from_json
from src.classification.algorithm_types import Algorithm_Type



class Stress(Classifier):

    def __init__(self, number_of_levels):
        self.result = None
        self.count = 0
        super().__init__(classification_type= Classification_Type.Stress.name, algorithm_type = [Algorithm_Type.LSTM], necessary_sensors = [Sensor_Type.Empatica], measurement_types = [EDA.get_instance()], number_of_levels= number_of_levels)
        self.classification_type= Classification_Type.Stress.name
        self.model_path_json = 'backend/src/models/LSTM_5_epochs_dropout.json'
        self.model_path_h5 = 'backend/src/models/LSTM_5_epochs_dropout.h5'
        self.model_from_disc = None
        self.prediction_result = None        
        self.loading_model = False

    def start_real_classification(self):
        
        self.load_and_compile_classifier_model()
        if self.check_if_classification_is_possible() == True:
            print("Classification started...", flush= True)
            self.streaming = True

            self.classify_data()        
            print(self.count, self.classification_type, flush= True)
            self.count += 1
            time.sleep(1)

        else:
            print("Classification could not start", flush= True)


    def check_if_classification_is_possible(self):
        # check if all the necessary sensors are connected and ready to supply data
        for sensor in Sensor.instances:
            print(sensor, sensor.sensor_type, self.necessary_sensors, flush= True)
            if sensor.sensor_type in self.necessary_sensors:
                print("yes", sensor.streaming, self.loading_model, flush = True)
                if sensor.streaming and self.loading_model:
                    print(sensor.sensor_type, "OKK", sensor.streaming, flush= True)
                    self.classification_flag = True
                    self.current_sensor = sensor
                else:
                    print("Classification is not possible", flush= True)
                    self.classification_flag = False
                
                return self.classification_flag


    def load_and_compile_classifier_model(self):
        # Load the model of interest
        json_file = open(self.model_path_json, 'r')
        json = json_file.read()
        json_file.close()
        self.model_from_disc = model_from_json(json)
        self.model_from_disc.load_weights(self.model_path_h5)
        print("Model was loaded succesfully...", flush= True)
        optimizer = SGD(learning_rate=0.05)
        self.model_from_disc.compile(loss = 'binary_crossentropy', optimizer = optimizer, metrics = ['accuracy'])
        self.loading_model = True
        return self.loading_model



    def extract_features(self, data_storage_real_classification):

        max_tmp = np.amax(data_storage_real_classification)
        min_tmp = np.amin(data_storage_real_classification)
        mean_tmp = np.mean(data_storage_real_classification)
        dynamic_range_tmp = max_tmp - min_tmp
        std_tmp = np.std(data_storage_real_classification)
        features = [max_tmp, min_tmp, mean_tmp, dynamic_range_tmp, std_tmp]
        #print(features)
        self.test_data = np.reshape(features, (1, len(features)))
        scaler = MinMaxScaler(feature_range=(0,1))
        scaler.fit_transform(self.test_data)
        self.test_data = np.reshape(self.test_data, (1,1, len(features)))
        #print(self.test_data)

    def classify_data(self):
        print("Please wait 20 seconds for classification result", flush=True)
        while True:
            self.data_storage_real_classification = list(self.current_sensor.real_data_storage[self.measurement_types[0]].values())[-20:]
            #print(self.data_storage_real_classification)
            if len(self.data_storage_real_classification) == 20:
                self.data_storage_real_classification = (np.array(self.data_storage_real_classification)[:,0]).astype(float)
                #print(self.data_storage_real_classification)
                self.extract_features(self.data_storage_real_classification)
                self.prediction_result = self.model_from_disc.predict(self.test_data, batch_size=1, verbose=1)
                #print(self.prediction_result)
                if self.prediction_result <= 0.5:
                    self.prediction_label = self.label_for_levels[0]
                else:
                    self.prediction_label = self.label_for_levels[1]
                self.classification_label_storage.append(self.prediction_label)
                print("Prediction result:", self.prediction_result, "Prediction label:", self.prediction_label, flush = True)
                #self.gui_instance.classifier_canvas.itemconfigure(self.text_result, text = self.prediction_label)
            time.sleep(1)
            if self.streaming == False or self.activated == False:
                print(self.streaming, flush = True)
                break
        print("Classification was completed!")



        
    




