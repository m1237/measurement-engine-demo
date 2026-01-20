import axios from "axios";
import { debug } from "util";
import { APIURL as config } from "../apiConfig";

/*
export async function connectSensor(sensorName:string, on:boolean) {
    let respo = axios.post(`${config.connect_sensor}${sensorName}/${on}`)
    
    return respo
}

export async function togglePlotting(sensorName:string, on:boolean) {
    return axios.get(`${config.toggle_plotting}${sensorName}/${on}`)
}

export async function toggleProcessing(algoName:string, sensorName:string, on:boolean) {
    return axios.get(`${config.toggle_processing}${algoName}/${sensorName}/${on}`)
}

export async function connection_status() {
    return axios.get(`${config.connection_status}`)
}
*/


export async function connectSensor(sensorName: string, on: boolean) {
    const url = `${config.connect_sensor}${sensorName}/${on}`;
    const response = await fetch(url, {
      method: "POST",
    });
  
    if (!response.ok) {
      throw new Error(`Failed to connect sensor: ${response.status}`);
    }
  
    const data = await parseResponse(response);
    return data;
  }
  
  export async function togglePlotting(sensorName: string, on: boolean) {
    const url = `${config.toggle_plotting}${sensorName}/${on}`;
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`Failed to toggle plotting: ${response.status}`);
    }
  
    const data = await parseResponse(response);
    return data;
  }
  
  export async function toggleProcessing(
    algoName: string,
    sensorName: string,
    on: boolean
  ) {
    const url = `${config.toggle_processing}${algoName}/${sensorName}/${on}`;
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`Failed to toggle processing: ${response.status}`);
    }
  
    const data = await parseResponse(response);
    return data;
  }
  
  export async function connection_status() {
    const url = `${config.connection_status}`;
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`Failed to get connection status: ${response.status}`);
    }
  
    const data = await parseResponse(response);
    return data;
  }


async function parseResponse(response: Response) {
const contentType = response.headers.get("content-type");

if (contentType && contentType.includes("application/json")) {
    return await response.json();
} else if (contentType && contentType.includes("text")) {
    return await response.text();
} else if (contentType && contentType.includes("blob")) {
    return await response.blob();
} else {
    throw new Error("Unsupported response format");
}
}  