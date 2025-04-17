import { 
    S3Client, 
    DeleteObjectCommand, 
    HeadObjectCommand 
  } from '@aws-sdk/client-s3';
  import {
    AWS_ACCESS_KEY_ID,
    AWS_BUCKET_NAME,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY
  } from '../../secrets';
import createHttpError from 'http-errors';
  
  const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
  });
  
  // DTODO (DONE): delete from db as well => Logic added in deleteFileUsingUrl() in scheduleController.ts
  export const deleteFromS3 = async (documentLink: string) => {
    try {
      const url = new URL(documentLink);
      const ObjectKey = decodeURIComponent(url.pathname.slice(1));
  
      //We need to do this as in schedule, a file could be duplicated, so if it's deleted once, we won't find second time. But mongodb will have 2 entries in case of duplicate whereas there would be only 1 in AWS(due to replace logic), hence we will delete only if it exists, if it isn't, then skip.
      await s3Client.send(new HeadObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: ObjectKey
      }));
  
      const deleteCommand = new DeleteObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: ObjectKey,
      });
  
      await s3Client.send(deleteCommand);
      console.log(`Deleted from S3: ${ObjectKey}`);
    } 
    catch (error: any) {
      if (error.name === 'NotFound') {
        console.log(`Object not found in S3: Skipping deletion for ${documentLink}`);
        return;
      }
      console.error('Error deleting from S3:', error);
      throw createHttpError(404, error);
    }
  };
  