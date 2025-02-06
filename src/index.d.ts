import {
  ChannelDocument,
  ChannelSettingsDocument,
  UserDocument,
} from "../mongoose/interfaces/mongoose.gen";
import { PopulatedDocument } from "../mongoose/interfaces/mongoose.gen";

declare global {
  namespace Express {
    export interface Request {
      formErrors?: Record<string, string>;
      user: PopulatedDocument<UserDocument, "settings">;
      thisUser: PopulatedDocument<UserDocument, "settings">;
      thisChannel: PopulatedDocument<
        PopulatedDocument<ChannelDocument, "admin">,
        "users"
      >;
      thisChannelSettings: ChannelSettingsDocument;
    }
  }
}

export {};
