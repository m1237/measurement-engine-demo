import React, { useEffect, useState } from 'react';

interface Sensor {
  name: string;
}

const Sensor: React.FC<{ name: string }> = ({ name }) => {
    const handleConnect = () => {
      // Make a request to connect the sensor
      fetch(`http://localhost:5005/connect_sensor/${name}/true`) //of course true then also needs to be a variable
        .then(response => {
          // Handle the response
          // ...
        })
        .catch(error => {
          // Handle the error
          // ...
        });
    };
  
    return (
      <div>
        <div>{name}</div>
        <button onClick={handleConnect}>Connect</button>
      </div>
    );
  };

export default Sensor