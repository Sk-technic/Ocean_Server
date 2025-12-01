import { Document, Types } from 'mongoose';
export interface FileDictionary {
  profilePic?: Express.Multer.File[];
  coverImage?: Express.Multer.File[];
  [key: string]: Express.Multer.File[] | undefined;
}

export interface MediaFiles {
  media?: Express.Multer.File[];
}

export interface Ivideos extends Document {
    videoUrl: string; //cloudinary
    title: string;
    thumbnailUrl: string; //cloudinary
    ownerId:Types.ObjectId;
    description: string;
    duration: number; //cloudinary in sec
    viewsCount: number;
    commentsCount: number;
    likesCount: number;
    dislikesCount: number;
    tags?: string[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}



// Interface for Post document
export interface IPost extends Document {
  ownerId: Types.ObjectId;             // user who created the post
  content: string;                     // text content of the post
  images?: string[];                   // array of image URLs (e.g., Cloudinary URLs)
  likesCount: number;                  // number of likes
  commentsCount: number;               // number of comments
  tags?: string[];                    // optional tags for the post
  isPublic: boolean;                   // visibility flag
  createdAt?: Date;
  updatedAt?: Date;
}
