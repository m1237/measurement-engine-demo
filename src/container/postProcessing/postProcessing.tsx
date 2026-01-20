
import React, { useEffect, useState } from "react";
import { Box, Checkbox, FormControlLabel, Grid } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Tooltip } from "@mui/material";
import { APIURL as config } from "../../apiConfig";
import { DataGrid, GridEventListener, useGridApiRef, GridRowSelectionModel} from '@mui/x-data-grid';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import './postProcessing.css';
// import Graph from "../plotGraph/graph";

import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import Switch from "@mui/material/Switch";

const PostProcessing = () => {
  const [postProcessAlgorithms, setPostProcessAlgorithms] = useState<Array<any>>([]);
  const [rowSelectionModel, setRowSelectionModel] = useState<Array<string>>([]);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [page, setPage] = React.useState(0);

  const [checked, setChecked] = useState<boolean>(false);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const checkStream = useSelector(
    (state: RootState) => state.reducers.sensorSlice.ChangingStreaming
  );

  const symbolCreator = (isTrue: boolean) => {
    return isTrue ? <CheckCircleOutlineIcon /> : <CancelIcon />;
  };

  const rowSelectionChangeHandler = (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const newSelectionModel = event.target.checked
      ? [...rowSelectionModel, id]
      : rowSelectionModel.filter((selectedId) => selectedId !== id);

    setRowSelectionModel(newSelectionModel);

    fetch(config.update_post_processing, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newSelectionModel),
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle server response
        console.log(data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    // Fetch post process algorithms from server
    fetch(config.fetch_post_processing)
      .then((response) => response.json())
      .then((data) => {
        console.log(data); // Log the data
        setPostProcessAlgorithms(data); // Set the data in state
      })
      .catch((error) => console.error(error));
  }, []);

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
        <h2>Post Processing</h2>
      </Box>
      <TableContainer component={Paper} sx={{ flex: 1, overflow: 'hidden' }}>
        <Table aria-label="Post Processing Table">
          <TableHead>
            <TableRow>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Activate</strong></TableCell>
              <TableCell><strong>Suited Sensors</strong></TableCell>
              <TableCell><strong>Suited Measurement Types</strong></TableCell>
              <TableCell align="center" className="hide-responsive-columns column-responsive">
              <strong>Response Processing</strong>
              </TableCell>
              <TableCell align="center" className="hide-responsive-columns column-responsive">
              <strong>Dataset Processing</strong>
              </TableCell>
              <TableCell align="center" className="hide-responsive-columns column-responsive">
              <strong>Meta-Response Processing</strong>
              </TableCell>
              <TableCell align="center" className="hide-responsive-columns column-responsive">
              <strong>Event Processing</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {postProcessAlgorithms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row, index) => (
              <TableRow key={row.name} className={index % 2 === 0 ? "tableRowEven" : ""}>
                <TableCell>
                  <Tooltip title={row.description}>
                    <div>{row.name}</div>
                  </Tooltip>
                </TableCell>
                <TableCell>
                <Switch
                    checked={rowSelectionModel.includes(row.name)} // Check if this row is selected
                    onChange={(event) => rowSelectionChangeHandler(event, row.name)} // Handle selection change
                    disabled={checkStream}
                    color="success"
                  />
                </TableCell>
                <TableCell>{row.suited_sensor_types.join(', ')}</TableCell>
                <TableCell>{row.measurement_types.join(', ')}</TableCell>
                <TableCell align="center" className="hide-responsive-columns column-responsive">
                  {symbolCreator(row.is_suited_for_response_processing)}
                </TableCell>
                <TableCell align="center" className="hide-responsive-columns column-responsive">
                  {symbolCreator(row.is_suited_for_set_processing)}
                </TableCell>
                <TableCell align="center" className="hide-responsive-columns column-responsive">
                  {symbolCreator(row.is_suited_for_meta_processing)}
                </TableCell>
                <TableCell align="center" className="hide-responsive-columns column-responsive">
                  {symbolCreator(row.is_suited_for_axis_annotation)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={postProcessAlgorithms.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default PostProcessing;