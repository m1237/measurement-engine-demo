import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

const initialState = {
    profile_Data:{}
}

export const profileDataSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    addData: (state,action: PayloadAction<number>) => {
        state.profile_Data = action.payload;
    },
    
  },
})
// Action creators are generated for each case reducer function
export const { addData } = profileDataSlice.actions

export default profileDataSlice.reducer