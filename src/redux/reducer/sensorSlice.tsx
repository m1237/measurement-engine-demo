import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  name: "",
  streamSelected: false,
  ChangingStreaming:false
};
export const sensorSlice = createSlice({
  name: "SensorData",
  initialState,
  reducers: {
    sensorName: (state, action: PayloadAction<string>) => {
      state.name = action.payload; //getting name of sensor
    },
    streamSelection: (state, action: PayloadAction<boolean>) => {
      state.streamSelected = action.payload; //boolean for changing the recording toggle  in start stream file
    },
    stopChangingStreaming:(state, action:PayloadAction<boolean>)=>{
      state.ChangingStreaming = action.payload
    }
  },
});

export const { sensorName, streamSelection, stopChangingStreaming } = sensorSlice.actions;

export default sensorSlice.reducer;
