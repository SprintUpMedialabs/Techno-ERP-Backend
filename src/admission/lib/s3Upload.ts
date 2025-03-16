import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import {
  AWS_ACCESS_KEY_ID,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY
} from '../../secrets';

import { DocumentType } from '../../config/constants';


const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

const getFileExtension = (fileName: string): string | null => {
  const match = fileName.match(/\.([0-9a-z]+)$/i);
  return match ? match[1] : null;
};


export const uploadToS3 = async (folderName: string, yearSubFolderName: string, fileType: DocumentType, file: Express.Multer.File): Promise<string> => {
  const currentYear = new Date().getFullYear();

  if (!Object.values(DocumentType).includes(fileType)) {
    throw new Error(`Invalid file type: ${fileType}`);
  }

  let extension = getFileExtension(file.originalname);
  const fileName = `${fileType}.${extension}`;

  //Here we are considering subfolder for year, so that if we want to utilise same function for more than 1 use case, then same function can be used. Ex : year/admissions/student_id/name_of_file or year/finance/student_id/fee_reciept, etc.
  const objectKey = `${currentYear}/${yearSubFolderName}/${folderName}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: AWS_BUCKET_NAME,
    Key: objectKey,
    Body: file.buffer,
    ContentType: file.mimetype
  });

  try {
    await s3Client.send(command);
    console.log(`File uploaded successfully: ${objectKey}`);
    return `https://${AWS_BUCKET_NAME}.s3.amazonaws.com/${objectKey}`;
  }
  catch (err) {
    console.error('Error uploading to S3:', err);
    throw err;
  }
}
