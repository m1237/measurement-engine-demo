# Explicit imports to satisfy Flake8
from src.Server.data_server import Data_Server
from src.Core.sensor import Sensor
from src.Instantiation.sensor_instantiation_module import instantiate_sensors
from src.Instantiation.response_instantiation import instantiate_responses
from src.Instantiation.post_processing_algorithm_instantiation_module import instantiate_post_processing_algorithm
from src.Instantiation.live_processing_instantiation_moduel import instantiate_live_processing
from src.Instantiation.classification_instantiation import initiate_classification
from src.Helper.protocol_connection_helper import Protocol_Connection_Helper


if __name__ == '__main__':



    instantiate_sensors()
    instantiate_responses()
    instantiate_post_processing_algorithm()
    instantiate_live_processing()
    initiate_classification()

    server = Data_Server()
    Sensor.data_server_instance = server

    helper = Protocol_Connection_Helper()
    helper.register_for_protocol_of_measurement_engine()

    server.run_app()


