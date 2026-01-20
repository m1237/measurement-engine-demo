import React, { useEffect, useState, useRef } from "react";
import Plot from "react-plotly.js";
import "bootstrap/dist/css/bootstrap.min.css";
import { create_plot_for_sensor, request_standard_statistics_for_sensor, request_plot_for_live_algorithm } from "../../api/liveVisualAPI";
import "./graph.css";
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import excludeVariablesFromRoot from "@mui/material/styles/excludeVariablesFromRoot";
import { isMinusToken } from "typescript";
import { debug } from "console";
import { AlignHorizontalCenter } from "@mui/icons-material";
import { styled } from '@mui/material/styles';

const Graph: any = ({ storageIdentifier, flag, type}: any) => {


  const PrettoSlider = styled(Slider)({
    color: '#52af77',
    height: 8,
    '& .MuiSlider-track': {
      border: 'none',
    },
    '& .MuiSlider-thumb': {
      height: 24,
      width: 24,
      backgroundColor: '#fff',
      border: '2px solid currentColor',
      '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
        boxShadow: 'inherit',
      },
      '&:before': {
        display: 'none',
      },
    },
    '& .MuiSlider-valueLabel': {
      lineHeight: 1.2,
      fontSize: 12,
      background: 'unset',
      padding: 0,
      width: 32,
      height: 32,
      borderRadius: '50% 50% 50% 0',
      backgroundColor: '#52af77',
      transformOrigin: 'bottom left',
      transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
      '&:before': { display: 'none' },
      '&.MuiSlider-valueLabelOpen': {
        transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
      },
      '& > *': {
        transform: 'rotate(45deg)',
      },
    },
  });


  const layout = {
    autosize: true,
    xaxis: {
      title: "X-axis",
    },
    yaxis: {
      title: "Y-axis",
    },
  };


  var config = {displaylogo: false, responsive: true}
  const triggerStatisticsEveryNthRequest = 10 //Only trigger statisitcs request every Nth frame (depending on what is given here) - save bandwidth

 
  const [plot, setPlot] = useState([{}]);
  const [plotLayout, setLayout] = useState({})
  const [latestValue, setLatestValue] = useState(null)

  const [average, setAverage] = useState(0)
  const [standardDeviation, setStandardDeviation] = useState(0)
  const [min, setMin ] = useState(0)
  const [max, setMax] = useState(0)
  const counter = useRef(0)
 
  const [sliderValue, setSliderValue] = React.useState<number>(300);

  const handleSliderChange = (event: any, newValue: any) => {
    
    setSliderValue(newValue)
  };

  useEffect(() => {
    //console.log(flagState)
    
      
      if (storageIdentifier === "none"){

        if (plot != null){ //as it trys to reach the 'plot' in the next command we have to check fo this. Somtetimes caused an error

          if (Object.keys(plot[0]).length != 0){ //the idea is that we just set the standard values if they have not already been set. Otherwise it creates an infinite loop
            console.log("here")
            //setFlagState(false)
            setPlot([{}])
            setAverage(0)
            setStandardDeviation(0)
            setMin(0)
            setMax(0)
            setLatestValue(null)
          }
      }
      
      }else if (type === "sensor"){

        counter.current += 1;
        const s = storageIdentifier.split("-"); // here the name will be split

        if(s[1] != undefined){
          
          create_plot_for_sensor(s[0], s[1], sliderValue) //here the name will be send to the live visual graph
            .then((response: any) => {
              
               
               setPlot(response.data["graph"])
               let layoutDict = response.data["layout"]

               if (layoutDict != null){
                layoutDict["autosize"] = true
                setLayout(layoutDict)
               }else{
                 setLayout({})
               }

               
               
               if (response.data["measurement_type"] === "HR"){
                let valueList = response.data["graph"][0]["y"]
                let heartRate = valueList[valueList.length-1]
                setLatestValue(heartRate)

                if (heartRate === 0) {
                  heartRate = 1 //prevent from dividing by zero
                }
              
                document.documentElement.style.setProperty('--animation-duration', `${60/heartRate}s`);

              }else{
                setLatestValue(null)
              }
              
            })
            .catch((err: any) => {
              console.log(err);
            });
          
            if (counter.current%triggerStatisticsEveryNthRequest === 0){
              request_standard_statistics_for_sensor(s[0], s[1])
              .then((response: any) => {
               
                setAverage(response.data.average.toFixed(2))
                setMax(response.data.max.toFixed(2))
                setMin(response.data.min.toFixed(2))
                setStandardDeviation(response.data.std_dev.toFixed(2))
              })
              .catch((err: any) => {
                console.log(err);
              });
            }
                  
        }
      }else{
        //here we know that we are dealing with live-algorithms
        
        let split = storageIdentifier.split(", ")
        let algorithmName = split[0]
        let dataSoureIdentifier = split[1] 

        setAverage(0)
        setMax(0)
        setMin(0)
        setStandardDeviation(0)
        
        request_plot_for_live_algorithm(algorithmName, dataSoureIdentifier, sliderValue)
          .then((response: any) => {
          
            setPlot(response.data["graph"])
            let layoutDict = response.data["layout"]

            if (layoutDict != null){
                layoutDict["autosize"] = true
                setLayout(layoutDict)
            }else{
                 setLayout({})
            }
            
            if (response.data["measurement_type"] === "HR"){
              let valueList = response.data["graph"][0]["y"]
              let heartRate = valueList[valueList.length-1]
              setLatestValue(heartRate)

              if (heartRate === 0) {
                  heartRate = 1 //prevent from dividing by zero
              }
              

              document.documentElement.style.setProperty('--animation-duration', `${60/heartRate}s`);

            }else{
              setLatestValue(null)
            }

            

          })
          .catch((err: any) => {
            console.log(err);
          });


      }
      
    
  }, [ flag, plot]); // here i have put the dependencies so that when plot data arrive then it should be updated



  

  return (
    <Grid container spacing={1}>
      <Grid item xs={10} sm={10}>
        <div className="plot-container">
          <Plot data={plot} layout={plotLayout} className="plot-container" config={{ responsive: true }} />
        </div>
        <Grid item xs={12} sm={12} sx={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '20%' }}>
              <Typography id="non-linear-slider" gutterBottom>
                Size of X-Axis: {sliderValue}
              </Typography>
              <PrettoSlider
              value={sliderValue} // Set an initial value or use state to manage the value
              onChange={handleSliderChange}
              aria-labelledby="continuous-slider"
              valueLabelDisplay="auto"
              step={1}
              min={30}
              max={1000}
            />
          </div>
        </Grid>
      </Grid>
      <Grid item xs={1.5} sm={1.5} sx={{marginTop:18 }}>
      {
        latestValue != null ? (

        <div className="heart-rate-display">
          <span className="rate" style={{ fontSize: '40px' }}>{latestValue}</span> 
          <br/>
          <span className="heart" style={{ fontSize: '25px', color:'red', marginLeft:'5px' }}>&hearts;</span> 
 
        </div>
        ) : (
        
          <div></div>
        )}     
      <Box
          sx={{
            border: "2px solid #ccc",
            borderRadius: "8px",
            padding: "16px",
            textAlign: "left"
          }}
        >
          <div className="statistics-container">

          {average === 0 && min === 0 && max === 0 && standardDeviation === 0 ? (
            <Typography gutterBottom>No statistics available</Typography>
          ) : (
            <>
              <Typography gutterBottom>Average: {average}</Typography>
              <br/>
              <Typography gutterBottom>Minimum: {min}</Typography>
              <br/>
              <Typography gutterBottom>Maximum: {max}</Typography>
              <br/>
              <Typography gutterBottom>Standard Dev: {standardDeviation}</Typography>
            </>
          )}
          </div>
        </Box>
      </Grid>
    </Grid>
  );
};

export default Graph;
