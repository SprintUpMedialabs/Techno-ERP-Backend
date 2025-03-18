import multer from 'multer';

const storage = multer.memoryStorage();

// DTODO: need to clean multer storge after saving to AWS => Resolved in updateEnquiryDocuments function
const upload = multer({ storage });

export default upload;
