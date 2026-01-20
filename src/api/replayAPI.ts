import axios from "axios";
import { APIURL as config } from "../apiConfig";
/*

export async function add_replay_file(
  sensorName: string,
  file: string,
  data: any
) {
  return axios.post(`${config.add_replay_file}${sensorName}/${file}`, data, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

*/
export async function add_replay_file(
  sensorName: string,
  data: any
) {
  const url = `${config.add_replay_file}${sensorName}/`;
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: data,
  });
 
  if (!response.ok) {
    throw new Error(`Failed to add replay file: ${response.status}`);
  }

  return response.json();
}

export async function remove_replay_file(
  sensorName: string,
  measurementType: string
) {
  const url = `${config.remove_replay_file}${sensorName}/${measurementType}`;
  

  const response = await fetch(url, {
    method: "GET"
  });
 
  if (!response.ok) {
    throw new Error(`Failed to add remove file: ${response.status}`);
  }

  return response.text();
}