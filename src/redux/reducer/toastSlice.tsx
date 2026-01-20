import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  toastBody: "",
  toastFlag: false,
  severity: "info",
};

export const toastSlice = createSlice({
  name: "toastSlice",
  initialState,
  reducers: {
    toast: (state, action: PayloadAction<string>) => {
      state.toastBody = action.payload;
    },
    toastCheck: (state, action: PayloadAction<boolean>) => {
      state.toastFlag = action.payload;
    },
    toastSeverity: (state, action: PayloadAction<string>) => {
      state.severity = action.payload;
    },
  },
});

export const { toast, toastCheck, toastSeverity } = toastSlice.actions;

export default toastSlice.reducer;
