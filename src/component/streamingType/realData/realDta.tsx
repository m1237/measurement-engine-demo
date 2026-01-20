import React, { useEffect, useState } from "react";
import { Col, Row, Container } from "react-bootstrap";
import RealDataJson from "./realData.json";
import { useDispatch } from "react-redux";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store";
import {
  toast,
  toastCheck,
  toastSeverity,
} from "../../../redux/reducer/toastSlice";
import {
  connectSensor,
  togglePlotting,
  toggleProcessing,
} from "../../../api/realDataAPI";
import {
  sensorName,
  streamSelection,
} from "../../../redux/reducer/sensorSlice";
import {
  Checkbox,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
} from "@mui/material";
import { getSensorInfo, getSpecificOption } from "../../../api/sensorAPI";
import { debug } from "console";
const RealDta = ({ name, realFlag }: any) => {
  const dispatch = useDispatch();

  const [streamName, setStreamName] = useState<string>("");

  const [sensorSliderOption, setSensorSliderOption] = useState<any>([]);
  const [sensorName, setSensorName] = useState<string>("");
  const [connectionFlag, setConnectionFlag] = useState<boolean>(false);
  const [label, setLabel] = useState<string>("Disconnected");
  const [toggleFlag, setToggleFlag] = useState<boolean>(false);
  // const [heartFlag, setHeartFlag] = useState<boolean>(false);

  const [specificOptions, setSpecificOptions] = useState<any>([])
  

  const checkStream = useSelector(
    (state: RootState) => state.reducers.sensorSlice.ChangingStreaming
  );


  const [specificOptionStates, setSpecificOptionStates] = useState<any>({})
 


  useEffect(() => {
    getSensorInfo()
      .then((data: any) => {
        data.map((dataValue: any) => {
          if (dataValue.name === name) {
            if (dataValue.specific_options.length > 0) {
              setSensorName(dataValue.name);
              console.log(dataValue.specific_options);
              
              setSpecificOptions(dataValue.specific_options);
              
              dataValue.specific_options.map((option: any) => {
                //this is for setting the correct default values for checkboxes
                if (typeof option.option_value === "boolean"){
                    
                    updateSpecificOptionState(option.option_name, option.option_value)
               }
              })
            }
          }
        });
      })
      .catch((error: any) => {
        console.log(error);
      });
  }, [name, realFlag]);
  const connectingSensor = (on: boolean) => {
    setLabel("Connecting.....");
    dispatch(toast(`Searching for Device`));
    dispatch(toastCheck(true));
    dispatch(toastSeverity("info"));
    // making connection to sensor
    connectSensor(name, on)
      .then((res: any) => {
        if (on){
          if (res === "True") {
            setLabel("Connected");
            setConnectionFlag(true);
            dispatch(
              toast(`Successfully connected to Sensor_Type ${sensorName}`)
            );
            dispatch(toastCheck(true));
            dispatch(toastSeverity("success"));
          } else {
            setLabel("Disconnected");
            setConnectionFlag(false);
            dispatch(toast(`${sensorName} device is disconnected `));
            dispatch(toastCheck(true));
            dispatch(toastSeverity("warning"));
          }
        }else{
          if (res === "True") {
            setLabel("Disconnected");
            setConnectionFlag(false);
            dispatch(toast(`${sensorName} device is disconnected `));
            dispatch(toastCheck(true));
            dispatch(toastSeverity("warning"));
          }else{
            setLabel("Disconnecting was unsucessfull. This should never happen.")
          }
        }
        
      })
      .catch((error: any) => {
        dispatch(toast(`${error.message}`));
        dispatch(toastCheck(true));
        dispatch(toastSeverity("warning"));
      });
  };

  const activatePloting = (on: boolean) => {
    // starting the plotting of real data
    togglePlotting(name, on)
      .then((res: any) => {
        if (on === true) {
          dispatch(toast(`Active ploting of data enabled.`));
          dispatch(toastCheck(true));
          dispatch(toastSeverity("success"));
        } else {
          dispatch(toast(`Active ploting of data disabled.`));
          dispatch(toastCheck(true));
          dispatch(toastSeverity("warning"));
        }
      })
      .catch((error: any) => {
        setToggleFlag(false);
        console.log(error);
      });
  };
  const SpecificOption = (optionName: string, value: any) => {
    getSpecificOption(sensorName, optionName, value)
      .then((data: any) => {
        console.log(data)
      })
      .catch((error: string) => {
        console.log(error)
      });
  };

  const updateSpecificOptionState = (optionName: string, newValue: any) => {
    setSpecificOptionStates((prevStates: any) => ({
      ...prevStates,
      [optionName]: newValue,
    }));
  }

  return (
    <>
      <Row className=" p-3">
        <Col>
          <h4>Essential Options:</h4>
          <Container>
            <div className="pt-2">
              Connect to the Sensor:
              <br />
              <FormControlLabel
                control={
                  <Switch
                    id="custom-switch"
                    checked={connectionFlag ? true : false}
                    disabled={checkStream}
                    onChange={(e: any) => {
                      setLabel("Connecting...");
                      if (e.target.checked === true) {
                        connectingSensor(true);
                        dispatch(streamSelection(true));
                      } else {
                        connectingSensor(false);
                        dispatch(streamSelection(false));
                        setConnectionFlag(false);
                        setLabel("Disconnected");
                      }
                    }}
                    color="success"
                  />
                }
                label={connectionFlag ? "Connected" : label || "Disconnected"}
              />
            </div>
            <div className="pt-2">
              Active Ploting of Data:
              <br />
              <FormControlLabel
                control={
                  <Switch
                    id="custom-switch"
                    checked={toggleFlag ? true : false}
                    onChange={(e: any) => {
                      if (e.target.checked === true) {
                        activatePloting(true);
                        setToggleFlag(true);
                      } else {
                        activatePloting(false);
                        setToggleFlag(false);
                      }
                    }}
                    color="success"
                  />
                }
                label={toggleFlag ? "Enabled" : "Disabled"}
              />
            </div>
          </Container>
        </Col>

        <Col>
          <h4>Sensor-specific Options:</h4>
          <Container>
            <>
            {specificOptions.map((option: any) => (
              typeof option.option_value === "boolean" ? (
                <div>
                  <FormControlLabel
                    label={option.option_name}
                    control={
                      <Checkbox
                        color="success"
                        checked= {specificOptionStates[option.option_name]}
                        onChange={(e: any) => {
                          updateSpecificOptionState(option.option_name, e.target.checked);
                          SpecificOption(option.option_name, e.target.checked);
                        }}
                        />
                      }
                      />
                </div>
              ) : (Array.isArray(option.option_value) && typeof option.option_value[0] === "number") ? (

                <Row>
                  <Col className="col-lg-2 pt-3">
                    <div>
                      <TextField
                        label={option.option_name}
                        type="number"
                        id="outlined-number"
                        color="success"
                        value={specificOptionStates[option.option_name] || ""}
                        variant="outlined"
                        InputLabelProps={{ shrink: true }}
                      />
                    </div>
                  </Col>
                  <Col className="col-lg-9">
                    <div>
                      <b>{sensorSliderOption[0]}</b>

                      <Slider
                        min={option.option_value[0]}
                        max={option.option_value[1]}
                        step={option.option_value[2]}
                        onChange={(e: any) => {
                          updateSpecificOptionState(option.option_name, e.target.value);
                          SpecificOption(option.option_name, e.target.value);
                        }}
                        sx={{ color: "green" }}
                      />
                      <b>{option.option_value[1]}</b>
                    </div>
                  </Col>
                </Row>

              ) : 
                <FormControl fullWidth>
                  <InputLabel>{option.option_name}</InputLabel>
                  <Select
                    labelId="simple-select-label"
                    id="simple-select"
                    value={specificOptionStates[option.option_name] || "none"}
                    onChange={(e: any) => {
                      updateSpecificOptionState(option.option_name, e.target.value);
                      SpecificOption(option.option_name, e.target.value);
                    }}
                    label={streamName}
                  >
                  <MenuItem value={"none"}>none</MenuItem>
                  {option.option_value.map(
                    (value: any, index: number) => (
                      <MenuItem value={value} key={index}>
                        {value}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
                

                
            ))}
            
            </>
          </Container>
        </Col>
      </Row>
    </>
  );
};

export default RealDta;
