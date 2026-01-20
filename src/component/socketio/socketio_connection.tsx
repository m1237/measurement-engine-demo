import React, { useState, useEffect } from 'react';
// import io from 'socket.io-client';

interface Data {
  message: string;
}

const RealtimeComponent: React.FC = () => {
  const [data, setData] = useState<Data>({ message: '' });

  // useEffect(() => {
  //   const socket = io('http://localhost:5005');

  //   socket.on('data', (data: Data) => {
  //     setData(data);
  //   });

  //   return () => {
  //     socket.disconnect();
  //   };
  // }, []);

  return (
    <div>
      <h1>Real-time Data: {data.message}</h1>
    </div>
  );
};

export default RealtimeComponent;