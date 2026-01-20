import React from "react";
import StartStreaming from "../../component/startStreaming/startStreaming";
import { Box } from "@mui/material";
import { Col, Row } from "react-bootstrap";
import './recording.css'

const Recording: React.FC = () => {
  return (
    <div>
      <Box
        sx={{
          border: "1px none grey",
          width: "100%",
          boxShadow: 2,
          padding: "17px",
          color: "green",
        }}
      >
        <Row>
          <Col id="record">
            <h2>Record Sensor Measurements</h2>
          </Col>
          <Col>
            <StartStreaming />
          </Col>
        </Row>
      </Box>
    </div>
  );
};

export default Recording;
