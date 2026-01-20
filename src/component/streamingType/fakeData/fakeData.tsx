import React, { useEffect, useState } from "react";
import { getSensorInfo } from "../../../api/sensorAPI";
import { Col, Container, Row } from "react-bootstrap";
import { Slider, TextField } from "@mui/material";

const FakeData = ({ name, fakeFlag, getFakeValue }: any) => {
  const [sensorData, setSensorData] = useState<any>([]);
  const [sensorProperty, setSensorProperty] = useState<any>(
    Array(sensorData.length).fill("")
  );
  useEffect(() => {
    getSensorInfo()
      .then((responce: any) => {
        responce.map((val: any, key: number) => {
          if (val.name === name) {
            setSensorData(val.measurement_types);
          }
        });
      })
      .catch((error: any) => {
        console.log(error.message);
      });
  }, [name, fakeFlag]);

  const showData = (value: number, name: string, index: number) => {
    setSensorProperty((prevValues: any) => {
      const newValues = [...prevValues];
      newValues[index] = value;
      return newValues;
    });
  };
  return (
    <>
      <Row className=" p-3">
        {sensorData.map((val: any, index: number) => (
          <>
            <Col className="col-lg-2">
              <Container>
                <TextField
                  label={val.name}
                  type="number"
                  id="outlined-number"
                  color="success"
                  value={sensorProperty[index]}
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Container>
            </Col>
            <Col className="col-lg-3">
              <b>{val.min_value}</b>

              <Slider
                min={val.min_value}
                max={val.max_value}
                name={val.name}
                step={val.step_width}
                onChange={(e: any) => {
                  showData(e.target.value, val.name, index);
                  getFakeValue(e.target.name, e.target.value);
                }}
                sx={{ color: "green" }}
              />
              <b>{val.max_value}</b>
            </Col>
            <col className="col-lg-1"></col>
          </>
        ))}
      </Row>
    </>
  );
};

export default FakeData;
