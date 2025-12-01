import { Schema, model, } from 'mongoose';
import { IPost } from 'interfaces/files.interface';

const PostSchema = new Schema<IPost>(
    {
    ownerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    content: { 
      type: String, 
      required: true, 
      trim: true 
    },
    images: {
      type: [String],   // array of URLs
      default: []
    },
    likesCount: {
      type: Number,
      default: 0
    },
    commentsCount: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true, // auto add createdAt & updatedAt
  }
)

export const PostModel = model<IPost>('Post', PostSchema);
