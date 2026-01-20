import React, { useState, useEffect } from 'react'
import axios from 'axios'


export default function Fake(){
  // usestate for setting a javascript
  // object for storing and using data
  const [profileData, setProfileData] = useState({
      profile_name: "bak simdi",
      about_me: 100,
  });

  axios({
    method: "GET",
    url:"http://localhost:5005/sensor/Empatica/TEMP",
  })
  .then((response) => {
    const res =response.data
    setProfileData(({
      profile_name: res.STreaming_type,
      about_me: res.VAlue}))
    return profileData.about_me;
  }).catch((error) => {
    if (error.response) {
      console.log(error.response)
      console.log(error.response.status)
      console.log(error.response.headers)
      }
  })
  //end of new line 

  return (
      <div className="Fake">
          <header classN="Fake-header">
              <h1>React and flask</h1>
              {/* Calling a data from setdata for showing */}
              <p>{profileData.profile_name}</p>
              <p>{profileData.about_me}</p>
          </header> 
      </div>
  );
};
