
'use server';

import { Storage } from '@google-cloud/storage';
import { auth } from '@/lib/firebase';
import atob from 'atob';


const storage = new Storage({
    projectId: process.env.FIREBASE_PROJECT_ID,
    credentials: {
      client_email: process.env.GCP_CLIENT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY,
    },
});

const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
if (!bucketName) {
    throw new Error("FIREBASE_STORAGE_BUCKET environment variable is not set.");
}
const bucket = storage.bucket(bucketName);


interface GetSignedUploadUrlInput {
  fileName: string;
  contentType: string;
}

interface GetSignedUploadUrlOutput {
  signedUrl: string;
  publicUrl: string;
}


export async function getSignedUploadUrl({ fileName, contentType }: GetSignedUploadUrlInput): Promise<GetSignedUploadUrlOutput> {
  const currentUser = auth.currentUser;
  const userId = currentUser ? currentUser.uid : 'anonymous';
  const filePath = `shopping-lists/${userId}/${Date.now()}-${fileName}`;

  const [signedUrl] = await bucket.file(filePath).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

  return { signedUrl, publicUrl };
}
