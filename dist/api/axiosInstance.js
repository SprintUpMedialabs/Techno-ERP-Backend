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
const axios_1 = __importDefault(require("axios"));
const secrets_1 = require("../secrets");
// Create instance
const axiosInstance = axios_1.default.create({
    baseURL: secrets_1.AUDIT_LOG_SERVICE_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Function to get token (customize this as per your logic)
function getAuthToken() {
    return __awaiter(this, void 0, void 0, function* () {
        // Example: static token from .env or dynamic logic
        return secrets_1.SERVICE_AUTH_TOKEN;
    });
}
// Interceptor to attach Bearer token
axiosInstance.interceptors.request.use((config) => __awaiter(void 0, void 0, void 0, function* () {
    const token = yield getAuthToken();
    if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}), (error) => {
    // return Promise.reject(error);
});
exports.default = axiosInstance;
