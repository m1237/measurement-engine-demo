import { FormControlLabel, Switch } from "@mui/material";
import React, { useState, useEffect } from "react";
import {update_classifier, request_classifier_result} from "../../api/classifierAPI";

const ClassifiersType = ({ label }: any) => {
  const [switchButton, setSwitchButton] = useState<boolean>(false);
  const [index_val, setindex_val] = useState<any>([]);
  const [classificationResult, setClassificationResult] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchClassificationResult = async () => {
      if (label && label.classification_type) {
        const classifierName = label.classification_type[0];
        try {
          const res = await request_classifier_result(classifierName);
          if (res.data) {
            setClassificationResult(res.data);
          } else {
            console.error('No data received from classifier result request');
          }
        } catch (error:any) {
          console.error(`Error fetching classifier result: ${error.message}`);
        }
      }
    };

    // Fetch classification result initially
    fetchClassificationResult();

    // Set up interval to fetch classification result every 1 second
    //intervalId = setInterval(() => {
    //  fetchClassificationResult();
    //}, 1000);

    // Clean up the interval when the component unmounts or when label changes
    return () => {
      //clearInterval(intervalId);
    };
  }, [label]); // Run the effect whenever the 'label' changes

  return (
    <div style={{ display: 'flex' }}>
      {label.algorithm_type.map((value: string, index: number) => (
        <div key={index} style={{ marginRight: '10px' }}>
          <FormControlLabel
            control={
              <Switch
                id="custom-switch"
                color="success"
                checked={index_val === index && switchButton}
                onChange={(e: any) => {
                  if (e.target.checked === true) {
                    console.log(label.classification_type + " with index" + index + "and algorithm" + label.algorithm_type[index] + " is true");
                    setSwitchButton(true);
                    setindex_val(index);
                  } else {
                    setSwitchButton(false);
                    console.log(label.classification_type + " with index" + index + "and algorithm" + label.algorithm_type[index] + " is false");
                  }
  
                  update_classifier(label.classification_type[0], label.algorithm_type[index], e.target.checked)
                    .then((res: any) => {
                      if (res.data === "true") {
                        // Handle success
                      } else {
                        console.log(res);
                      }
                    });
                }}
              />
            }
            label={value}
          />
  
          {switchButton && index_val === index && (
            <div>
              {/* Display classification results here */}
              <p>Classification Result: {classificationResult}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ClassifiersType;
