import { Buffer } from "node:buffer";
import { Storage, Bucket, File } from 'npm:@google-cloud/storage';

// this sh*t will be rewritten in the future.

interface GCPCredentials {
  credentials?: {
    client_email: string | undefined;
    private_key: string | undefined;
  };
  projectId?: string | undefined;
}

export const getGCPCredentials = (): GCPCredentials => {
  if (Deno.env.get('NODE_ENV') === 'production') {
    return Deno.env.get('GCP_PRIVATE_KEY')
      ? {
          credentials: {
            client_email: Deno.env.get('GCP_SERVICE_ACCOUNT_EMAIL'),
            private_key: Deno.env.get('GCP_PRIVATE_KEY'),
          },
          projectId: Deno.env.get('GCP_PROJECT_ID'),
        }
      : {};
  }

  return {
    projectId: Deno.env.get('GCLOUD_PROJECT_ID'),
  };
};

const storage: Storage = new Storage(getGCPCredentials());

let bucket: Bucket;
try {
  bucket = storage.bucket(Deno.env.get('GCLOUD_BUCKET_NAME') || '');
} catch (err) {
  console.warn('Did you do Application Default Credentials (ADC) signup for local development?');
  console.error('Bucket initialize error', err);
  throw new Error('Bucket initialize error');
}

/**
 * Save an image to the storage bucket.
 * @param buffer - The image buffer.
 * @param uid - The unique identifier for the image.
 * @param contentType - The content type of the image.
 * @returns A promise that resolves to a boolean indicating success.
 */
async function saveImage(buffer: Buffer, uid: string, contentType: string = 'image/heic'): Promise<boolean> {
  const extension = contentType.split('/')[1];
  const uniqueName = `swiftbuddies-images/${uid}.${extension}`;

  try {
    await bucket.file(uniqueName).save(buffer, {
      contentType: contentType,
      gzip: true,
    });
    return true;
  } catch (err) {
    console.warn('saveImage error', err);
    return false;
  }
}

/**
 * Get an image from the storage bucket.
 * @param uid - The unique identifier for the image.
 * @returns A promise that resolves to the file object.
 */
async function getImage(uid: string): Promise<File> {
  try {
    const heicFile = bucket.file(`swiftbuddies-images/${uid}.heic`);
    const [exists] = await heicFile.exists();
    if (exists) return heicFile;
  } catch (_) {
    console.warn('HEIC file not found, trying PNG');
  }

  return bucket.file(`swiftbuddies-images/${uid}.png`);
}

/**
 * Delete an image from the storage bucket.
 * @param uid - The unique identifier for the image.
 * @returns A promise that resolves to a boolean indicating success.
 */
async function deleteImage(uid: string): Promise<boolean> {
  try {
    await bucket.file(`swiftbuddies-images/${uid}.png`).delete();
    return true;
  } catch (err) {
    console.warn('deleteImage error', err);
    return false;
  }
}

export { saveImage, getImage, deleteImage };
