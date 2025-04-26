"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const { combine, timestamp, json, colorize } = winston_1.format;
const logger = (0, winston_1.createLogger)({
    level: 'debug', // TODO: shift it to info before going in production
    format: combine(colorize(), timestamp(), json()),
    transports: [
        new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.printf(({ level, message }) => `${level}: ${message}`))
        }),
        new winston_1.transports.File({ filename: 'app.log' })
    ]
});
exports.default = logger;
