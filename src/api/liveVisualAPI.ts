
import { APIURL as config } from "../apiConfig";
// import axios from "axios-1.4";

/*
export async function dropdownlist() {
  console.log(axios.VERSION)
  return axios.get(`${config.dropdownlist}`);
}
*/

export async function dropdownlist() {
  const response = await fetch(`${config.dropdownlist}`);
  if (response.ok) {
    const data = await response.json();
    return { data };
  } else {
    throw new Error(`Error fetching dropdown list: ${response.status}`);
  }
}

export async function fetchLiveAlgorithmsStreamingFromServer() {
  const response = await fetch(`${config.streaming_live_algorithms}`);
  if (response.ok) {
    const data = await response.json();
    return { data };
  } else {
    throw new Error(`Error fetching dropdown list: ${response.status}`);
  }
}

/*
export async function create_plot_for_sensor(
  sensor_name: string,
  measurement_type: string
) {
  return axios.post(
    `${config.create_plot_for_sensor}${sensor_name}/${measurement_type}`
  );
}*/

export async function create_plot_for_sensor(
  sensor_name: string,
  measurement_type: string,
  data_length: number
) {
  const response = await fetch(
    `${config.create_plot_for_sensor}${sensor_name}/${measurement_type}/${data_length}`,
    { method: "POST" }
  );
  if (response.ok) {
    const data = await response.json();
    return { data };
  } else {
    throw new Error(`Error creating plot for sensor: ${response.status}`);
  }
}

export async function request_standard_statistics_for_sensor(
  sensor_name: string,
  measurement_type: string
) {
  const response = await fetch(
    `${config.get_standard_statistics}${sensor_name}/${measurement_type}`,
    { method: "GET" }
  );
  if (response.ok) {
    const data = await response.json();
    return { data };
  } else {
    throw new Error(`Error creating plot for sensor: ${response.status}`);
  }
}

export async function request_plot_for_live_algorithm(
  algorithm_name: string,
  storage_identifier: string,
  data_length: number
) {
  const response = await fetch(
    `${config.request_live_algorithm_plot}/${algorithm_name}/${storage_identifier}/${data_length}`,
    { method: "POST" }
  );
  if (response.ok) {
    const data = await response.json();
    return { data };
  } else {
    throw new Error(`Error creating plot for sensor: ${response.status}`);
  }
}