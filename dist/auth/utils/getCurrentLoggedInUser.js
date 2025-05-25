"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentLoggedInUser = void 0;
const jwtHelper_1 = require("../../utils/jwtHelper");
const getCurrentLoggedInUser = (req) => {
    const token = req.cookies.token;
    const decoded = jwtHelper_1.jwtHelper.verifyToken(token);
    return decoded.id;
};
exports.getCurrentLoggedInUser = getCurrentLoggedInUser;
