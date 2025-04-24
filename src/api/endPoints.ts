import { AUDIT_LOG_SERVICE_URL } from '../secrets';

export const Endpoints = {
    AuditLogService: {
        BASE_URL: AUDIT_LOG_SERVICE_URL || 'http://users-ms:3001',
        MARKETING: {
            SAVE_LEAD: '/marketing/lead'
        }
    },
}