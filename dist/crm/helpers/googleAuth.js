"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuth = void 0;
const google_auth_library_1 = require("google-auth-library");
const secrets_1 = require("../../secrets");
let privateKey = secrets_1.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n');
exports.googleAuth = new google_auth_library_1.JWT(secrets_1.GOOGLE_SA_CLIENT_EMAIL, undefined, privateKey, 'https://www.googleapis.com/auth/spreadsheets');
