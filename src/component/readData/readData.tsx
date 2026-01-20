import React, { useEffect} from "react";
import { getSensor } from "../../api/sensorAPI";
import { useDispatch } from "react-redux";
import { addData } from "../../redux/reducer/profileDataSlice";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store/index";

const ReadData = () => {
  const p_Data = useSelector((state: RootState) => state.reducers.profile_Data);
  const dispatch = useDispatch();
  useEffect(() => {
    const interval = setInterval(() => {
    getSensor()
    .then((response: any) => {
      dispatch(addData(response.data));
      })
      .catch((err: any) => {
        if (err.response) {
          console.log(err.response);
          // console.log(err.response.status);
          // console.log(err.response.headers);
        }
      });
    },1);
    return () => {
      clearInterval(interval);
    };
  }, [p_Data]);
  return (
    <div>
      <header className="Fake-header">
        <h1>React and flask</h1>
        {/* Calling a data from setdata for showing */}
        <p>{p_Data.STreaming_type}</p>
        <p>{p_Data.VAlue}</p>
      </header>
    </div>
  );
};

export default ReadData;

