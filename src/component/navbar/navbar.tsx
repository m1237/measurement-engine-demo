import React from "react";
import Classifiers from "../../container/classifier/classifiers";
import PostProcessing from "../../container/postProcessing/postProcessing"
import LiveProcessing from "../../container/liveProcessing/liveProcessing"
import Toasts from "../toasts/Toasts";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import CssBaseline from "@mui/material/CssBaseline";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import SensorsIcon from "@mui/icons-material/Sensors";
import TimelineIcon from "@mui/icons-material/Timeline";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";
import { ListItemIcon } from "@mui/material";
import StreamIcon from '@mui/icons-material/Stream';
import { Link } from "react-router-dom";
import StartStreaming from "../../component/startStreaming/startStreaming";
import SendTimeExtensionIcon from '@mui/icons-material/SendTimeExtension';
import SensorList from "./../DummySensorList";
import "./navbar.css";

import Sensor from "../../container/sensors/sensor";
const drawerWidth = 280;
const Navbar = ({ startedInSuperVisorMonitor = false }) => {
 

  
  return (
    <div style={{backgroundColor: "white"}}>
      
      

      <div id="drawer-container">
        <Box sx={{ display: "flex", zIndex: 1 }}>
          <CssBaseline />
          <Box
          >
          <AppBar
            position="absolute"
            sx={{
              
              zIndex: startedInSuperVisorMonitor? 1 : (theme) => theme.zIndex.drawer + 1,
              backgroundColor: "green",
            }}
          >
            <Toolbar>
              <Typography variant="h6" noWrap component="div">
                Measurement Engine
              </Typography>
            </Toolbar>
          </AppBar>
          </Box>

          {!startedInSuperVisorMonitor && (
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: {
                width: drawerWidth,
                boxSizing: "border-box",
              },
            }}
            BackdropProps={{ style: { position: 'absolute' } }}
            PaperProps={{ style: { position: 'absolute' } }}
            ModalProps={{
              container: document.getElementById('drawer-container'),
              style: { position: 'absolute' }
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: "auto", flexGrow: 1 }}>
              <List>
                {["Sensor", "Recording", "Processing Algorithms", "Live Algorithms"].map(
                  (text, index) => (
                    <ListItem key={text}>
                      <ListItemButton
                        sx={{
                          ":hover": { color: "green" },
                          ":after": {
                            backgroundColor: "green",
                            color: "white",
                          },
                        }}
                        
                        href={
                          !startedInSuperVisorMonitor
                            ? (text === "Sensor"
                                ? "/#sensor"
                                : text === "Recording"
                                ? "/#recording"
                                : text === "Processing Algorithms"
                                ? "/#postProcessing"
                                : "/#liveProcessing")
                            : "" //when started in suepervisor-monitor we disable these hrefs by parsing an empty string, as otherwise these buttons do not work in the supervisor-montitor
                          }
                        >
                        <ListItemIcon>
                          {text === "Sensor" ? (
                            <SensorsIcon color="success" />
                          ) : text === "Recording" ? (
                            <StreamIcon color="success" />
                          ) : text === "Processing Algorithms" ? (
                            <AccountTreeIcon color="success" />
                          ) :
                          <SendTimeExtensionIcon color="success"/>
                        }
                        </ListItemIcon>
                        <ListItemText primary={text} />
                      </ListItemButton>
                    </ListItem>
                  )
                )}
              </List>

              <Divider />
              <List>
              {!startedInSuperVisorMonitor && (
                  <ListItem key="Live Visualization" disablePadding>
                    <ListItemButton
                      sx={{
                        ":focus": { backgroundColor: "lightgreen" },
                      }}
                    >
                      <ListItemIcon>
                        <TimelineIcon color="success" />
                      </ListItemIcon>
                      <Link
                        to="Live_visualization"
                        target="_blank"
                        className="Live_Visual"
                      >
                        <ListItemText primary="Live Visualization" />
                      </Link>
                    </ListItemButton>
                  </ListItem>
                )}
              </List>
            </Box>
          </Drawer>
          )}
          <Box component="main" sx={{ flexGrow: 1, p: 5 }}>
            <Toasts />
            <div id="sensor">
              <Sensor />
            </div>
            <br />
            <div id="classifiers">
              <Classifiers />
            </div>
            <br />
            <div id="postProcessing">
              <PostProcessing />
            </div>
            <div id="liveProcessing">
              <LiveProcessing />
            </div>
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default Navbar;
