import { UserDocument } from "../mongoose/interfaces/mongoose.gen";

declare global {
  namespace Express {
    export interface Request {
      formErrors?: Record<string, string>;
      user: UserDocument;
      thisUser: UserDocument;
    }
  }
}

export {};
