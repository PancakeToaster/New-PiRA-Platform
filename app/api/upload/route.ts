import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getCurrentUser, isAdmin } from '@/lib/permissions';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_EXTENSIONS = new Set([
  // Images
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico',
  // Documents
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf',
  // Videos
  'mp4', 'webm', 'mov', 'avi',
  // Audio
  'mp3', 'wav', 'ogg', 'm4a',
  // Archives
  'zip', 'tar', 'gz',
  // Code / robotics
  'ino', 'py', 'cpp', 'h', 'json', 'xml', 'stl', 'step',
]);

const ALLOWED_MIME_PREFIXES = [
  'image/', 'video/', 'audio/', 'text/',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats', 'application/vnd.ms-',
  'application/zip', 'application/gzip',
  'application/json', 'application/xml',
  'application/octet-stream',
];

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: `File type .${extension} is not allowed` },
        { status: 400 }
      );
    }

    // Validate MIME type
    const mime = file.type;
    const isMimeAllowed = ALLOWED_MIME_PREFIXES.some(prefix => mime.startsWith(prefix));
    if (!isMimeAllowed) {
      return NextResponse.json(
        { error: 'File MIME type is not allowed' },
        { status: 400 }
      );
    }

    // Determine category folder
    let uploadSubdir = 'misc';

    if (mime.startsWith('image/')) uploadSubdir = 'images';
    else if (mime.startsWith('video/')) uploadSubdir = 'videos';
    else if (mime.startsWith('audio/')) uploadSubdir = 'audio';
    else if (mime.includes('pdf') || mime.includes('document') || mime.includes('text')) uploadSubdir = 'documents';

    // Simple size check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (Max 50MB)' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', uploadSubdir);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename with sanitized extension
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = `${timestamp}-${randomStr}.${extension}`;
    const filepath = path.join(uploadDir, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/${uploadSubdir}/${filename}`;

    return NextResponse.json({
      url: publicUrl,
      filename,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
