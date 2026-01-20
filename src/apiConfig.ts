import config from "./config";
const BASE_URL = config.BASE_URL;

export const APIURL = {
  // sensor : `${BASE_URL}/sensor/Empatica/TEMP`,
  sensor: `${BASE_URL}/sensor/Polar_h10/ECG`,
  streamToggle: `${BASE_URL}/toggle_streaming/`,
  experimentName: `${BASE_URL}/set_name/`,
  update_streaming_mode: `${BASE_URL}/update_streaming_mode/`,
  set_fake_value: `${BASE_URL}/set_fake_value/`,
  connect_sensor: `${BASE_URL}/connect_sensor/`,
  toggle_plotting: `${BASE_URL}/toggle_plotting/`,
  toggle_processing: `${BASE_URL}/toggle_processing/`,
  dropdownlist: `${BASE_URL}/sensor/dropdownlist`,
  create_plot_for_sensor: `${BASE_URL}/create_plot_for_sensor/`,
  connection_status: `${BASE_URL}/get_status/`,
  add_replay_file: `${BASE_URL}/add_replay_file/`,
  fetch_post_processing: `${BASE_URL}/get_post_process_algorithms/`,
  update_post_processing: `${BASE_URL}/update_post_processing_algorithms/`, 
  get_classifiers: `${BASE_URL}/get_classifiers/`,
  update_classifiers: `${BASE_URL}/update_classifier_algorithm/`,
  remove_replay_file: `${BASE_URL}/remove_replay_file/`,
  get_standard_statistics: `${BASE_URL}/sensor-basic-statistics/`,
  get_classifier_result: `${BASE_URL}/classifier-old/`,
  sensor_info:`${BASE_URL}/get_sensor_info`,
  streaming_live_algorithms: `${BASE_URL}/get-streaming-live-algorithms`,
  request_live_algorithm_plot: `${BASE_URL}/create_data_for_live_algorithm`,
  fetch_live_processing: `${BASE_URL}/get_live_process_algorithms/`,
  toggle_live_algorithm: `${BASE_URL}/toggle_live_process_algorithm`,
  specific_option: `${BASE_URL}/new_specific_option_value/`
};
