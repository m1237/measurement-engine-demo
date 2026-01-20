from src.Data_Processing.Processing_Algorithm import Processing_Algorithm
from src.Measurement_Types.EDA import EDA
from src.Measurement_Types.Measurement_Types import Measurement_Type
from src.Measurement_Types.Unit import Unit
import pandas as pd
import neurokit2 as nk

class EDA_Phasic_Component(Processing_Algorithm):
    def __init__(self):
        super().__init__("EDA_Phasic_Component", Unit.Microsiemens, True, EDA.get_instance(), 0.5, 6, requires_segment_width = False)

    def _process_data_live(self, data, sensor_name):
        eda_signal = nk.signal_sanitize(data)

        # Series check for non-default index
        if type(eda_signal) is pd.Series and type(eda_signal.index) != pd.RangeIndex:
            eda_signal = eda_signal.reset_index(drop=True)

        # Preprocess
        eda_cleaned = eda_signal  # Add your custom cleaning module here or skip cleaning


        eda_decomposed = nk.eda_phasic(eda_cleaned, sampling_rate=self.signal_rate)



        # Find peaks

        peak_signal, info = nk.eda_peaks(
            eda_decomposed["EDA_Phasic"].values,
            sampling_rate=self.signal_rate,
            method="neurokit",
            amplitude_min=0.1,
        )
        info['sampling_rate'] = self.signal_rate  # Add sampling rate in dict info

        signals = pd.DataFrame({"EDA_Raw": eda_signal, "EDA_Clean": eda_cleaned})

        signals = pd.concat([signals, eda_decomposed, peak_signal], axis=1)

        cleaned = signals["EDA_Clean"]
        features = [info["SCR_Onsets"], info["SCR_Peaks"], info["SCR_Recovery"]]

        plot = nk.events_plot(features, cleaned, color=['red', 'blue', 'orange'])

        '''
        # Store
        signals = pd.DataFrame({"EDA_Raw": eda_signal, "EDA_Clean": eda_cleaned})

        signals = pd.concat([signals, eda_decomposed, peak_signal], axis=1)

        return signals, info

        #signals, info = nk.eda_process(data, sampling_rate=self.signal_rate)
        '''

    def _process_data_set(self, data, signal_rate = 0, segment_width = None, segment_overlap = None ):

        signals, info = nk.eda_process(data, sampling_rate=signal_rate)

        cleaned = signals["EDA_Clean"]
        features = [info["SCR_Onsets"], info["SCR_Peaks"], info["SCR_Recovery"]]

        #plot = nk.events_plot(features, cleaned, color=['red', 'blue', 'orange'])

        #plot.show()

        test = nk.eda_phasic(cleaned, sampling_rate=signal_rate)

        return [2]