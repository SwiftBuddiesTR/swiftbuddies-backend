import mongoose, { Document, Model } from 'npm:mongoose';
import { Ctx } from '@/endpoints.ts';
import { addBulletToLastTrace } from '@/lib/requestTracer.ts';
import { v4 as uuid } from 'npm:uuid';

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
const getUserById = async (
  ctx: Ctx | null,
  uid: string
): Promise<IUser | null> => {
  const startMS = Date.now();
  const user = await User.findOne({ uid });
  const duration = Date.now() - startMS;
  if (ctx) {
    addBulletToLastTrace(
      ctx,
      `db_query:findUserByUserID - duration: ${duration}ms`
    );
  }
  return user;
};

const getUserByToken = async (
  ctx: Ctx | null,
  token: string
): Promise<IUser | null> => {
  const startMS = Date.now();
  const user = await User.findOne({
    token,
  });
  const duration = Date.now() - startMS;
  if (ctx) {
    addBulletToLastTrace(
      ctx,
      `db_query:findUserByToken - duration: ${duration}ms`
    );
  }
  return user;
};

type registerParams = {
  registerType: string;
  email: string;
  name: string;
  picture?: string;
};

const createNewUserIfNeeded = async (
  ctx: Ctx | null,
  user: registerParams
): Promise<{ token: string; type: string }> => {
  const startMS = Date.now();
  const uid = uuid();
  const token = uuid();

  const userExists = await isUserRegistered(user.email);
  if (userExists) {
    userExists.lastLoginDate = new Date();
    userExists.save();
    
    return {
      token: userExists.token,
      type: 'existing',
    };
  }

  const newUser = new User({
    registerType: user.registerType,
    email: user.email,
    username: uid,
    lastLoginDate: new Date(),
    registerDate: new Date(),
    name: user.name,
    picture: user.picture,
    token: token,
  });
  await newUser.save();
  const duration = Date.now() - startMS;
  if (ctx) {
    addBulletToLastTrace(
      ctx,
      `db_query:createNewUser - duration: ${duration}ms`
    );
  }
  return {
    token: token,
    type: 'new',
  };
};

export {
  User,
  type registerParams,
  isUserRegistered,
  getUserIdByToken,
  getUserById,
  getUserByToken,
  createNewUserIfNeeded,
};
