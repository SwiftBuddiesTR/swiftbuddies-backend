import mongoose, { Document, Schema } from 'npm:mongoose';

interface IEvent extends Document {
  uid: string;
  owner_uid: string;
  category: string;
  name: string;
  description: string;
  startDate: string;
  dueDate: string;
  latitude: number;
  longitude: number;
}

const eventSchema: Schema = new mongoose.Schema({
  uid: {
    type: String,
    required: true
  },
  owner_uid: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  dueDate: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
});

eventSchema.index({ name: 'text', description: 'text' });

export default mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema);
