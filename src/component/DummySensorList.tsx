import React, { useEffect, useState } from 'react';
import Sensor from './DummySensor'

const SensorList: React.FC = () => {
    const [sensors, setSensors] = useState<Sensor[]>([]);
  
    useEffect(() => {
      // Make a request to get sensor information
      fetch('http://localhost:5005/get_sensor_info')
        .then(response => response.json())
        .then(data => {
          setSensors(data);
        })
        .catch(error => {
          // Handle the error
          // ...
        });
    }, []);
  
    return (
      <div>
        {sensors.map(sensor => (
          <Sensor key={sensor.name} name={sensor.name} />
        ))}
      </div>
    );
  };
  
  export default SensorList;