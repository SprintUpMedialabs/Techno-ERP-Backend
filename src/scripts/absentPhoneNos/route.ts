import { Router } from "express";
import { getAbsentStudents } from "./contollers";

export const PhoneNoRoute = Router();

PhoneNoRoute.post(
  "/get-absent-phone-numbers",
  getAbsentStudents
)
