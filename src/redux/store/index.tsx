import { configureStore } from "@reduxjs/toolkit";
import reducers from "../reducer/index";



export const store: any = configureStore({ reducer: { reducers } });

export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
