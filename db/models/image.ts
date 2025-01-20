import mongoose, { Document, Model } from 'npm:mongoose';

interface IImage extends Document {
  uid: string;
  owner_uid: string;
  base64: string;
  isPrivate: boolean;
  uploadDate: Date;
}

const imageSchema = new mongoose.Schema<IImage>({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  owner_uid: {
    type: String,
    required: true,
  },
  base64: {
    type: String,
    required: true,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  }
});

const Image: Model<IImage> = mongoose.models.Image || mongoose.model<IImage>('Image', imageSchema);

interface CreateImageInput {
  uid: string;
  owner_uid: string;
  base64: string;
  isPrivate?: boolean;
  uploadDate?: Date;
}

export async function createImage({ uid, owner_uid, base64, isPrivate = false, uploadDate = new Date() }: CreateImageInput): Promise<IImage> {
  return await Image.create({
    uid,
    owner_uid,
    base64,
    isPrivate,
    uploadDate
  });
}

export async function getImageByUid(uid: string): Promise<IImage | null> {
  return await Image.findOne({ uid });
}

export async function getImagesByOwnerUid(owner_uid: string): Promise<IImage[]> {
  return await Image.find({ owner_uid });
}

export async function deleteImage(uid: string): Promise<IImage | null> {
  return await Image.findOneAndDelete({ uid });
}

export async function deleteImagesByOwnerUid(owner_uid: string): Promise<IImage[]> {
  const images = await Image.find({ owner_uid });
  await Image.deleteMany({ owner_uid });
  return images;
}

export default Image;