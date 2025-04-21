"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Endpoints = void 0;
const secrets_1 = require("../secrets");
exports.Endpoints = {
    AuditLogService: {
        BASE_URL: secrets_1.AUDIT_LOG_SERVICE_URL || 'http://users-ms:3001',
        MARKETING: {
            SAVE_LEAD: '/marketing/lead'
        }
    },
};
