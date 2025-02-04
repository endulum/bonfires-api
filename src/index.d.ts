import { UserDocument } from "../mongoose/interfaces/mongoose.gen";
import { PopulatedDocument } from "../mongoose/interfaces/mongoose.gen";

declare global {
  namespace Express {
    export interface Request {
      formErrors?: Record<string, string>;
      user: PopulatedDocument<UserDocument, "settings">;
      thisUser: PopulatedDocument<UserDocument, "settings">;
    }
  }
}

export {};
