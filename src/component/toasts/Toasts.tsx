import React, { useState, useEffect } from "react";

import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../redux/store/index";
import { toastCheck } from "../../redux/reducer/toastSlice";
import Snackbar, { SnackbarOrigin } from "@mui/material/Snackbar";
import { Alert } from "@mui/material";
// import { SnackbarProvider, VariantType, useSnackbar } from 'notistack';

const Toasts = () => {
  const vertical = "top";
  const horizontal = "right";
  // const { enqueueSnackbar } = useSnackbar();
  const toastBodySelector = useSelector(
    (state: RootState) => state.reducers.toastSlice.toastBody
  );
  const toastCheckSelector = useSelector(
    (state: RootState) => state.reducers.toastSlice.toastFlag
  );
  const toastSeverity = useSelector(
    (state: RootState) => state.reducers.toastSlice.severity
  );
  const dispatch = useDispatch();
  const [show, setShow] = useState<boolean>(false);
  useEffect(() => {
    setShow(toastCheckSelector);
  }, [toastCheckSelector]);
  const handleClose = () => {
    setShow(false);
    dispatch(toastCheck(false));
  };
  return (
    <div aria-live="polite" aria-atomic="true" className="position-relative">
      <Snackbar
        open={show}
        onClose={handleClose}
        anchorOrigin={{ vertical, horizontal }}
        
      >
        <Alert
          onClose={handleClose}
          severity={toastSeverity}
          sx={{ width: "100%" }}
        >
          {toastBodySelector}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Toasts;
