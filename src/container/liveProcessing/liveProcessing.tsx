
import React, { useEffect, useState } from "react";
import { Box, Checkbox, FormControlLabel, Grid } from "@mui/material";
import { useSelector } from "react-redux";
import { Tooltip } from "@mui/material";
import { RootState } from "../../redux/store";
import Switch from "@mui/material/Switch";
import { APIURL as config } from "../../apiConfig";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef, GridEventListener, useGridApiRef, GridRowSelectionModel} from '@mui/x-data-grid';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import './liveProcessing.css';
// import Graph from "../plotGraph/graph";

const LiveProcessing = () => {
  const [liveProcessAlgorithms, setLiveProcessAlgorithms] = useState<Array<any>>([]);
  const checkStream = useSelector(
    (state: RootState) => state.reducers.sensorSlice.ChangingStreaming
  );

  
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [page, setPage] = React.useState(0);
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };


  const handleSwitchToggle = (algorithmName: any, newState: any) => {
    console.log("triggered das hier");
    fetch(`${config.toggle_live_algorithm}/${algorithmName}/${newState}`)
      .then((response) => response.text())
      .then((data) => {
        if (data === "True") {
          const updatedAlgorithms = liveProcessAlgorithms.map((algorithm) => {
            if (algorithm.name === algorithmName) {
              algorithm.toggle = newState;
            }
            return algorithm;
          });
          setLiveProcessAlgorithms(updatedAlgorithms);
        } else {
          // Handle the case where the server response is not successful
          // TODO: Write a Toast
        }
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    console.log("checkStream has changed:", checkStream);
    if (!checkStream) {

       //now we know that recoding was set to off. That also means that all the algorithms were set to off already (done automatically in backend).
      //we just need to udpate the frontend now to reflect this state.

      const updatedAlgorithms = liveProcessAlgorithms.map((algorithm) => {
        algorithm.toggle = false;
        return algorithm;
      });
      setLiveProcessAlgorithms(updatedAlgorithms);
    }
  }, [checkStream]);

  useEffect(() => {
    // Fetch post process algorithms from server
    fetch(config.fetch_live_processing)
      .then((response) => response.json())
      .then((data) => {
        const dataWithToggle = data.map((date: any) => {
          date["toggle"] = false; // This info does not come from the server as it is frontend specific
          data["canBeActivated"] = false;
          return date;
        });
        setLiveProcessAlgorithms(dataWithToggle);
      })
      .catch((error) => console.error(error));
  }, []);

  return (
    <div style={{ paddingTop: "100px", minWidth: 0 }} className="root">
      <Box
        sx={{
          border: "1px none grey",
          width: "100%",
          boxShadow: 2,
          padding: "20px",
          color: "green",
        }}
      >
        <h2>Live Processing</h2>
      </Box>
      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'hidden' }}>
        <Table aria-label="Live Processing Table">
          <TableHead>
            <TableRow>
              <TableCell className="headerCell"><strong>Name</strong></TableCell>
              <TableCell className="headerCell"><strong>Toggle</strong></TableCell>
              <TableCell className="headerCell"><strong>Instance Type</strong></TableCell>
              <TableCell className="headerCell"><strong>Data Sources</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {liveProcessAlgorithms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((algorithm, index) => (
              <TableRow key={index} className={index % 2 === 0 ? "tableRowEven" : ""}>
                <TableCell>
                  <Tooltip title={algorithm.description}>
                    <div>{algorithm.name}</div>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Switch
                    color="success"
                    checked={algorithm.toggle}
                    onChange={(event) => handleSwitchToggle(algorithm.name, event.target.checked)}
                    disabled={!checkStream}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={algorithm.instantiation_type === 'multi-instance' ? 'This algorithm will be executed on all the available data sources individually.' : 'This algorithm will be executed once with all the available data from the data sources.'}>
                    <div>{algorithm.instantiation_type}</div>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  {algorithm.instantiation_type === 'multi-instance' ? (
                    <Tooltip title="List of sensor-measurement-type pairs this algorithm can potentially run on.">
                      <div>{algorithm.data_sources.map((tuple: any) => `${tuple[0]}-${tuple[1]}`).join(', ')}</div>
                    </Tooltip>
                  ) : (
                    <Tooltip title="List of sensors that need to record data for this algorithm to run.">
                      <div>{algorithm.data_sources.join(', ')}</div>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={liveProcessAlgorithms.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default LiveProcessing;