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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const secrets_1 = require("../secrets");
const constants_1 = require("./constants");
const s3Client = new client_s3_1.S3Client({
    region: secrets_1.AWS_REGION,
    credentials: {
        accessKeyId: secrets_1.AWS_ACCESS_KEY_ID,
        secretAccessKey: secrets_1.AWS_SECRET_ACCESS_KEY
    }
});
const getFileExtension = (fileName) => {
    const match = fileName.match(/\.([0-9a-z]+)$/i);
    return match ? match[1] : null;
};
const uploadToS3 = (folderName, yearSubFolderName, fileType, file) => __awaiter(void 0, void 0, void 0, function* () {
    const currentYear = new Date().getFullYear();
    if (!Object.values(constants_1.DocumentType).includes(fileType)) {
        throw new Error(`Invalid file type: ${fileType}`);
    }
    let extension = getFileExtension(file.originalname);
    const fileName = `${fileType}.${extension}`;
    //Here we are considering subfolder for year, so that if we want to utilise same function for more than 1 use case, then same function can be used. Ex : year/admissions/student_id/name_of_file or year/finance/student_id/fee_reciept, etc.
    const objectKey = `${currentYear}/${yearSubFolderName}/${folderName}/${fileName}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: secrets_1.AWS_BUCKET_NAME,
        Key: objectKey,
        Body: file.buffer,
        ContentType: file.mimetype
    });
    try {
        yield s3Client.send(command);
        console.log(`File uploaded successfully: ${objectKey}`);
        return `https://${secrets_1.AWS_BUCKET_NAME}.s3.amazonaws.com/${objectKey}`;
    }
    catch (err) {
        console.error('Error uploading to S3:', err);
        throw err;
    }
});
exports.uploadToS3 = uploadToS3;
