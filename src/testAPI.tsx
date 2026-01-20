
import React, { useEffect, useState } from 'react';

const SensorDropdownList: React.FC = () => {
  const [dropdownList, setDropdownList] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5005/sensor/dropdownlist');
        if (response.ok) {
          const data = await response.text();
          setDropdownList(data);
        } else {
          console.error('Error fetching dropdown list:', response.status);
        }
      } catch (error) {
        console.error('Error fetching dropdown list:', error);
      }
    };

    fetchData();
  }, []);

  return <div><button></button>{dropdownList}</div>;
};

export default SensorDropdownList;