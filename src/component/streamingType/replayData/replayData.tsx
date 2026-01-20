import React, { useEffect, useState } from "react";
import { add_replay_file, remove_replay_file } from "../../../api/replayAPI";
import { RootState } from "../../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import { FormControl, FormLabel, Input, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import {toast, toastCheck, toastSeverity} from "../../../redux/reducer/toastSlice";
import { streamSelection } from "../../../redux/reducer/sensorSlice";

const ReplayData: React.FC = () => {
  const dispatch = useDispatch();

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isValidFile, setIsValidFile] = useState(true); //need this to keep track if last file was valid or not - changes the color theme
  const [uploadFile, setUploadFile] = useState<any[]>([]);

  const checkStream = useSelector(
    //making stream disable when recording start and able when off
    (state: RootState) => state.reducers.sensorSlice.ChangingStreaming
  );

  const handleDelete = (fileName: string, measurementType: string) => {
    // Delete the file from the backend
    // ...
    
    // Remove the file from the uploaded files list
    
    remove_replay_file(sensorName, measurementType)
      .then((res: any) => {
        
        if (res==="True"){
          const updatedFiles = uploadedFiles.filter(file => file.name !== fileName);
          setUploadedFiles(updatedFiles);

          dispatch(toast(`Replayfile was successfully deleted.`));
          dispatch(toastCheck(true));
          dispatch(toastSeverity("success"));
        }else{
          dispatch(toast("The replay file was not removed from the measurement-engine. This should not happen. We recommend re-starting the application."));
          dispatch(toastCheck(true));
          dispatch(toastSeverity("error"));
        }

      });

    
  };

  const sensorName = useSelector(
    (state: RootState) => state.reducers.sensorSlice.name
  ); // selsctor for sensor name

  
  const inputReplayFile = (fileName: string, data: any) => {
    // api for add replay file
    add_replay_file(sensorName, data)
      .then((res: any) => {
        
        

        let replayFileAdded: boolean = res.replay_file_added
        let addedMeasurementType: string = res.added_measurement_type
        

        if (replayFileAdded){
          
          //we check if there is already an existing file of that measurement-type. If yes we delete it.
          const existingFileIndex = uploadedFiles.findIndex(file => file.measurementType === addedMeasurementType); 
          if (existingFileIndex !== -1) {
           
            const updatedFiles = [...uploadedFiles];
            updatedFiles.splice(existingFileIndex, 1);
            setUploadedFiles(updatedFiles);

            dispatch(toast(`Old file of type, ${addedMeasurementType} was removed from replay files.`));
            dispatch(toastCheck(true));
            dispatch(toastSeverity("info"));
          }

          const newFile = { measurementType: addedMeasurementType, name: fileName, data: res.data };
          setUploadedFiles(prevFiles => [...prevFiles, newFile]);
          setIsValidFile(true);
          dispatch(toast("File was successfully added for the replay files."));
          dispatch(toastCheck(true));
          dispatch(toastSeverity("success"));

        }else{
          setIsValidFile(false);
          dispatch(toast("The replay file you tried to add had a wrong format and was thus not added to the replay files."));
          dispatch(toastCheck(true));
          dispatch(toastSeverity("error"));
        }

        

      })
      .catch((err: any) => {
        console.log(err.message);
      });
  };

  const handleChange = (e: any) => {
    let file = e.target.files;
    let files = e.target.files[0];
    if (sensorName !== "Engine") {
      setUploadFile(file);
      for (let index = 0; index < file.length; index++) {
        // split is used for taking out the measure type
  
        let fileName = file[index].name
        // applied filereader for reading a file
        let read = new FileReader();
        read.onload = (event: any) => {
          // here event is used to get result from the filereader
          const data = event.target.result;
          if (data) {
            // function is called in which api for add replay file is created
            inputReplayFile(fileName, data);
            dispatch(streamSelection(true)); // ready to on recording button
            
          }
        };
        read.readAsText(files);
      }
    } else {
      dispatch(
        toast("Replaying data of the Engine is currently not supported!")
      );
      dispatch(toastCheck(true));
      dispatch(toastSeverity("warning"));
    }
  };
  return (
    <div className=" p-3">
      <FormControl
      sx = {{ marginBottom: 3,
      color:'green' }}>
        <FormLabel>Upload previously recorded files!</FormLabel>
        <Input
          color={isValidFile ? "success" : 'error'}
          type="file"
          disabled={checkStream}
          inputProps={{
            accept: ".json",
          }}
          onChange={handleChange}
        />
      </FormControl>

      {uploadedFiles.length > 0 && (
        <div>
          <div>Uploaded Files:</div>
          <TableContainer
          sx={{boxShadow:2,
          width:'50%',
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><b>FileName</b></TableCell>
                  <TableCell><b>Measurement-Type</b></TableCell>
                  <TableCell><b>Delete</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadedFiles.map((file, index) => (
                  <TableRow key={index}>
                    <TableCell>{file.name}</TableCell>
                    <TableCell>{file.measurementType}</TableCell>
                    <TableCell>
                      <IconButton aria-label="delete" onClick={() => handleDelete(file.name, file.measurementType)}
                      disabled={checkStream}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
            )}

    </div>
  );
};

export default ReplayData;
