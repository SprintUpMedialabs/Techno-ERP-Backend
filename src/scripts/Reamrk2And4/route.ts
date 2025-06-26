import { Router } from "express";
import { addRemark2and4 } from "./addRemark2and4";

export const AddRemark2and4 = Router();

AddRemark2and4.get("/", addRemark2and4);