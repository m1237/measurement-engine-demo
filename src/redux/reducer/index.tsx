import { combineReducers } from "redux";
import profileDataSlice from "./profileDataSlice";
import sensorSlice from "./sensorSlice";
import toastSlice from './toastSlice';
export default combineReducers({
  profileDataSlice,
  sensorSlice,
  toastSlice,
});
