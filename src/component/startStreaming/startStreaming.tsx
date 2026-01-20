import React, { useState } from "react";
import { onStreaming, setExperimentName } from "../../api/streamToggleAPI";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store";
import {
  toast,
  toastCheck,
  toastSeverity,
} from "../../redux/reducer/toastSlice";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { stopChangingStreaming } from "../../redux/reducer/sensorSlice";
// import './startStreaming.css';
const StartStreaming = () => {
  const dispatch = useDispatch();
  const switchButtonSelector = useSelector(
    (state: RootState) => state.reducers.sensorSlice.streamSelected
  );
  const [switchButton, setSwitchButton] = useState<boolean>(false);
  const [experiment, setExperiment] = useState<string>("");
  const streamData = (streamValue: boolean) => {
    onStreaming(streamValue) //recording start
      .then((res: any) => {
        if (res === "True" && streamValue === true) {
          dispatch(toast("Recording is set to on."));
          dispatch(toastCheck(true));
          dispatch(toastSeverity("success"));
          dispatch(stopChangingStreaming(true));
        } else if (res === "False" || streamValue === false) {
          // if false toggle button remain close
          setSwitchButton(false);
          dispatch(toast("Recording is set to off."));
          dispatch(toastCheck(true));
          dispatch(toastSeverity("warning"));
          dispatch(stopChangingStreaming(false));

        }
      })
      .catch((err: any) => {
        setSwitchButton(false);
        dispatch(toast(`${err.message}`));
        dispatch(toastCheck(true));
        dispatch(toastSeverity("warning"));
      });
  };
  const experimentNameSet = (value: string, streamValue: boolean) => {
    setExperimentName(value)
      .then((res: any) => {
        if (value) {
          dispatch(toast("New experiment name/number was successfully set."));
          dispatch(toastSeverity("success"));
          dispatch(toastCheck(true));
        }
      })
      .catch((err: any) => {
        console.log(err);
      });
  };
  return (
    <div >
      {/* <Box> */}
        <div className="row">
          <div className="col">
            <div className="form-group">
              <label>Experiment Name</label>
              <input
                type="text"
                className="form-control"
                id="experimentNumber"
                placeholder="Enter experiment number or name"
                onChange={(e: any) => {
                  setExperiment(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="col-sm-5 my-auto">
            <FormControlLabel
              control={
                <Switch
                  id="custom-switch"
                  color="success"
                  checked={switchButton ? true : false}
                  onChange={(e: any) => {
                    if (switchButtonSelector === true) {
                      streamData(e.target.checked);
                      experimentNameSet(experiment, e.target.checked);
                      setSwitchButton(true);
                    } else if (switchButtonSelector === false) {
                      streamData(e.target.checked);
                      dispatch(
                        toast(
                          "Streaming was not activated. No sensor is connected and no replay or fake data process is activated."
                        )
                      );
                      dispatch(toastCheck(true));
                      dispatch(toastSeverity("info"));
                    }
                  }}
                />
              }
              label={switchButton ? "Recording on" : "Recording off"}
            />
          </div>
        </div>
      {/* </Box> */}
    </div>
  );
};

export default StartStreaming;
