import express from "express"
import { authRouter } from "./authRoute";
import { userRouter } from "./userRoute";

export const apiRouter = express.Router();

/**
 * Contains the router for Authentication
*/
apiRouter.use('/auth', authRouter)

/**
 * Contains the router for User
*/
apiRouter.use('/user', userRouter)