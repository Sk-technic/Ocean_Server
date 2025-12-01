import { Schema, model, } from 'mongoose';
import { Ivideos } from 'interfaces/files.interface';

const videoSchema = new Schema<Ivideos>({
    videoUrl: {
      type: String,
      required: true, // cloudinary url required
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      required: true, // cloudinary url required
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    duration: {
      type: Number, // in seconds from cloudinary
      required: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    dislikesCount: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // handles createdAt & updatedAt automatically
  }
)

export const VideoModel = model<Ivideos>('Video', videoSchema);
