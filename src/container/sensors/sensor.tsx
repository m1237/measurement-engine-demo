import { Box, Checkbox, FormControlLabel, Grid } from "@mui/material";
import React, { useEffect, useState } from "react";
import { RootState } from "../../redux/store";
import { useSelector } from "react-redux";
import { getSensorInfo } from "../../api/sensorAPI";
import StreamingType from "../../component/sensors/streamingType";
import Recording from "../recording/recording";

const Sensor = () => {
  const checkStream = useSelector(
    //making stream disable when recording start and able when off
    (state: RootState) => state.reducers.sensorSlice.ChangingStreaming
  );
  const [sensorData, setSensorData] = useState<any>([]);
  const [sensorFlag, setSensorFlag] = useState<object>({});
  useEffect(() => {
    getSensorInfo()
      .then((responce: any) => {
        setSensorData(responce);
      })
      .catch((error: any) => {
        console.log(error.message);
      });
  }, []);
  const handleVisibilityCheckbox = (objectID: string, checkbox: any) => {
    let object_ref: any = document.getElementById(objectID);

    if (checkbox) {
      object_ref.style.display = "block";
      setSensorFlag({ objectID: objectID });
    } else {
      object_ref.style.display = "none";
    }
  };
  return (
    <div style={{ paddingTop: "100px" }}>
      <Box
        sx={{
          border: "1px none grey",
          width: "100%",
          boxShadow: 2,
          padding: "20px",
          color: "green",
        }}
      >
        <h2>Sensor</h2>
      </Box>
      <Box
        sx={{
          border: "1px none grey",
          width: "100%",
          boxShadow: 2,
          padding: "20px",
        }}
      >
        {sensorData.map((val: any, index: number) => (
          <Box key={index}>
            <Grid
              container
              direction="row"
              sx={{
                border: "1px none grey",
                width: "100%",
                boxShadow: 2,
                padding: "15px",
              }}
            >
              <FormControlLabel
                label={val.name}
                control={
                  <Checkbox
                    color="success"
                    onClick={(e: any) => {
                      handleVisibilityCheckbox(val.name, e.target.checked);
                    }}
                    disabled={checkStream}
                  />
                }
              />
            </Grid>
            <Grid
              container
              direction="column"
              style={{ display: "none" }}
              id={val.name}
            >
              {sensorFlag && <StreamingType name={val.name} />}
            </Grid>
          </Box>
        ))}
      </Box>
        <Recording/>
    </div>
  );
};

export default Sensor;
