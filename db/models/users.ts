import mongoose, { Document, Model } from 'npm:mongoose';

export interface IUser extends Document {
  registerType: string;
  registerDate: Date;
  lastLoginDate: Date;
  email: string;
  uid: string;
  name: string;
  username: string;
  picture?: string;
  socialMedias: { key: string; value: string }[];
  token: string;
}

export interface OptionalIUser extends Partial<IUser> {
  // deno-lint-ignore no-explicit-any
  [key: string]: any;
}

const userSchema = new mongoose.Schema<IUser>({
  registerType: {
    type: String,
    required: true,
  },
  registerDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  lastLoginDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  email: {
    type: String,
    required: true,
  },
  uid: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
  },
  socialMedias: {
    type: [
      {
        key: String,
        value: String,
      },
    ],
    default: [],
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

/**
 * Check if a user is already registered by email
 * @param {string} email - The email to check
 * @returns {Promise<IUser | null>} - User object if the user is registered, null otherwise
 */
const isUserRegistered = async (email: string): Promise<IUser | null> => {
  const user = await User.findOne({ email });
  return user;
};

/**
 * Get the user ID by token
 * @param {string} token - The token to check
 * @returns {Promise<string | null>} - The user ID or null if not found
 */
const getUserIdByToken = async (token: string): Promise<string | null> => {
  const user = await User.findOne({ token });
  return user ? user.uid : null;
};

/**
 * Get the user by ID
 * @param {string} uid - The user ID to check
 * @returns {Promise<IUser | null>} - The user object or null if not found
 */
const getUserById = async (uid: string): Promise<IUser | null> => {
  const user = await User.findOne({ uid });
  return user;
};

export { User, isUserRegistered, getUserIdByToken, getUserById };
