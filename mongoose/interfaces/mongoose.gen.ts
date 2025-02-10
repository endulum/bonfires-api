/* tslint:disable */
/* eslint-disable */

// ######################################## THIS FILE WAS GENERATED BY MONGOOSE-TSGEN ######################################## //

// NOTE: ANY CHANGES MADE WILL BE OVERWRITTEN ON SUBSEQUENT EXECUTIONS OF MONGOOSE-TSGEN.

import mongoose from "mongoose";

/**
 * Lean version of ChannelDocument
 *
 * This has all Mongoose getters & functions removed. This type will be returned from `ChannelDocument.toObject()`. To avoid conflicts with model names, use the type alias `ChannelObject`.
 * ```
 * const channelObject = channel.toObject();
 * ```
 */
export type Channel = {
  title: string;
  admin: User["_id"] | User;
  users: (User["_id"] | User)[];
  lastActivity?: Date;
  hasAvatar: boolean;
  _id: mongoose.Types.ObjectId;
};

/**
 * Lean version of ChannelDocument (type alias of `Channel`)
 *
 * Use this type alias to avoid conflicts with model names:
 * ```
 * import { Channel } from "../models"
 * import { ChannelObject } from "../interfaces/mongoose.gen.ts"
 *
 * const channelObject: ChannelObject = channel.toObject();
 * ```
 */
export type ChannelObject = Channel;

/**
 * Mongoose Query type
 *
 * This type is returned from query functions. For most use cases, you should not need to use this type explicitly.
 */
export type ChannelQuery = mongoose.Query<
  any,
  ChannelDocument,
  ChannelQueries
> &
  ChannelQueries;

/**
 * Mongoose Query helper types
 *
 * This type represents `ChannelSchema.query`. For most use cases, you should not need to use this type explicitly.
 */
export type ChannelQueries = {
  byId: (this: ChannelQuery, ...args: any[]) => ChannelQuery;
  withUsersAndSettings: (this: ChannelQuery, ...args: any[]) => ChannelQuery;
};

export type ChannelMethods = {
  isInChannel: (this: ChannelDocument, ...args: any[]) => any;
  getSettings: (this: ChannelDocument, ...args: any[]) => any;
  isAdmin: (this: ChannelDocument, ...args: any[]) => any;
  updateTitle: (this: ChannelDocument, ...args: any[]) => any;
  updateAdmin: (this: ChannelDocument, ...args: any[]) => any;
  kick: (this: ChannelDocument, ...args: any[]) => any;
  invite: (this: ChannelDocument, ...args: any[]) => any;
  toggleHasAvatar: (this: ChannelDocument, ...args: any[]) => any;
};

export type ChannelStatics = {
  getPaginated: (this: ChannelModel, ...args: any[]) => any;
};

/**
 * Mongoose Model type
 *
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const Channel = mongoose.model<ChannelDocument, ChannelModel>("Channel", ChannelSchema);
 * ```
 */
export type ChannelModel = mongoose.Model<ChannelDocument, ChannelQueries> &
  ChannelStatics;

/**
 * Mongoose Schema type
 *
 * Assign this type to new Channel schema instances:
 * ```
 * const ChannelSchema: ChannelSchema = new mongoose.Schema({ ... })
 * ```
 */
export type ChannelSchema = mongoose.Schema<
  ChannelDocument,
  ChannelModel,
  ChannelMethods,
  ChannelQueries
>;

/**
 * Mongoose Document type
 *
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const Channel = mongoose.model<ChannelDocument, ChannelModel>("Channel", ChannelSchema);
 * ```
 */
export type ChannelDocument = mongoose.Document<
  mongoose.Types.ObjectId,
  ChannelQueries
> &
  ChannelMethods & {
    title: string;
    admin: UserDocument["_id"] | UserDocument;
    users: mongoose.Types.Array<UserDocument["_id"] | UserDocument>;
    lastActivity?: Date;
    hasAvatar: boolean;
    _id: mongoose.Types.ObjectId;
  };

/**
 * Lean version of ChannelSettingsDocument
 *
 * This has all Mongoose getters & functions removed. This type will be returned from `ChannelSettingsDocument.toObject()`. To avoid conflicts with model names, use the type alias `ChannelSettingsObject`.
 * ```
 * const channelsettingsObject = channelsettings.toObject();
 * ```
 */
export type ChannelSettings = {
  user: mongoose.Types.ObjectId;
  channel: mongoose.Types.ObjectId;
  displayName?: string;
  nameColor?: string;
  invisible?: boolean;
  _id: mongoose.Types.ObjectId;
};

/**
 * Lean version of ChannelSettingsDocument (type alias of `ChannelSettings`)
 *
 * Use this type alias to avoid conflicts with model names:
 * ```
 * import { ChannelSettings } from "../models"
 * import { ChannelSettingsObject } from "../interfaces/mongoose.gen.ts"
 *
 * const channelsettingsObject: ChannelSettingsObject = channelsettings.toObject();
 * ```
 */
export type ChannelSettingsObject = ChannelSettings;

/**
 * Mongoose Query type
 *
 * This type is returned from query functions. For most use cases, you should not need to use this type explicitly.
 */
export type ChannelSettingsQuery = mongoose.Query<
  any,
  ChannelSettingsDocument,
  ChannelSettingsQueries
> &
  ChannelSettingsQueries;

/**
 * Mongoose Query helper types
 *
 * This type represents `ChannelSettingsSchema.query`. For most use cases, you should not need to use this type explicitly.
 */
export type ChannelSettingsQueries = {};

export type ChannelSettingsMethods = {
  update: (this: ChannelSettingsDocument, ...args: any[]) => any;
};

export type ChannelSettingsStatics = {};

/**
 * Mongoose Model type
 *
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const ChannelSettings = mongoose.model<ChannelSettingsDocument, ChannelSettingsModel>("ChannelSettings", ChannelSettingsSchema);
 * ```
 */
export type ChannelSettingsModel = mongoose.Model<
  ChannelSettingsDocument,
  ChannelSettingsQueries
> &
  ChannelSettingsStatics;

/**
 * Mongoose Schema type
 *
 * Assign this type to new ChannelSettings schema instances:
 * ```
 * const ChannelSettingsSchema: ChannelSettingsSchema = new mongoose.Schema({ ... })
 * ```
 */
export type ChannelSettingsSchema = mongoose.Schema<
  ChannelSettingsDocument,
  ChannelSettingsModel,
  ChannelSettingsMethods,
  ChannelSettingsQueries
>;

/**
 * Mongoose Document type
 *
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const ChannelSettings = mongoose.model<ChannelSettingsDocument, ChannelSettingsModel>("ChannelSettings", ChannelSettingsSchema);
 * ```
 */
export type ChannelSettingsDocument = mongoose.Document<
  mongoose.Types.ObjectId,
  ChannelSettingsQueries
> &
  ChannelSettingsMethods & {
    user: mongoose.Types.ObjectId;
    channel: mongoose.Types.ObjectId;
    displayName?: string;
    nameColor?: string;
    invisible?: boolean;
    _id: mongoose.Types.ObjectId;
  };

/**
 * Lean version of MessageDocument
 *
 * This has all Mongoose getters & functions removed. This type will be returned from `MessageDocument.toObject()`. To avoid conflicts with model names, use the type alias `MessageObject`.
 * ```
 * const messageObject = message.toObject();
 * ```
 */
export type Message = {
  channel: User["_id"] | User;
  user: Channel["_id"] | Channel;
  timestamp?: Date;
  content: string;
  _id: mongoose.Types.ObjectId;
};

/**
 * Lean version of MessageDocument (type alias of `Message`)
 *
 * Use this type alias to avoid conflicts with model names:
 * ```
 * import { Message } from "../models"
 * import { MessageObject } from "../interfaces/mongoose.gen.ts"
 *
 * const messageObject: MessageObject = message.toObject();
 * ```
 */
export type MessageObject = Message;

/**
 * Mongoose Query type
 *
 * This type is returned from query functions. For most use cases, you should not need to use this type explicitly.
 */
export type MessageQuery = mongoose.Query<
  any,
  MessageDocument,
  MessageQueries
> &
  MessageQueries;

/**
 * Mongoose Query helper types
 *
 * This type represents `MessageSchema.query`. For most use cases, you should not need to use this type explicitly.
 */
export type MessageQueries = {};

export type MessageMethods = {};

export type MessageStatics = {
  getPaginated: (this: MessageModel, ...args: any[]) => any;
};

/**
 * Mongoose Model type
 *
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const Message = mongoose.model<MessageDocument, MessageModel>("Message", MessageSchema);
 * ```
 */
export type MessageModel = mongoose.Model<MessageDocument, MessageQueries> &
  MessageStatics;

/**
 * Mongoose Schema type
 *
 * Assign this type to new Message schema instances:
 * ```
 * const MessageSchema: MessageSchema = new mongoose.Schema({ ... })
 * ```
 */
export type MessageSchema = mongoose.Schema<
  MessageDocument,
  MessageModel,
  MessageMethods,
  MessageQueries
>;

/**
 * Mongoose Document type
 *
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const Message = mongoose.model<MessageDocument, MessageModel>("Message", MessageSchema);
 * ```
 */
export type MessageDocument = mongoose.Document<
  mongoose.Types.ObjectId,
  MessageQueries
> &
  MessageMethods & {
    channel: UserDocument["_id"] | UserDocument;
    user: ChannelDocument["_id"] | ChannelDocument;
    timestamp?: Date;
    content: string;
    _id: mongoose.Types.ObjectId;
  };

/**
 * Lean version of UserDocument
 *
 * This has all Mongoose getters & functions removed. This type will be returned from `UserDocument.toObject()`. To avoid conflicts with model names, use the type alias `UserObject`.
 * ```
 * const userObject = user.toObject();
 * ```
 */
export type User = {
  username: string;
  password?: string;
  joined?: Date;
  status?: string;
  ghUser?: string;
  ghId?: number;
  settings: UserSettings["_id"] | UserSettings;
  hasAvatar: boolean;
  _id: mongoose.Types.ObjectId;
  channelSettings: any;
};

/**
 * Lean version of UserDocument (type alias of `User`)
 *
 * Use this type alias to avoid conflicts with model names:
 * ```
 * import { User } from "../models"
 * import { UserObject } from "../interfaces/mongoose.gen.ts"
 *
 * const userObject: UserObject = user.toObject();
 * ```
 */
export type UserObject = User;

/**
 * Mongoose Query type
 *
 * This type is returned from query functions. For most use cases, you should not need to use this type explicitly.
 */
export type UserQuery = mongoose.Query<any, UserDocument, UserQueries> &
  UserQueries;

/**
 * Mongoose Query helper types
 *
 * This type represents `UserSchema.query`. For most use cases, you should not need to use this type explicitly.
 */
export type UserQueries = {
  byNameOrId: (this: UserQuery, ...args: any[]) => UserQuery;
};

export type UserMethods = {
  getMutualChannels: (this: UserDocument, ...args: any[]) => any;
  updateDetails: (this: UserDocument, ...args: any[]) => any;
  updateGitHubUser: (this: UserDocument, ...args: any[]) => any;
  comparePassword: (this: UserDocument, ...args: any[]) => any;
  toggleHasAvatar: (this: UserDocument, ...args: any[]) => any;
};

export type UserStatics = {};

/**
 * Mongoose Model type
 *
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const User = mongoose.model<UserDocument, UserModel>("User", UserSchema);
 * ```
 */
export type UserModel = mongoose.Model<UserDocument, UserQueries> & UserStatics;

/**
 * Mongoose Schema type
 *
 * Assign this type to new User schema instances:
 * ```
 * const UserSchema: UserSchema = new mongoose.Schema({ ... })
 * ```
 */
export type UserSchema = mongoose.Schema<
  UserDocument,
  UserModel,
  UserMethods,
  UserQueries
>;

/**
 * Mongoose Document type
 *
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const User = mongoose.model<UserDocument, UserModel>("User", UserSchema);
 * ```
 */
export type UserDocument = mongoose.Document<
  mongoose.Types.ObjectId,
  UserQueries
> &
  UserMethods & {
    username: string;
    password?: string;
    joined?: Date;
    status?: string;
    ghUser?: string;
    ghId?: number;
    settings: UserSettingsDocument["_id"] | UserSettingsDocument;
    hasAvatar: boolean;
    _id: mongoose.Types.ObjectId;
    channelSettings: any;
  };

/**
 * Lean version of UserSettingsDocument
 *
 * This has all Mongoose getters & functions removed. This type will be returned from `UserSettingsDocument.toObject()`. To avoid conflicts with model names, use the type alias `UserSettingsObject`.
 * ```
 * const usersettingsObject = usersettings.toObject();
 * ```
 */
export type UserSettings = {
  defaultNameColor: string;
  defaultInvisible: boolean;
  _id: mongoose.Types.ObjectId;
};

/**
 * Lean version of UserSettingsDocument (type alias of `UserSettings`)
 *
 * Use this type alias to avoid conflicts with model names:
 * ```
 * import { UserSettings } from "../models"
 * import { UserSettingsObject } from "../interfaces/mongoose.gen.ts"
 *
 * const usersettingsObject: UserSettingsObject = usersettings.toObject();
 * ```
 */
export type UserSettingsObject = UserSettings;

/**
 * Mongoose Query type
 *
 * This type is returned from query functions. For most use cases, you should not need to use this type explicitly.
 */
export type UserSettingsQuery = mongoose.Query<
  any,
  UserSettingsDocument,
  UserSettingsQueries
> &
  UserSettingsQueries;

/**
 * Mongoose Query helper types
 *
 * This type represents `UserSettingsSchema.query`. For most use cases, you should not need to use this type explicitly.
 */
export type UserSettingsQueries = {};

export type UserSettingsMethods = {};

export type UserSettingsStatics = {};

/**
 * Mongoose Model type
 *
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const UserSettings = mongoose.model<UserSettingsDocument, UserSettingsModel>("UserSettings", UserSettingsSchema);
 * ```
 */
export type UserSettingsModel = mongoose.Model<
  UserSettingsDocument,
  UserSettingsQueries
> &
  UserSettingsStatics;

/**
 * Mongoose Schema type
 *
 * Assign this type to new UserSettings schema instances:
 * ```
 * const UserSettingsSchema: UserSettingsSchema = new mongoose.Schema({ ... })
 * ```
 */
export type UserSettingsSchema = mongoose.Schema<
  UserSettingsDocument,
  UserSettingsModel,
  UserSettingsMethods,
  UserSettingsQueries
>;

/**
 * Mongoose Document type
 *
 * Pass this type to the Mongoose Model constructor:
 * ```
 * const UserSettings = mongoose.model<UserSettingsDocument, UserSettingsModel>("UserSettings", UserSettingsSchema);
 * ```
 */
export type UserSettingsDocument = mongoose.Document<
  mongoose.Types.ObjectId,
  UserSettingsQueries
> &
  UserSettingsMethods & {
    defaultNameColor: string;
    defaultInvisible: boolean;
    _id: mongoose.Types.ObjectId;
  };

/**
 * Check if a property on a document is populated:
 * ```
 * import { IsPopulated } from "../interfaces/mongoose.gen.ts"
 *
 * if (IsPopulated<UserDocument["bestFriend"]>) { ... }
 * ```
 */
export function IsPopulated<T>(doc: T | mongoose.Types.ObjectId): doc is T {
  return doc instanceof mongoose.Document;
}

/**
 * Helper type used by `PopulatedDocument`. Returns the parent property of a string
 * representing a nested property (i.e. `friend.user` -> `friend`)
 */
type ParentProperty<T> = T extends `${infer P}.${string}` ? P : never;

/**
 * Helper type used by `PopulatedDocument`. Returns the child property of a string
 * representing a nested property (i.e. `friend.user` -> `user`).
 */
type ChildProperty<T> = T extends `${string}.${infer C}` ? C : never;

/**
 * Helper type used by `PopulatedDocument`. Removes the `ObjectId` from the general union type generated
 * for ref documents (i.e. `mongoose.Types.ObjectId | UserDocument` -> `UserDocument`)
 */
type PopulatedProperty<Root, T extends keyof Root> = Omit<Root, T> & {
  [ref in T]: Root[T] extends mongoose.Types.Array<infer U>
    ? mongoose.Types.Array<Exclude<U, mongoose.Types.ObjectId>>
    : Exclude<Root[T], mongoose.Types.ObjectId>;
};

/**
 * Populate properties on a document type:
 * ```
 * import { PopulatedDocument } from "../interfaces/mongoose.gen.ts"
 *
 * function example(user: PopulatedDocument<UserDocument, "bestFriend">) {
 *   console.log(user.bestFriend._id) // typescript knows this is populated
 * }
 * ```
 */
export type PopulatedDocument<DocType, T> = T extends keyof DocType
  ? PopulatedProperty<DocType, T>
  : ParentProperty<T> extends keyof DocType
  ? Omit<DocType, ParentProperty<T>> & {
      [ref in ParentProperty<T>]: DocType[ParentProperty<T>] extends mongoose.Types.Array<
        infer U
      >
        ? mongoose.Types.Array<
            ChildProperty<T> extends keyof U
              ? PopulatedProperty<U, ChildProperty<T>>
              : PopulatedDocument<U, ChildProperty<T>>
          >
        : ChildProperty<T> extends keyof DocType[ParentProperty<T>]
        ? PopulatedProperty<DocType[ParentProperty<T>], ChildProperty<T>>
        : PopulatedDocument<DocType[ParentProperty<T>], ChildProperty<T>>;
    }
  : DocType;

/**
 * Helper types used by the populate overloads
 */
type Unarray<T> = T extends Array<infer U> ? U : T;
type Modify<T, R> = Omit<T, keyof R> & R;

/**
 * Augment mongoose with Query.populate overloads
 */
declare module "mongoose" {
  interface Query<ResultType, DocType, THelpers = {}> {
    populate<T extends string>(
      path: T,
      select?: string | any,
      model?: string | Model<any, THelpers>,
      match?: any
    ): Query<
      ResultType extends Array<DocType>
        ? Array<PopulatedDocument<Unarray<ResultType>, T>>
        : ResultType extends DocType
        ? PopulatedDocument<Unarray<ResultType>, T>
        : ResultType,
      DocType,
      THelpers
    > &
      THelpers;

    populate<T extends string>(
      options: Modify<PopulateOptions, { path: T }> | Array<PopulateOptions>
    ): Query<
      ResultType extends Array<DocType>
        ? Array<PopulatedDocument<Unarray<ResultType>, T>>
        : ResultType extends DocType
        ? PopulatedDocument<Unarray<ResultType>, T>
        : ResultType,
      DocType,
      THelpers
    > &
      THelpers;
  }
}
