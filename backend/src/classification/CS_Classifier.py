import datetime
import time
import os
import torch.nn
import pandas as pd
import pickle
from src.classification.Classifier import Classifier
from src.classification.classification_types import Classification_Type
from src.Core.sensor import Sensor
from src.Core.sensor_types import Sensor_Type
from src.Measurement_Types.ACC import ACC
from src.Measurement_Types.PPG import PPG
from src.Measurement_Types.EDA import EDA
from src.Measurement_Types.HR import HR
from src.Measurement_Types.IBI import IBI
from src.Measurement_Types.TEMP import TEMP
from src.classification.CS_LSTM import CSClassifierLSTM
from src.classification.CS_CNN_LSTM import CSClassifierCNNLSTM
from src.classification.CS_SVM import CSClassifierSVM
import src.classification.utils as utils
from src.dataloaders.util import merge_dfs, generate_timeseries_data
from src.dataloaders.Dataloader_Sensors import preprocess_eyetracking_data, preprocess_sensor_data
from src.dataloaders.util import acc_json_to_dataframe_live, json_to_dataframe_live
from src.dataloaders.pre_processing_data import ecg_to_heart_rate, hr_to_ibi
from src.classification.algorithm_types import Algorithm_Type
import sys


class CS_Classifier(Classifier):
    """Class for the cybersickness classifier."""

    def __init__(self, number_of_levels):
        self.result = None
        self.count = 0

        sensors = [Sensor_Type.Empatica, Sensor_Type.Polar_h10]
        #sensors = [Sensor_Type.Empatica, Sensor_Type.Polar_h10, Sensor_Type.Engine]
        measurements = [ACC.get_instance(), PPG.get_instance(), EDA.get_instance(), HR.get_instance(), IBI.get_instance(), TEMP.get_instance()]
        super().__init__(classification_type = Classification_Type.Cybersickness.name, algorithm_type = [Algorithm_Type.LSTM, Algorithm_Type.CNN_LSTM, Algorithm_Type.SVM], necessary_sensors=sensors, measurement_types=measurements, number_of_levels= number_of_levels)

        self.classification_type = Classification_Type.Cybersickness.name
        #self.algorithm_type = Algorithm_Type.LSTM
        print(sys.path[0], flush = True)
        self.classifier_lstm_folder_path = os.path.join(sys.path[0], 'src/models', '20230324-232410_67_lstm_0.678_0.500') 
        self.classifier_cnn_lstm_folder_path = os.path.join(sys.path[0], 'src/models', '20230325-154926_230_cnn_0.707_0.415') 
        self.classifier_svm_folder_path = os.path.join(sys.path[0], 'src/models', '20230324-213912_4_svm_0.463_0.316') 
        self.timesteps = 30
        self.buffer = '0.5 S'

        


    def start_real_classification(self):
        self.load_and_compile_classifier_model()
        if self.check_if_classification_is_possible() == True:
            print("Classification started...", flush= True)
            self.streaming = True
            self.classify_data()
            #while True:
            #    print(self.count, self.classification_type, self.streaming, self.activated, flush= True)
            #    self.count += 1
            #    time.sleep(1)
            #    if self.streaming == False or self.activated == False:
            #        print(self.streaming, self.activated, flush = True)
            #        break

        else:
            print("Classification could not start", flush= True)



    def check_if_classification_is_possible(self):
        # check if all the necessary sensors are connected and ready to supply data
        everything_ready = True
        if self.loading_model:
            for sensor_type in self.necessary_sensors:
                current_sensor = None
                for sensor in Sensor.instances:
                    if sensor_type.value == sensor.sensor_type.value:
                        current_sensor = sensor
                        break
                if current_sensor:
                    # check if sensor is streaming
                    if not current_sensor.streaming:
                        everything_ready = False
                        break
                    else:
                        if self.current_sensor:
                            self.current_sensor.append(current_sensor)
                        else:
                            self.current_sensor = [current_sensor]
                        print(current_sensor.sensor_type, " ", current_sensor.streaming, flush=True)
                else:
                    everything_ready = False
                    break
        else:
            everything_ready = False
        self.classification_flag = everything_ready
        return self.classification_flag


    def load_and_compile_classifier_model(self):
        # load cybersickness classifier
        if self.activated_algorithm== Algorithm_Type.SVM.name:
            # init model
            classifier_type = 'svm'
            file_path = os.path.join(self.classifier_svm_folder_path, f'{classifier_type}.pkl')
            with open(file_path, 'rb') as file:
                cs_classifier = pickle.load(file)
            #cs_classifier = pickle.load(open(os.path.join(self.classifier_svm_folder_path, f'{classifier_type}.pkl'), 'rb'))
        elif self.activated_algorithm== Algorithm_Type.LSTM.name:

            # read arguments from config file
            classifier_type = 'lstm'
            num_classes, input_size, hidden_size1, hidden_size2, dropout_lstm, dropout_p = \
                utils.read_params_lstm(os.path.join(self.classifier_lstm_folder_path, f'{classifier_type}_layers.txt'))
            #print(num_classes, input_size, hidden_size1, hidden_size2, dropout_lstm, dropout_p, flush= True)
            #print(os.path.join(self.classifier_lstm_folder_path, f'{classifier_type}_layers.txt'), flush = True)

            # init model
            cs_classifier = CSClassifierLSTM(num_classes, input_size, hidden_size1, hidden_size2,
                                             dropout_lstm=dropout_lstm, dropout_p=dropout_p)
            cs_classifier.load_state_dict(torch.load(os.path.join(self.classifier_lstm_folder_path,
                                                    f'{classifier_type}.pth.tar')).get('model_state_dict'))
            cs_classifier.eval()
        elif self.activated_algorithm== Algorithm_Type.CNN_LSTM.name:
            # read arguments from config file
            classifier_type = 'cnn'
            num_classes, feature_size, input_size, hidden_size1, hidden_size2, dropout_lstm, dropout_p = \
                utils.read_params_cnn(os.path.join(self.classifier_cnn_lstm_folder_path, f'{classifier_type}_layers.txt'))

            # init model
            cs_classifier = CSClassifierCNNLSTM(num_classes, feature_size, input_size, hidden_size1, hidden_size2,
                                                dropout_lstm=dropout_lstm, dropout_p=dropout_p)
            cs_classifier.load_state_dict(torch.load(os.path.join(self.classifier_cnn_lstm_folder_path,
                                                    f'{classifier_type}.pth.tar')).get('model_state_dict'))
            cs_classifier.eval()
        self.model_from_disc = cs_classifier
        self.loading_model = True
        return self.loading_model





    def classify_data(self):
        # calculate seconds with timesteps and buffer
        seconds = self.timesteps * (float(self.buffer.split(' ')[0])) + 5  # buffer is '0.1 S' --> cast to int
        #print(seconds, flush = True)
        while True:
            print(f'Please wait {seconds} seconds for classification result', flush=True)
            time.sleep(seconds)
            # load and merge data from different sensors
            df_list = list()
            # adapt time because timestamps from sensors are 2 hours behind (because of Sommerzeit?)
            # but: eyetracking timestamps are correct --> change those
            time_now = datetime.datetime.now()
            time_last_x_seconds = time_now - datetime.timedelta(seconds=seconds)
            time_now_sensors = datetime.datetime.now()
            time_last_x_seconds_sensors = time_now_sensors - datetime.timedelta(seconds=seconds)
            sensors_list = ['empatica_acc_x_value', 'bvp', 'eda', 'hr', 'ibi', 'temp', 'h10_acc_x_value', 'ecg']
            # data from Empatica and Polar H10 are preprocessed and merged.
            # then, Eyetracking data is added
            for sensor in self.current_sensor:
                keys = list(sensor.real_data_storage.keys())
                # we have to differentiate between the different sensor types
                if sensor.sensor_type.name == 'Empatica':
                    # ACC, BVP, IBI, HR_EMPATICA, EDA, TEMP
                    for key in keys:
                        raw_data = sensor.real_data_storage[key]
                        #print("Raw data of Empatica ACC : ", raw_data, flush=True)
                        if key.name == 'ACC':
                            df_acc = acc_json_to_dataframe_live(raw_data, 'empatica_acc_')
                            #print("Here is df_acc values:",df_acc, flush=True)
                            df_acc = utils.get_data_last_x_seconds(df_acc, "timestamp", "%Y-%m-%d %H:%M:%S.%f",
                                                                   time_now_sensors, time_last_x_seconds_sensors)
                            #print("Here is df_acc values:",df_acc, flush=True)
                            
                        elif key.name == 'PPG':
                            df_bvp = json_to_dataframe_live(raw_data, 'bvp')
                            df_bvp = utils.get_data_last_x_seconds(df_bvp, "timestamp", "%Y-%m-%d %H:%M:%S.%f",
                                                                   time_now_sensors, time_last_x_seconds_sensors)
                        elif key.name == 'IBI':
                            pass  # calculate with python lib
                            # df_ibi = json_to_dataframe_live(raw_data, 'ibi')
                        elif key.name == 'HR':
                            pass  # calculate with python lib
                            # df_hr = json_to_dataframe_live(raw_data, 'hr')
                        elif key.name == 'EDA':
                            df_eda = json_to_dataframe_live(raw_data, 'eda')
                            df_eda = utils.get_data_last_x_seconds(df_eda, "timestamp", "%Y-%m-%d %H:%M:%S.%f",
                                                                   time_now_sensors, time_last_x_seconds_sensors)
                        elif key.name == 'TEMP':
                            df_temp = json_to_dataframe_live(raw_data, 'temp')
                            df_temp = utils.get_data_last_x_seconds(df_temp, "timestamp", "%Y-%m-%d %H:%M:%S.%f",
                                                                   time_now_sensors, time_last_x_seconds_sensors)
                elif sensor.sensor_type.name == 'Polar_h10':
                    # ECG, ACC
                    for key in keys:
                        raw_data = sensor.real_data_storage[key]
                        #print("Raw data of Polar ECG : ", raw_data, flush=True)
                        if key.name == 'ECG':
                            df_ecg = json_to_dataframe_live(raw_data, 'ecg')
                            #print("Here is the df_ecg", df_ecg, flush=True)
                            df_ecg = utils.get_data_last_x_seconds(df_ecg, "timestamp", "%Y-%m-%d %H:%M:%S.%f",
                                                      time_now_sensors, time_last_x_seconds_sensors)
                            #print("Here is the df_ecg", df_ecg, flush=True)
                            
                        elif key.name == 'ACC':
                            df_h10_acc = acc_json_to_dataframe_live(raw_data, 'h10_acc_')
                            df_h10_acc = utils.get_data_last_x_seconds(df_h10_acc, "timestamp", "%Y-%m-%d %H:%M:%S.%f",
                                                                   time_now_sensors, time_last_x_seconds_sensors)
                elif sensor.sensor_type.name == 'Engine':
                    for key in keys:
                        # only one key in eyetracking data
                        if key != 'cs_timestamps':
                            data_df = pd.DataFrame.from_records(sensor.real_data_storage[key])
                            data_last_x_seconds_df = utils.get_data_last_x_seconds(data_df, "current_timestamp", "%Y%m%d%H%M%S%f",
                                                      time_now, time_last_x_seconds)
                        # preprocess: extract fields, scale
                        df_eyetracking = preprocess_eyetracking_data(data_last_x_seconds_df)
            # calculate IBI and HR with python libraries
            df_hr = ecg_to_heart_rate(df_ecg)
            df_hr = utils.get_data_last_x_seconds(df_hr, "timestamp", "%Y-%m-%d %H:%M:%S.%f",
                                                   time_now_sensors, time_last_x_seconds_sensors)
            df_ibi = hr_to_ibi(df_hr)
            df_ibi = utils.get_data_last_x_seconds(df_ibi, "timestamp", "%Y-%m-%d %H:%M:%S.%f",
                                                   time_now_sensors, time_last_x_seconds_sensors)
            # merge and preprocess Empatica + Polar H10
            dfs = [df_acc, df_bvp, df_eda, df_hr, df_ibi, df_temp, df_h10_acc, df_ecg]
            # timestamps are unified in preprocessing
            #df_list.append(df_eyetracking)

            #new_layers = torch.full((41, 30, 8), 0.1, dtype=torch.float32)
            #new_tensor = torch.cat((original_tensor, new_layers), dim=2)

            df_list.append(preprocess_sensor_data(sensors_list, dfs, self.buffer,
                                                     df_acc, df_h10_acc, df_bvp, df_eda, df_hr, df_ibi, df_temp, df_ecg))
            print("dflist without eye-tracking:", df_list, flush=True)
            # merge dataframes from different sensors
            data_dfs_merged = merge_dfs(df_list, self.buffer)
            data_dfs_merged.dropna(inplace=True)

            # convert to tensor, reshape
            features = torch.tensor(data_dfs_merged.values, dtype=torch.float32)
            #features_new = torch.cat((features, new_layers), dim=2)

            # Create a tensor with values of 0.1
            
                      

            if self.activated_algorithm != Algorithm_Type.SVM.name:
                features = features.unsqueeze(1)
                # generate timeseries data
                features = generate_timeseries_data(features, self.timesteps)
                new_layers = torch.full((features.size(0), features.size(1), 8), 0.01, dtype=torch.float32)
                print("features and new_layers 1:", features.size(), new_layers.size(), flush=True)
                features_with_new_layers = torch.cat((features, new_layers), dim=2)
                print("features_with_new_layers:", features_with_new_layers.size(), flush=True)


            print("Retrieved and preprocessed data. Classifying...")
            if self.activated_algorithm != Algorithm_Type.SVM.name:
                outputs = self.model_from_disc.forward(features_with_new_layers)
                outputs = self.model_from_disc.sigmoid(outputs.detach())
                if torch.mean(outputs).item() <= 0.5:
                    self.prediction_label = self.label_for_levels[0]
                else:
                    self.prediction_label = self.label_for_levels[1]
            else:
                new_layers = torch.full((features.size(0), 8), 0.01, dtype=torch.float32)
                #print("SVM feature size",features.size(), flush=True)
                #print("8 layers:", new_layers.size(), flush=True)
                features_with_new_layers = torch.cat((features, new_layers), dim=1)
                outputs = self.model_from_disc.predict(features_with_new_layers)
                if outputs.mean() <= 0.5:
                    self.prediction_label = self.label_for_levels[0]
                else:
                    self.prediction_label = self.label_for_levels[1]
            print(self.prediction_label, flush=True)
            #self.gui_instance.classifier_canvas.itemconfigure(self.text_result, text=self.prediction_label)
            time.sleep(1)
            if self.streaming == False or self.activated == False:
                print(self.streaming, flush = True)
                break
        print("Classification was completed!", flush=True)







