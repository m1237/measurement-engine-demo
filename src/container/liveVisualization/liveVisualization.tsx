import React, { useEffect, useState } from "react";
import "./liveVisualization.css";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Tooltip
} from "@mui/material";
import { dropdownlist, fetchLiveAlgorithmsStreamingFromServer } from "../../api/liveVisualAPI";
import Graph from "../plotGraph/graph";
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import Button from '@mui/material/Button';
import { debug } from "console";

const LiveVisualization = () => {
  const [list, setList] = useState<any>([]);
  const [liveAlgorithmInfos, setLiveAlgorithmInfos] = useState([]);

  const [selectedSensorAndMType, setSelectedSensorAndMType] = useState<string>("none");
  const [selectedStorageIdentifier, setSelectedStorageIdentifier] = useState<string>("");
  const [clickFlag, setClickFlag] = useState<boolean>(false);
  const [selectedLiveAlgo, setSelectedLiveAlgo] = useState<string>("none")
  const [selectedType, setSelectedType] = useState<string>("sensor") //proivde info for the graph whether we look for live-algo data or sensor-data

  const [selectedSensorAndMTypeSec, setSelectedSensorAndMTypeSec] = useState<string>("none");
  const [selectedStorageIdentifierSec, setSelectedStorageIdentifierSec] = useState<string>("");
  const [clickFlagSec, setClickFlagSec] = useState<boolean>(false);
  const [selectedLiveAlgoSec, setSelectedLiveAlgoSec] = useState<string>("none")
  const [selectedTypeSec, setSelectedTypeSec] = useState<string>("sensor") //proivde info for the graph whether we look for live-algo data or sensor-data

  const [showRows, setShowRows] = useState(false);

  const toggleRows = () => {
    setShowRows(!showRows);

    if (!showRows){

      //when row is not shown, we reset the graph so it is no running in the background. I the graph should continoue while hidden, this code has to be removed.
      setClickFlagSec(!clickFlagSec)
      setSelectedSensorAndMTypeSec("none");
      setSelectedStorageIdentifierSec("none");
      setSelectedLiveAlgoSec("none")
    
    }
  };
  
  const fetchDropdownList = () => {
    dropdownlist()
      .then((res: any) => {

        setList(res.data);
        
      })
      .catch((err: any) => {
        console.log(err);
      });
  };

  const fetchLiveAlgorithms = () => {
    fetchLiveAlgorithmsStreamingFromServer()
      .then((res: any) => {
          setLiveAlgorithmInfos(res.data)
      })
      .catch((err: any) => {
        console.log(err);
      })
  }

  useEffect(() => {
    fetchDropdownList();
    
  }, []);

  return (
    <>
    
      <div className="table_box">
      
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow >
                <TableCell colSpan={2}>
              <h4 className=" graph_heading">
                Real-Time Sensory Data Visualization
              </h4>
              </TableCell>
              </TableRow>
            </TableHead>
            <TableRow
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                
                <TableCell component="th"  sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Select sensor and measurement type</InputLabel>

                    <Select
                      label="Select sensor and measurement type"
                      value={selectedSensorAndMType}
                      onMouseDown={
                        fetchDropdownList
                      }
                      onChange={(e: any) => {
                        setClickFlag(!clickFlag)
                        setSelectedSensorAndMType(e.target.value);
                        setSelectedStorageIdentifier(e.target.value);
                        
                        setSelectedType("sensor")

                        setSelectedLiveAlgo("none")
                        console.log("now sets click flag")
                        
                      }}
                      className="select_item"
                    >
                      <MenuItem value="none">None</MenuItem>
                      {list.map((option: any, index: number) => (
                        <MenuItem
                          key={index}
                          value={option.value}
                        >
                          {option.value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                
                
                <TableCell component="th"  sx={{ flex: 1 }}>
                        
                  <FormControl fullWidth>
                      <InputLabel>Select Live-Algorithm to be displayed.</InputLabel>

                      <Select
                        label="Select Live-Algorithm"
                        className="select_item"
                        value={selectedLiveAlgo}
                        onMouseDown={
                          fetchLiveAlgorithms
                        }
                        onChange={(e: any) => {
                          
                          setClickFlag(!clickFlag)
                          setSelectedLiveAlgo(e.target.value);
                          setSelectedStorageIdentifier(e.target.value);
                          
                          setSelectedType("algorithm")
                           
                          setSelectedSensorAndMType("none");
                         

                        }}
                        >
                  
                        <MenuItem value="none" >None</MenuItem>
                        {liveAlgorithmInfos.map((algorithmInfo: any, index: number) => (
                          <MenuItem
                            value={`${algorithmInfo.name}, ${algorithmInfo.storage_identifier}`}
                            data-name={algorithmInfo.name}
                            data-storage-identifier={algorithmInfo.storage_identifier}
                            key={index} 
                          >
                            {algorithmInfo.name} {algorithmInfo.storage_identifier}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                        
                </TableCell>
               
              </TableRow>

              <TableRow>
                <TableCell component="th" scope="row" colSpan={2}>
                  <h6 className="selected_measurement">
                    Currently Selected:
                    <span className="stream">{selectedSensorAndMType}</span>
                  </h6>
                  <Graph storageIdentifier={selectedStorageIdentifier} flag={clickFlag} type={selectedType} />
                </TableCell>
              </TableRow>
              
              
                        


              {showRows && (
                <React.Fragment>          
              <TableRow
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                
                <TableCell component="th"  sx={{ flex: 1 }}>
                  <FormControl fullWidth>
                    <InputLabel>Select sensor and measurement type</InputLabel>

                    <Select
                      label="Select sensor and measurement type"
                      value={selectedSensorAndMTypeSec}
                      onMouseDown={
                        fetchDropdownList
                      }
                      onChange={(e: any) => {
                        setClickFlagSec(!clickFlagSec)
                        setSelectedSensorAndMTypeSec(e.target.value);
                        setSelectedStorageIdentifierSec(e.target.value);
                        
                        setSelectedTypeSec("sensor")

                        setSelectedLiveAlgoSec("none")
                        
                        
                      }}
                      className="select_item"
                    >
                      <MenuItem value="none">None</MenuItem>
                      {list.map((option: any, index: number) => (
                        <MenuItem
                          key={index}
                          value={option.value}
                        >
                          {option.value}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </TableCell>
                
                
                <TableCell component="th"  sx={{ flex: 1 }}>
                        
                  <FormControl fullWidth>
                      <InputLabel>Select Live-Algorithm to be displayed.</InputLabel>

                      <Select
                        label="Select Live-Algorithm"
                        className="select_item"
                        value={selectedLiveAlgoSec}
                        onMouseDown={
                          fetchLiveAlgorithms
                        }
                        onChange={(e: any) => {
                          
                          setClickFlagSec(!clickFlagSec)
                          setSelectedLiveAlgoSec(e.target.value);
                          setSelectedStorageIdentifierSec(e.target.value);
                          
                          setSelectedTypeSec("algorithm")
                           
                          setSelectedSensorAndMTypeSec("none");
                         

                        }}
                        >
                  
                        <MenuItem value="none" >None</MenuItem>
                        {liveAlgorithmInfos.map((algorithmInfo: any, index: number) => (
                          <MenuItem
                            value={`${algorithmInfo.name}, ${algorithmInfo.storage_identifier}`}
                            data-name={algorithmInfo.name}
                            data-storage-identifier={algorithmInfo.storage_identifier}
                            key={index} 
                          >
                            {algorithmInfo.name} {algorithmInfo.storage_identifier}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                        
                </TableCell>
               
              </TableRow>

              <TableRow>
                <TableCell component="th" scope="row" colSpan={2}>
                  <h6 className="selected_measurement">
                    Currently Selected:
                    <span className="stream">{selectedSensorAndMTypeSec}</span>
                  </h6>
                  <Graph storageIdentifier={selectedStorageIdentifierSec} flag={clickFlagSec} type={selectedTypeSec} />
                </TableCell>
              </TableRow>
              </React.Fragment> 
              )}             	
          </Table>
          <Tooltip title = {showRows ? "Remove second graph" : "Add second graph"}>
            <Button onClick={toggleRows} sx={{ color: showRows? "red": "green" }}>
              {showRows ? <RemoveCircleOutlineOutlinedIcon style={{ fontSize: "42px" }} /> : <AddCircleOutlineOutlinedIcon style={{ fontSize: "42px" }}/> }
            </Button>
          </Tooltip>
        </TableContainer>
        
        
      </div>
    </>
  );
};

export default LiveVisualization;
