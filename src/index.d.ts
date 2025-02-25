import {
  ChannelDocument,
  ChannelSettingsDocument,
  MessageDocument,
  UserDocument,
} from "../mongoose/interfaces/mongoose.gen";
import { PopulatedDocument } from "../mongoose/interfaces/mongoose.gen";
import { type Server } from "socket.io";

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
      thisMessage: MessageDocument;
      io: Server;
    }
  }
}

export {};
