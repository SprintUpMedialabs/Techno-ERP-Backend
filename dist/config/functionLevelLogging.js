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
exports.functionLevelLogger = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const logger_1 = __importDefault(require("./logger"));
const http_errors_1 = __importDefault(require("http-errors"));
const functionLevelLogger = (fn) => (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info(`[START] ${fn.name} - ${req.method} ${req.originalUrl}`);
    try {
        yield fn(req, res);
        logger_1.default.info(`[END] ${fn.name}`);
    }
    catch (err) {
        logger_1.default.error(`[ERROR] ${fn.name}:`, err);
        throw (0, http_errors_1.default)(400, err);
    }
}));
exports.functionLevelLogger = functionLevelLogger;
