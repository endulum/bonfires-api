import mongoose, { Schema, Types } from "mongoose";

import {
  UserDocument,
  ChannelDocument,
  ChannelModel,
  ChannelSchema,
} from "../interfaces/mongoose.gen";
import { ChannelSettings } from "./channelSettings";
import { Message } from "./message";
import { Event } from "./event";
import { User } from "./user";

const channelSchema: ChannelSchema = new Schema({
  title: { type: String, required: true },
  owner: { type: Schema.ObjectId, ref: "User", required: true },
  users: [{ type: Schema.ObjectId, ref: "User", required: true }],
  lastActivity: { type: Date, default: () => Date.now() },
  hasAvatar: { type: Boolean, required: true, default: false },
});

channelSchema.static(
  "getPaginatedForUser",
  async function (
    user: UserDocument,
    take: number = 15,
    title: string = "",
    before?: string
  ) {
    const channels = await Channel.find({
      users: { $in: user },
      ...(title &&
        title !== "" && {
          title: { $regex: title, $options: "i" },
        }),
      ...(before && {
        lastActivity: {
          $lte: before,
        },
      }),
    })
      .limit(take + 1)
      .sort("-lastActivity -_id");

    return {
      channels: channels.slice(0, take),
      nextChannelTimestamp:
        channels.length > take
          ? channels[channels.length - 1].lastActivity?.getTime()
          : null,
    };
  }
);

// this is to avoid 500's if the :channel param isn't an id
channelSchema.query.byId = function (id: string) {
  if (mongoose.isValidObjectId(id)) return this.where({ _id: id });
  return this.where({ _id: undefined });
};

channelSchema.query.withUsersAndSettings = function (id: Types.ObjectId) {
  return this.populate({
    path: "users",
    select: ["username", "status"],
    populate: [
      {
        path: "channelSettings",
        model: "ChannelSettings",
        match: { channel: id },
        select: ["displayName", "nameColor", "invisible", "-_id", "-user"],
      },
      {
        path: "settings",
        select: ["defaultNameColor", "defaultInvisible", "-_id"],
      },
    ],
  });
};

channelSchema.method(
  "getUserWithSettings",
  async function (_id: Types.ObjectId) {
    return User.findOne({
      _id,
    }).populate([
      {
        path: "channelSettings",
        model: "ChannelSettings",
        match: { channel: this },
        select: ["displayName", "nameColor", "invisible", "-_id", "-user"],
      },
      {
        path: "settings",
        select: ["defaultNameColor", "defaultInvisible", "-_id"],
      },
    ]);
  }
);

channelSchema.method("isOwner", function (user: UserDocument) {
  return this.owner._id.toString() === user._id.toString();
});

channelSchema.method("isInChannel", function (user: UserDocument) {
  return (
    this.users.find((u) => u._id.toString() === user._id.toString()) !==
    undefined
  );
});

channelSchema.method("getSettingsForUser", async function (user: UserDocument) {
  let channelSettings = await ChannelSettings.findOne({
    user,
    channel: this,
  });
  if (!channelSettings)
    channelSettings = await ChannelSettings.create({
      user: user,
      channel: this,
    });
  return channelSettings;
});

channelSchema.method(
  "updateTitle",
  async function (newTitle: string, user: UserDocument) {
    this.title = newTitle;
    await this.save();

    await Event.create({
      type: "channel_title",
      channel: this,
      user,
      newChannelTitle: newTitle,
    });
  }
);

channelSchema.method("updateAvatar", async function (user: UserDocument) {
  if (!this.hasAvatar) {
    this.hasAvatar = true;
    await this.save();
  }

  await Event.create({
    type: "channel_avatar",
    channel: this,
    user,
  });
});

channelSchema.method(
  "kick",
  async function (users: UserDocument[], kicker?: UserDocument) {
    this.users.pull(...users);
    await this.save();

    // if there is nobody left, delete self
    if (this.users.length === 0) {
      await Channel.deleteOne({ _id: this._id });
      return;
    }

    // if one of the people that left was the owner, the next user in the array is now the owner
    if (
      users.find((u) => u._id.toString() === this.owner._id.toString()) !==
      undefined
    ) {
      this.owner = this.users[0];
      await this.save();
    }

    // remove channel settings since users are no longer participants
    await ChannelSettings.deleteMany({
      $and: [{ channel: this }, { user: { $in: users } }],
    });

    // add "__ removed __ from this channel" event for each person that left
    await Event.insertMany(
      users.map((u) =>
        kicker
          ? {
              // if a kicker was provided, this is a kick event
              type: "user_kick",
              channel: this,
              user: kicker,
              targetUser: u,
            }
          : {
              // if no kicker was provided, this is a leave event
              type: "user_leave",
              channel: this,
              user: u,
            }
      )
    );
  }
);

channelSchema.method(
  "invite",
  async function (users: UserDocument[], invitor: UserDocument) {
    this.users.push(...users);
    await this.save();

    // add channel settings for new participants
    await ChannelSettings.insertMany(
      users.map((u) => ({ user: u, channel: this }))
    );

    // add "__ added __ to this channel" event for each invitee
    await Event.insertMany(
      users.map((u) => ({
        type: "user_invite",
        channel: this,
        user: invitor,
        targetUser: u,
      }))
    );
  }
);

channelSchema.pre("save", async function (next) {
  if (this.isNew) {
    // make sure the admin is included in the users array and gets own settings
    this.users.push(this.owner);
    await ChannelSettings.create({
      user: this.owner,
      channel: this,
    });
  }
  return next();
});

// remove associated Message, ChannelSettings, and Event documents
channelSchema.pre("deleteOne", async function (next) {
  // deleteOne is a query hook, not a document hook,
  // and i can't change this to a "findOneAndDelete" hook
  // because not only is that also still a query hook,
  // it will simply not run if `document` is set to true.
  // this is a workaround to still get the id from `this`
  if ("_conditions" in this) {
    const channel = (this["_conditions"] as { _id: mongoose.Types.ObjectId })[
      "_id"
    ];
    await Message.deleteMany({ channel });
    await ChannelSettings.deleteMany({ channel });
    await Event.deleteMany({ channel });
  }
  return next();
});

export const Channel: ChannelModel = mongoose.model<
  ChannelDocument,
  ChannelModel
>("Channel", channelSchema);
