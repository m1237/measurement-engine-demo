import React, { useState } from "react";
import { getFakeValues, update_streaming_mode } from "../../api/sensorAPI";
import ReplayData from "../streamingType/replayData/replayData";
import { useDispatch, useSelector } from "react-redux";
import { sensorName, streamSelection } from "../../redux/reducer/sensorSlice";
import "./streamingType.css";
import { FormControl, MenuItem, InputLabel } from "@mui/material";
import Select from "@mui/material/Select";
import { RootState } from "../../redux/store";
import FakeData from "../streamingType/fakeData/fakeData";
import RealDta from "../streamingType/realData/realDta";

const StreamingType = (props: any) => {
  const dispatch = useDispatch();
  const checkStream = useSelector(
    //making stream disable when recording start and able when off
    (state: RootState) => state.reducers.sensorSlice.ChangingStreaming
  );
  const [flagReal, setFlagReal] = useState<boolean>(false);
  const [flagFake, setFlagFake] = useState<boolean>(false);
  const [flagReplay, setFlagReplay] = useState<boolean>(false);
  const [stream, setStream] = useState<string>("none");

  const updateStream = (mode: string) => {
    dispatch(sensorName(props.name));
    update_streaming_mode(props.name, mode)
      .then((res: any) => {
        if (mode === "Fake") {
          dispatch(streamSelection(true));
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const getFakeValue = (type: string, value: number) => {
    getFakeValues(props.name, type, value)
      .then((res) => {
        console.log(type, value);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  const streamingSelection = (value: string) => {
    if (value === "Real") {
      updateStream(value);
      setFlagReal(true);
      setFlagFake(false);
      setFlagReplay(false);
    } else if (value === "Fake") {
      updateStream(value);
      setFlagFake(true);
      setFlagReal(false);
      setFlagReplay(false);
    } else if (value === "Replay") {
      updateStream(value);
      setFlagReplay(true);
      setFlagFake(false);
      setFlagReal(false);
    } else {
      setFlagReal(false);
      setFlagFake(false);
      setFlagReplay(false);
    }
  };
  return (
    <>
      <div className=" p-3">
        {/* <h1>{props.name}</h1> */}
        <FormControl fullWidth>
          <InputLabel>Select streaming type</InputLabel>
          <Select
            labelId="simple-select-label"
            id="simple-select"
            value={stream}
            onChange={(e: any) => {
              setStream(e.target.value);
              streamingSelection(e.target.value);
            }}
            label="Select streaming type"
            disabled={checkStream}
          >
            <MenuItem value={"none"}>none</MenuItem>
            <MenuItem value={"Real"}>Real</MenuItem>
            <MenuItem value={"Fake"}>Fake</MenuItem>
            <MenuItem value={"Replay"}>Replay</MenuItem>
          </Select>
        </FormControl>
      </div>

      {flagReal && <RealDta name={props.name} realFlag={flagReal} />}
      {flagFake && (
        <FakeData
          name={props.name}
          fakeFlag={flagFake}
          getFakeValue={getFakeValue}
        />
      )}
      {flagReplay ? <ReplayData /> : ""}
    </>
  );
};

export default StreamingType;
