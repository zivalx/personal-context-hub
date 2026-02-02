import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadConfig = {
  // Maximum file size: 10MB
  maxFileSize: 10 * 1024 * 1024,

  // Upload directory
  uploadDir: path.join(__dirname, '../../uploads'),

  // Allowed file types with their MIME types
  allowedFileTypes: {
    // Documents
    'application/pdf': { ext: '.pdf', category: 'document' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      ext: '.docx',
      category: 'document',
    },
    'application/msword': { ext: '.doc', category: 'document' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      ext: '.xlsx',
      category: 'document',
    },
    'application/vnd.ms-excel': { ext: '.xls', category: 'document' },
    'text/csv': { ext: '.csv', category: 'document' },
    'text/plain': { ext: '.txt', category: 'document' },

    // Images
    'image/png': { ext: '.png', category: 'image' },
    'image/jpeg': { ext: '.jpg', category: 'image' },
    'image/jpg': { ext: '.jpg', category: 'image' },
    'image/gif': { ext: '.gif', category: 'image' },
    'image/webp': { ext: '.webp', category: 'image' },
    'image/svg+xml': { ext: '.svg', category: 'image' },
  },

  // Get file extension from MIME type
  getExtension(mimeType) {
    return this.allowedFileTypes[mimeType]?.ext || '';
  },

  // Check if file type is allowed
  isAllowedFileType(mimeType) {
    return mimeType in this.allowedFileTypes;
  },

  // Get file category
  getFileCategory(mimeType) {
    return this.allowedFileTypes[mimeType]?.category || 'unknown';
  },
};
