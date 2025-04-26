"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./config/logger"));
const morgan_1 = __importDefault(require("morgan"));
const error_1 = require("./middleware/error");
const route_1 = require("./route");
const secrets_1 = require("./secrets");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const database_1 = __importStar(require("./config/database"));
const validateEnv_1 = require("./config/validateEnv");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
let envFile;
if (!process.env.NODE_ENV) {
    envFile = '.env';
}
else if (process.env.NODE_ENV === 'production') {
    envFile = '.env.prod';
}
else {
    envFile = '.env.uat';
}
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, envFile) });
(0, validateEnv_1.validateEnvVariables)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL] // PROD ENV
    : '*'; // Allow all origins in DEV ENV
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins === '*' || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Allow cookies and Authorization headers, if any.
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
(0, database_1.default)();
(0, database_1.initializeDB)();
app.use('/api', route_1.apiRouter);
app.use((0, morgan_1.default)(':method :url :status :response-time ms', {
    stream: {
        write: (message) => logger_1.default.info(message.trim())
    }
}));
app.use(error_1.errorHandler);
app.listen(secrets_1.PORT, () => {
    logger_1.default.info(`Started Your Application on Port ${secrets_1.PORT}`);
});
