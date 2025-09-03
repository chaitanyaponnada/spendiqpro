
'use server';

import { Storage } from '@google-cloud/storage';

const credentials = {
  client_email: process.env.GCP_CLIENT_EMAIL,
  private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials,
});

const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
if (!bucketName) {
  throw new Error('FIREBASE_STORAGE_BUCKET environment variable is not set.');
}
const bucket = storage.bucket(bucketName);


/**
 * This function is designed to be called from a Next.js server action.
 * It takes FormData, extracts the file, and uploads it to GCS.
 * @param formData The FormData object containing the file.
 * @returns The public URL of the uploaded file.
 */
export async function uploadImageFromStream(formData: FormData): Promise<{ publicUrl: string | null; error?: string }> {
  const file = formData.get('file') as File | null;

  if (!file) {
    return { publicUrl: null, error: 'No file found in form data.' };
  }

  // User context is not available directly in this server action.
  // The path can be made more specific if the user ID is passed to this function.
  const filePath = `shopping-lists/uploads/${Date.now()}-${file.name}`;
  const gcsFile = bucket.file(filePath);

  try {
    // Create a buffer from the file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload the buffer to GCS
    await gcsFile.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    return { publicUrl };
  } catch (error: any) {
    console.error('Failed to upload to GCS:', error);
    return { publicUrl: null, error: 'File upload to cloud storage failed.' };
  }
}
