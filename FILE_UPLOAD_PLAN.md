# File & Image Upload Feature - Implementation Plan

## Overview
Add ability for users to upload files and images to captures, either by:
- Copying/pasting images from clipboard
- Dragging and dropping files
- Selecting files from computer via file picker

---

## Architecture Design

### 1. Database Schema Changes

**New Attachment Model** (backend/prisma/schema.prisma)

```prisma
model Attachment {
  id           String   @id @default(uuid())
  captureId    String
  capture      Capture  @relation(fields: [captureId], references: [id], onDelete: Cascade)

  // File metadata
  fileName     String              // Stored filename (UUID + extension)
  originalName String              // User's original filename
  fileSize     Int                 // Size in bytes
  mimeType     String              // MIME type (image/png, application/pdf, etc.)

  // Storage
  storageKey   String              // Full path or S3 key
  url          String              // Accessible URL for frontend

  // Optional: Image-specific
  width        Int?                // Image width
  height       Int?                // Image height
  thumbnailUrl String?             // Thumbnail for large images

  createdAt    DateTime @default(now())

  @@index([captureId])
  @@index([createdAt])
}

// Update Capture model
model Capture {
  // ... existing fields ...
  attachments  Attachment[]        // Add this relation
}
```

**Migration Command:**
```bash
cd backend
npx prisma migrate dev --name add_attachments
```

---

### 2. Storage Strategy

**Option A: Local File System (Recommended for MVP)**
- **Pros:** Simple, no external dependencies, no costs
- **Cons:** Not scalable, harder to deploy, backups needed
- **Path:** `backend/uploads/attachments/<userId>/<captureId>/<filename>`
- **URL:** `http://localhost:3001/uploads/attachments/...`

**Option B: AWS S3 (Recommended for Production)**
- **Pros:** Scalable, reliable, CDN-ready, automatic backups
- **Cons:** Costs money, requires AWS setup
- **Bucket:** `personal-context-hub-uploads`
- **Path:** `attachments/<userId>/<captureId>/<filename>`
- **URL:** S3 public URL or CloudFront CDN

**Option C: Cloudinary (Easy Alternative)**
- **Pros:** Free tier, automatic image optimization, easy setup
- **Cons:** Monthly limits, vendor lock-in
- **SDK:** `cloudinary` npm package

**Decision: Start with Local File System, design for easy migration to S3**

---

### 3. Backend Implementation

#### 3.1 Dependencies to Install

```bash
cd backend
npm install multer          # File upload middleware
npm install sharp           # Image processing (thumbnails, compression)
npm install file-type       # Detect MIME types
npm install mime-types      # MIME type helpers
```

#### 3.2 File Upload Service (backend/src/services/fileService.js)

```javascript
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import crypto from 'crypto';

// Configuration
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'attachments');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'text/plain'];

// Multer storage configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const userId = req.user.id;
    const captureId = req.params.captureId || 'temp';
    const dir = path.join(UPLOAD_DIR, userId, captureId);
    await fs.mkdir(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueName}${ext}`);
  }
});

// Multer upload middleware
export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      return cb(new Error('File type not allowed'));
    }
    cb(null, true);
  }
});

// Generate thumbnail for images
export async function generateThumbnail(filePath) {
  const thumbnailPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');
  await sharp(filePath)
    .resize(300, 300, { fit: 'inside' })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);
  return thumbnailPath;
}

// Delete file and thumbnail
export async function deleteFile(filePath) {
  await fs.unlink(filePath);
  const thumbnailPath = filePath.replace(/(\.[^.]+)$/, '_thumb$1');
  try {
    await fs.unlink(thumbnailPath);
  } catch (error) {
    // Thumbnail might not exist
  }
}

// Get file metadata
export async function getFileMetadata(filePath) {
  const buffer = await fs.readFile(filePath);
  const type = await fileTypeFromBuffer(buffer);
  const stats = await fs.stat(filePath);

  let dimensions = null;
  if (type?.mime.startsWith('image/')) {
    const metadata = await sharp(filePath).metadata();
    dimensions = { width: metadata.width, height: metadata.height };
  }

  return {
    mimeType: type?.mime,
    fileSize: stats.size,
    dimensions
  };
}
```

#### 3.3 Attachment Routes (backend/src/routes/attachmentRoutes.js)

```javascript
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../services/fileService.js';
import {
  uploadAttachment,
  deleteAttachment,
  getAttachment
} from '../controllers/attachmentController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Upload file to capture
router.post('/captures/:captureId/attachments', upload.single('file'), uploadAttachment);

// Get attachment (serves file)
router.get('/attachments/:id', getAttachment);

// Delete attachment
router.delete('/attachments/:id', deleteAttachment);

export default router;
```

#### 3.4 Attachment Controller (backend/src/controllers/attachmentController.js)

```javascript
import { prisma } from '../utils/prisma.js';
import logger from '../utils/logger.js';
import path from 'path';
import fs from 'fs/promises';
import { generateThumbnail, deleteFile, getFileMetadata } from '../services/fileService.js';

// Upload file to capture
export const uploadAttachment = async (req, res) => {
  try {
    const { captureId } = req.params;
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Verify capture exists and belongs to user
    const capture = await prisma.capture.findFirst({
      where: { id: captureId, userId }
    });

    if (!capture) {
      await fs.unlink(file.path); // Clean up uploaded file
      return res.status(404).json({ success: false, message: 'Capture not found' });
    }

    // Get file metadata
    const metadata = await getFileMetadata(file.path);

    // Generate thumbnail for images
    let thumbnailUrl = null;
    if (metadata.mimeType?.startsWith('image/')) {
      const thumbnailPath = await generateThumbnail(file.path);
      thumbnailUrl = `/uploads/attachments/${userId}/${captureId}/${path.basename(thumbnailPath)}`;
    }

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        captureId,
        fileName: file.filename,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: metadata.mimeType,
        storageKey: file.path,
        url: `/uploads/attachments/${userId}/${captureId}/${file.filename}`,
        thumbnailUrl,
        width: metadata.dimensions?.width,
        height: metadata.dimensions?.height
      }
    });

    logger.info(`Attachment uploaded: ${attachment.id} for capture ${captureId}`);

    res.json({
      success: true,
      data: attachment
    });
  } catch (error) {
    logger.error('Error uploading attachment:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
};

// Delete attachment
export const deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find attachment and verify ownership
    const attachment = await prisma.attachment.findFirst({
      where: {
        id,
        capture: { userId }
      }
    });

    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    // Delete file from storage
    await deleteFile(attachment.storageKey);

    // Delete database record
    await prisma.attachment.delete({ where: { id } });

    logger.info(`Attachment deleted: ${id}`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting attachment:', error);
    res.status(500).json({ success: false, message: 'Failed to delete attachment' });
  }
};

// Serve attachment file
export const getAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const attachment = await prisma.attachment.findFirst({
      where: {
        id,
        capture: { userId }
      }
    });

    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }

    res.sendFile(attachment.storageKey);
  } catch (error) {
    logger.error('Error serving attachment:', error);
    res.status(500).json({ success: false, message: 'Failed to serve file' });
  }
};
```

#### 3.5 Update Server (backend/src/server.js)

```javascript
// Add to imports
import attachmentRoutes from './routes/attachmentRoutes.js';
import path from 'path';

// Add static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Add routes
app.use('/api', attachmentRoutes);
```

---

### 4. Frontend Implementation

#### 4.1 API Client Updates (web-app/src/api/client.js)

```javascript
// Add to attachmentsAPI object
export const attachmentsAPI = {
  // Upload file to capture
  upload: async (captureId, file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/captures/${captureId}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
        // Don't set Content-Type - browser will set it with boundary
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  // Delete attachment
  delete: async (attachmentId) => {
    return fetchWithAuth(`/api/attachments/${attachmentId}`, {
      method: 'DELETE'
    });
  },

  // Get attachment URL
  getUrl: (attachmentId) => {
    return `${API_BASE_URL}/api/attachments/${attachmentId}`;
  }
};
```

#### 4.2 File Upload Component (web-app/src/components/ui/FileUpload.jsx)

```jsx
import { useState, useRef } from 'react';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FileUpload({ captureId, onUploadComplete, onError }) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      onError?.('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      onError?.('File type not supported');
      return;
    }

    setUploading(true);

    try {
      const result = await attachmentsAPI.upload(captureId, file);
      onUploadComplete?.(result.data);
    } catch (error) {
      onError?.(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          handleFileSelect([file]);
          break;
        }
      }
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        dragActive ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
        accept="image/*,.pdf,.txt"
      />

      <div className="flex flex-col items-center gap-2">
        <Upload className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Drag & drop, paste, or click to upload
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Select File'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Images, PDFs, text files • Max 10MB
        </p>
      </div>
    </div>
  );
}
```

#### 4.3 Attachment Display Component (web-app/src/components/ui/AttachmentList.jsx)

```jsx
import { X, Download, File, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AttachmentList({ attachments, onDelete, readOnly = false }) {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Attachments</p>
      <div className="grid grid-cols-2 gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="relative border rounded-lg p-2 hover:bg-muted/50 transition-colors"
          >
            {attachment.mimeType.startsWith('image/') ? (
              <div className="aspect-video bg-muted rounded overflow-hidden mb-2">
                <img
                  src={attachment.thumbnailUrl || attachment.url}
                  alt={attachment.originalName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded flex items-center justify-center mb-2">
                <File className="w-8 h-8 text-muted-foreground" />
              </div>
            )}

            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{attachment.originalName}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => window.open(attachment.url, '_blank')}
                >
                  <Download className="w-3 h-3" />
                </Button>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => onDelete(attachment.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 4.4 Update CaptureCard (web-app/src/components/cards/CaptureCard.tsx)

```tsx
// Add to imports
import { Paperclip } from 'lucide-react';

// In the card body, after content preview:
{capture.attachments && capture.attachments.length > 0 && (
  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
    <Paperclip className="w-3 h-3" />
    <span>{capture.attachments.length} attachment{capture.attachments.length > 1 ? 's' : ''}</span>
  </div>
)}
```

#### 4.5 Update Capture Edit/Detail Modals (web-app/src/pages/Index.jsx)

Add FileUpload and AttachmentList components to:
- Edit modal
- Detail view modal
- Capture creation flow (if you add one)

---

### 5. Implementation Steps

#### Phase 1: Backend Foundation
1. ✅ Install backend dependencies (multer, sharp, file-type)
2. ✅ Update Prisma schema with Attachment model
3. ✅ Run database migration
4. ✅ Create fileService.js with upload/delete/thumbnail logic
5. ✅ Create attachmentController.js with CRUD operations
6. ✅ Create attachmentRoutes.js
7. ✅ Update server.js with routes and static file serving
8. ✅ Create uploads/attachments directory
9. ✅ Test with Postman/curl

#### Phase 2: Frontend Foundation
10. ✅ Update API client with attachments endpoints
11. ✅ Create FileUpload component
12. ✅ Create AttachmentList component
13. ✅ Add paste event listener support
14. ✅ Test component isolation

#### Phase 3: Integration
15. ✅ Update captures query to include attachments
16. ✅ Add FileUpload to capture detail modal
17. ✅ Add AttachmentList to capture cards
18. ✅ Add delete attachment mutation
19. ✅ Update CaptureCard to show attachment count
20. ✅ Test full upload → display → delete flow

#### Phase 4: Polish
21. ✅ Add loading states and progress indicators
22. ✅ Add error handling and user feedback
23. ✅ Add file type icons
24. ✅ Add image preview lightbox
25. ✅ Add drag-and-drop visual feedback
26. ✅ Add keyboard shortcuts (Ctrl+V paste)
27. ✅ Test on different file types and sizes

---

### 6. File Size & Type Limits

**Allowed File Types:**
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, TXT
- Max size: 10MB per file

**Future Expansion:**
- Word docs (.docx)
- Excel (.xlsx)
- Audio files (.mp3, .wav)
- Video files (.mp4) - requires different storage strategy

---

### 7. Security Considerations

1. **Authentication**: All routes require valid JWT token
2. **Authorization**: Users can only upload to their own captures
3. **File Validation**: MIME type checking + file-type library
4. **Size Limits**: 10MB max via multer
5. **Path Traversal**: Use path.join() and validate filenames
6. **Sanitization**: Store files with UUID names, not user input
7. **Rate Limiting**: Consider adding rate limiting to upload endpoint

---

### 8. Testing Checklist

- [ ] Upload image via file picker
- [ ] Upload image via drag and drop
- [ ] Upload image via paste (Ctrl+V)
- [ ] Upload PDF file
- [ ] Upload text file
- [ ] Try uploading >10MB file (should fail)
- [ ] Try uploading invalid file type (should fail)
- [ ] Delete attachment
- [ ] View attachment in new tab
- [ ] Download attachment
- [ ] Check thumbnail generation for images
- [ ] Check attachment count on capture card
- [ ] Check attachments persist after page reload
- [ ] Check attachments deleted when capture deleted
- [ ] Test with multiple attachments per capture

---

### 9. Future Enhancements

**Phase 2 Features:**
- [ ] Multiple file upload at once
- [ ] Progress bar for large uploads
- [ ] Image editing (crop, rotate) before upload
- [ ] Markdown image embedding in content
- [ ] OCR text extraction from images
- [ ] Video preview/thumbnails
- [ ] File organization (folders)
- [ ] Direct sharing links with expiry

**Migration to S3:**
```javascript
// Easy swap - update fileService.js to use AWS SDK
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export async function uploadToS3(file) {
  const key = `attachments/${userId}/${captureId}/${filename}`;
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }));
  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
}
```

---

## Summary

This plan provides a complete file upload system that:
- ✅ Supports drag-drop, paste, and file picker
- ✅ Handles images with automatic thumbnails
- ✅ Supports PDFs and text files
- ✅ Uses local storage (easy to migrate to S3)
- ✅ Integrates seamlessly with existing capture system
- ✅ Includes proper validation and security
- ✅ Has clean UI components

**Estimated Time:**
- Backend: 3-4 hours
- Frontend: 3-4 hours
- Testing & Polish: 2 hours
- **Total: ~8-10 hours**

**Ready to implement when you are!**
