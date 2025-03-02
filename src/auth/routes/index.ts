import express from "express"
import { authRouter } from "./authRoute";

export const apiRouter = express.Router();

/**
 * Contains the router for Authentication
*/
apiRouter.use('/auth', authRouter)
