import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
    AWS_ACCESS_KEY_ID,
    AWS_BUCKET_NAME,
    AWS_REGION,
    AWS_SECRET_ACCESS_KEY
} from '../../secrets'

const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
    }
});

export const deleteFromS3 = async (documentLink: string) => {
    try {
        const url = new URL(documentLink);
        console.log(url.pathname);
        const ObjectKey = decodeURIComponent(url.pathname.slice(1));


        const deleteCommand = new DeleteObjectCommand({
            Bucket: AWS_BUCKET_NAME,
            Key: ObjectKey,
        });

        await s3Client.send(deleteCommand);
        console.log(`Deleted from S3: ${ObjectKey}`);
    } catch (error) {
        console.error(' Error deleting from S3:', error);
        throw error;
    }
}
