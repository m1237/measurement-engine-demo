import axios from "axios";
import { APIURL as config } from "../apiConfig";

/*
export async function getSensor(): Promise<any>{
    return axios.get(`${config.sensor}`)
}

export async function getFakeValues(sensorName:string, type:string, value:number):Promise<any>{
    return axios.get(`${config.set_fake_value}${sensorName}/${type}/${value}`)
}

export async function update_streaming_mode(object_name:string,mode:string):Promise<any> {
    return axios.post(`${config.update_streaming_mode}${object_name}/${mode}`)
}
*/

export async function getSensorInfo(): Promise<any> {

  const url = `${config.sensor_info}`
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to get sensor data: ${response.status}`);
  }

  const data = await parseResponse(response)

  return data
}



export async function getSensor(): Promise<any> {
    const url = `${config.sensor}`;
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`Failed to get sensor: ${response.status}`);
    }
  
    const data = await parseResponse(response);
    return data;
  }
  


export async function getFakeValues(
    sensorName: string,
    type: string,
    value: number
  ): Promise<any> {
    const url = `${config.set_fake_value}${sensorName}/${type}/${value}`;
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`Failed to get fake values: ${response.status}`);
    }
  
    const data = await parseResponse(response);
    return data;
  }

  export async function getSpecificOption(
    sensorName: string,
    optionName: string,
    value: any
  ): Promise<any> {
    const url = `${config.specific_option}${sensorName}/${optionName}/${value}`;
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`Failed to set specific option value: ${response.status}`);
    }
  
    const data = await parseResponse(response);
    return data;
  }

  


export async function update_streaming_mode(
    object_name: string,
    mode: string
  ): Promise<any> {
    const url = `${config.update_streaming_mode}${object_name}/${mode}`;
    const response = await fetch(url, {
      method: "POST",
    });
  
    if (!response.ok) {
      throw new Error(`Failed to update streaming mode: ${response.status}`);
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
