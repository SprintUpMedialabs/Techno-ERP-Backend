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
exports.deleteFromS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const secrets_1 = require("../../secrets");
const http_errors_1 = __importDefault(require("http-errors"));
const logger_1 = __importDefault(require("../../config/logger"));
const s3Client = new client_s3_1.S3Client({
    region: secrets_1.AWS_REGION,
    credentials: {
        accessKeyId: secrets_1.AWS_ACCESS_KEY_ID,
        secretAccessKey: secrets_1.AWS_SECRET_ACCESS_KEY
    }
});
const deleteFromS3 = (documentLink) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = new URL(documentLink);
        const ObjectKey = decodeURIComponent(url.pathname.slice(1));
        //We need to do this as in schedule, a file could be duplicated, so if it's deleted once, we won't find second time. But mongodb will have 2 entries in case of duplicate whereas there would be only 1 in AWS(due to replace logic), hence we will delete only if it exists, if it isn't, then skip.
        yield s3Client.send(new client_s3_1.HeadObjectCommand({
            Bucket: secrets_1.AWS_BUCKET_NAME,
            Key: ObjectKey
        }));
        const deleteCommand = new client_s3_1.DeleteObjectCommand({
            Bucket: secrets_1.AWS_BUCKET_NAME,
            Key: ObjectKey,
        });
        yield s3Client.send(deleteCommand);
    }
    catch (error) {
        if (error.name === 'NotFound') {
            logger_1.default.debug(`Object not found in S3: Skipping deletion for ${documentLink}`);
            return;
        }
        logger_1.default.error('Error deleting from S3:', error);
        throw (0, http_errors_1.default)(404, error);
    }
});
exports.deleteFromS3 = deleteFromS3;
