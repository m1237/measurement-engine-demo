import axios from "axios";
import { APIURL as config } from "../apiConfig";

/*
export async function onStreaming(value:boolean): Promise<any>{
    return axios.post(`${config.streamToggle}${value}`)
}
export async function setExperimentName(value:string):Promise<any> {
    return axios.get(`${config.experimentName}${value}`)
}

*/
export async function onStreaming(value: boolean): Promise<any> {
    const url = `${config.streamToggle}${value}`;
    const response = await fetch(url, {
      method: "POST",
    });
  
    if (!response.ok) {
      throw new Error(`Failed to toggle streaming: ${response.status}`);
    }
  
    const data = await await parseResponse(response)
    return data;
  }
  
  export async function setExperimentName(value: string): Promise<any> {
    const url = `${config.experimentName}${value}`;
    const response = await fetch(url);
  
    if (!response.ok) {
      throw new Error(`Failed to set experiment name: ${response.status}`);
    }
  
    const data = await parseResponse(response)
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

    