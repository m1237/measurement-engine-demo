import React, { useEffect, useState } from "react";
import { Box, Checkbox, FormControlLabel, Grid } from "@mui/material";
import { get_classifier } from "../../api/classifierAPI";
import ClassifiersType from "../../component/classifiers/classifiersType";

const Classifiers: React.FC = () => {
  const [classifiers, setClassifiers] = useState<Array<any>>([]);
  const [classifierFlag, setClassifierFlag] = useState<object>({});

  useEffect(() => {
    // Fetch post process algorithms from server

    get_classifier()
      .then((data: any) => {
        console.log(data.data); // Log the data
        setClassifiers(data.data); // Set the data in state
      })
      .catch((error) => console.error(error));
  }, []);

  const handleSwitchChange =
    (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const updatedDictionary = { ...classifiers, [key]: event.target.checked };
      setClassifiers(updatedDictionary);

      // You can also make a PUT request to update the dictionary on the server here if needed.
      // Remember to handle any potential errors in the API call.
    };
  const handleVisibilityCheckbox = (objectID: string, checkbox: any) => {
    let object_ref: any = document.getElementById(objectID);

    if (checkbox) {
      setClassifierFlag({ objectID: objectID });
      object_ref.style.display = "block";
    } else {
      object_ref.style.display = "none";
    }
  };

  return (
    <div>
      <Box
        sx={{
          border: "1px none grey",
          width: "100%",
          boxShadow: 2,
          padding: "20px",
          color: "green",
        }}
      >
        <h2>Classifiers</h2>
      </Box>
      <Box
        sx={{
          border: "1px none grey",
          width: "100%",
          boxShadow: 2,
          padding: "20px",
        }}
      >
        {classifiers.map((val: any, index: number) => (
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
                label={val.classification_type}
                control={
                  <Checkbox
                    color="success"
                    onClick={(e: any) =>
                      handleVisibilityCheckbox(
                        val.classification_type,
                        e.target.checked
                      )
                    }
                  />
                  
                }
              />
            </Grid>
            <Grid
              container
              direction="column"
              style={{ display: "none" }}
              id={val.classification_type}
            >
              {classifierFlag && <ClassifiersType label={val}/>}
            </Grid>
          </Box>
        ))}
      </Box>
    </div>
  );
};


export default Classifiers;
