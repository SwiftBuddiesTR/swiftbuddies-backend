import mongoose, { Document, Schema } from 'npm:mongoose';

interface IPost extends Document {
  uid: string;
  owner_uid: string;
  sharedDate: Date;
  content: string;
  images?: string[];
  likeCount: number;
  likers: string[];
  hashtags: string[];
  comments: string[];
}

const postSchema: Schema = new Schema({
  uid: {
    type: String,
    required: true
  },
  owner_uid: {
    type: String,
    required: true
  },
  sharedDate: {
    type: Date,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  images: {
    type: [String],
    required: false
  },
  likeCount: {
    type: Number,
    required: true,
    default: 0
  },
  likers: {
    type: [String], // Array of uid's
    required: true,
    default: []
  },
  hashtags: {
    type: [String],
    required: true
  },
  comments: {
    type: [String], // Array of comment uid's
    required: true
  }
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);
