"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const secrets_1 = require("../secrets");
let transport = nodemailer_1.default.createTransport({
    host: secrets_1.NODEMAILER_HOST,
    port: Number(secrets_1.NODEMAILER_PORT),
    secure: true,
    auth: {
        user: secrets_1.NODEMAILER_SENDER_ADDRESS,
        pass: secrets_1.NODEMAILER_GMAIL_APP_PASSWORD
    }
});
// TODO: we need to have some robust approach here => What changes are we expecting?
const sendEmail = (to, subject, text, attachments) => __awaiter(void 0, void 0, void 0, function* () {
    const mailOptions = {
        from: secrets_1.NODEMAILER_SENDER_ADDRESS,
        to,
        subject,
        html: text,
        attachments
    };
    console.log("Mail Options : ", mailOptions);
    try {
        const info = yield transport.sendMail(mailOptions);
        return info;
    }
    catch (err) {
        throw (0, http_errors_1.default)(400, err.message);
    }
});
exports.sendEmail = sendEmail;
