import random

import heartpy as hp
import warnings
warnings.filterwarnings("error")

from src.Data_Processing.Processing_Algorithm import Processing_Algorithm
from src.Measurement_Types.Measurement_Types import Measurement_Type
from src.Measurement_Types.PPG import PPG
from src.Measurement_Types.Unit import Unit


class HeartPy(Processing_Algorithm):


    def __init__(self):
        super().__init__("HeartPy", Unit.Beats_Per_Minute, True, PPG.get_instance(), frequency=1, window_size=10)

    def _process_data_live(self, data, signal_rate):

        try:
             working_data, measures = hp.process(data, signal_rate)
        except RuntimeWarning:
            return float('NaN')
        heart_rate = measures['bpm']

        print(heart_rate)
        print(measures['ibi'])
        return heart_rate

    def _process_data_set(self, data, signal_rate=0, segment_width=None, segment_overlap=None):

        try:
            working_data, measures = hp.process_segmentwise(data, signal_rate, segment_width = segment_width, segment_overlap = segment_overlap)
        except RuntimeWarning:
            return("The algorithm with this settings of segment width and segment overlap did not work. There might be not enough data for one segment.")
        heart_rate = measures['bpm']

        return heart_rate

'''
if __name__ == '__main__':

    data = []
    random.seed(1)
    for i in range(110):
       data.append(random.randint(-5,5))

    working_data, measures = hp.process(data, 100)
    print(measures['bpm'])
    
'''