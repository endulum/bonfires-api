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
  title: { type: String, required: true, maxlength: 32, minLength: 2 },
  owner: { type: Schema.ObjectId, ref: "User", required: true },
  users: [{ type: Schema.ObjectId, ref: "User", required: true }],
  lastActivity: { type: Date, default: () => Date.now() },
  hasAvatar: { type: Boolean, required: true, default: false },
});

// pagination
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

// plain query, finds channel to add to req object
channelSchema.query.byId = function (id: string) {
  if (mongoose.isValidObjectId(id)) return this.where({ _id: id });
  return this.where({ _id: undefined });
};

// full query, to send as json for GET /channel/:channel
channelSchema.query.byIdFull = function (id: string) {
  if (mongoose.isValidObjectId(id))
    return this.where({ _id: id }).populate([
      {
        path: "users",
        select: ["id", "username", "tagline"],
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
      },
      {
        path: "owner",
        select: ["id", "username"],
      },
    ]);
  return this.where({ _id: undefined });
};

// gets one member of this channel including both personal and channel settings
channelSchema.method(
  "getMemberWithSettings",
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

// bool
channelSchema.method("isOwner", function (user: UserDocument) {
  return this.owner._id.toString() === user._id.toString();
});

// bool
channelSchema.method("isInChannel", function (user: UserDocument) {
  return (
    this.users.find((u) => u._id.toString() === user._id.toString()) !==
    undefined
  );
});

// edits self and leaves an event
channelSchema.method(
  "updateTitle",
  async function (newTitle: string, user: UserDocument) {
    this.title = newTitle;
    await this.save();

    const { _id } = await Event.create({
      type: "channel_title",
      channel: this,
      user,
      newChannelTitle: newTitle,
    });
    const event = await Event.findOne().byIdFull(_id);
    return { event };
  }
);

// edits self and leaves an event
channelSchema.method("updateAvatar", async function (user: UserDocument) {
  if (!this.hasAvatar) {
    this.hasAvatar = true;
    await this.save();
  }

  const { _id } = await Event.create({
    type: "channel_avatar",
    channel: this,
    user,
  });
  const event = await Event.findOne().byIdFull(_id);
  return { event };
});

channelSchema.method(
  "kickOne",
  async function (kickee: UserDocument, kicker: UserDocument | null) {
    this.users.pull(kickee);
    await this.save();

    // if there is nobody left, delete self and stop
    if (this.users.length === 0) {
      await Channel.deleteOne({ _id: this._id });
      return { event: null };
    }

    // if whoever left was the owner, the next user in the array is now the owner
    if (kickee._id.toString() === this.owner._id.toString()) {
      this.owner = this.users[0];
      await this.save();
    }

    // remove channel settings for left user
    await ChannelSettings.deleteMany({
      $and: [{ channel: this }, { user: kickee }],
    });

    // make and return event
    const { _id } = await Event.create(
      kicker
        ? {
            // if a kicker was provided, this is a kick event
            type: "user_kick",
            channel: this,
            user: kicker,
            targetUser: kickee,
          }
        : {
            // if no kicker was provided, this is a leave event
            type: "user_leave",
            channel: this,
            user: kickee,
          }
    );
    const event = await Event.findOne().byIdFull(_id);
    return { event, userId: kickee._id };
  }
);

channelSchema.method(
  "inviteOne",
  async function (invitee: UserDocument, invitor: UserDocument) {
    this.users.push(invitee);
    await this.save();

    // create settings for new user
    await ChannelSettings.create({
      user: invitee,
      channel: this,
    });

    // find user populated with settings, to return as part of socket payload
    const user = await this.getMemberWithSettings(invitee._id);
    // make and return event
    const { _id } = await Event.create({
      type: "user_invite",
      channel: this,
      user: invitor,
      targetUser: invitee,
    });
    const event = await Event.findOne().byIdFull(_id);
    return { event, user };
  }
);

channelSchema.method(
  "kickMany", // DEV ONLY
  async function (kickees: UserDocument[]) {
    this.users.pull(...kickees);
    await this.save();

    // if there is nobody left, delete self and stop
    if (this.users.length === 0) {
      await Channel.deleteOne({ _id: this._id });
      return;
    }

    // if one of the people that left was the owner, the next user in the array is now the owner
    if (
      kickees.find((k) => k._id.toString() === this.owner._id.toString()) !==
      undefined
    ) {
      this.owner = this.users[0];
      await this.save();
    }

    // remove channel settings since users are no longer participants
    await ChannelSettings.deleteMany({
      $and: [{ channel: this }, { user: { $in: kickees } }],
    });
  }
);

channelSchema.method(
  "inviteMany", // DEV ONLY
  async function (invitees: UserDocument[]) {
    this.users.push(...invitees);
    await this.save();

    await ChannelSettings.insertMany(
      invitees.map((i) => ({ user: i, channel: this }))
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
