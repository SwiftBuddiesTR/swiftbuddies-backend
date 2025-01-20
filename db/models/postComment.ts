import mongoose, { Document, Schema } from 'npm:mongoose';
import { v4 as uuidv4 } from 'npm:uuid';

// Define the interface for PostComment
interface IPostComment extends Document {
  uid: string;
  post_uid: string;
  owner_uid: string;
  content_history: {
    content: string;
    changeDate: Date;
  }[];
  sharedDate?: Date;
  likeCount?: number;
  likedBy?: string[];
}

// Define the schema for PostComment
const postCommentSchema: Schema = new Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
  },
  post_uid: {
    type: String,
    required: true,
  },
  owner_uid: {
    type: String,
    required: true,
  },
  content_history: {
    type: [{
      content: {
        type: String,
        required: true
      },
      changeDate: {
        type: Date,
        required: true
      }
    }],
    required: true,
  },
  sharedDate: {
    type: Date,
    default: Date.now,
  },
  likeCount: {
    type: Number,
    default: 0,
  },
  likedBy: {
    type: [String],
    default: [],
  }
});

// Create the model for PostComment
const PostComment = mongoose.models.PostComment || mongoose.model<IPostComment>('PostComment', postCommentSchema);

// Define the type for createSimplePostComment function parameters
interface CreateSimplePostCommentParams {
  post_uid: string;
  owner_uid: string;
  content: string;
}

// Define the type for updatePostComment function parameters
interface UpdatePostCommentParams {
  uid: string;
  content: string;
}

// Function to create a simple post comment
export async function createSimplePostComment({ post_uid, owner_uid, content }: CreateSimplePostCommentParams): Promise<string> {
  const uid = uuidv4();
  await PostComment.create({
    uid,
    post_uid,
    owner_uid,
    content_history: [
      {
        content,
        changeDate: new Date()
      }
    ],
  });
  return uid;
}

// Function to update a post comment
export async function updatePostComment({ uid, content }: UpdatePostCommentParams): Promise<void> {
  await PostComment.updateOne(
    { uid },
    {
      $push: {
        content_history: {
          content,
          changeDate: new Date()
        }
      }
    }
  );
}

export default PostComment;