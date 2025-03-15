# Bonfires API

Bonfires is a messaging app with a toasty, cozy flavor.

This is the API repo. See the [repo for the frontend here](https://github.com/endulum/bonfires).

### Installation and environment

This is a Node.js project, so you will need Node installed.

Navigate to the root directory where you'd like this project to be, and clone this repo:

```sh
git clone https://github.com/endulum/bonfires-api
```

Navigate to the root of the newly created `/bonfires-api`, and install all required packages:

```sh
npm install
```

### Integrations and environment

This project uses three env files: `test`, `development`, and `production`. Bonfires supplies a file `.env.example` with the variables necessary for the project to run. Copy this file to the three envs described. A handy script for this is provided for you, `npm run envinit`.

As you can find in `.env.example`, this project uses the following integrations:

- MongoDB, as a database to store account, channel, and message information. Needs `MONGO_URI`.
- Supabase, to store avatars. Needs `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`.
- GitHub App, to authorize accounts through GitHub. Needs `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
- Redis, to cache avatars and keep memory of channel activity. Needs `REDIS_URL`.

#### MongoDB

You need an existing MongoDB database somewhere and its connection URI.

Note that testing uses an in-memory MongoDB server. The `test` environment file can have the `MONGO_URI` var safely omitted.

#### Supabase

You need a Supabase account with an active project. Bonfires utilizes the Supabase Storage filesystem, and needs your project URL and `service_role` key. You can find both under the **Data API** tab of your project settings. Bonfires expects and utilizes two Supabase buckets, `bonfires_development` and `bonfires_production`.

Note that the Supabase module of this project is not utilized in the `test` environment.

#### GitHub App

Bonfires needs the client ID and secret of an active GitHub app.

Note that GitHub authentication is not utilized in the `test` environment.

#### Redis

Bonfires needs the URI of a Redis database. This project provides a Docker image for a Redis cache for your convenience, so for your `.env.development`, you can have the URI point to that cache:

```env
REDIS_URL=redis://localhost:6379
```

Note that Redis caching is not utilized in the `test` environment.

#### Other

If developing with a frontend, Bonfires needs to know the `FRONTEND_URL` for CORS and to complete the callback URL for GitHub authentication.

Bonfires uses JSON Web Token and needs a `JWT_SECRET` to sign tokens. It can be any string.

### Starter data

Bonfires supplies a `reset` script that performs the following:

- Connects to your Supabase bucket and empties it.
- Empties all MongoDB collections.
- Creates one admin account.

The script also contains commented examples of populating fake data using the `dev` module for mass-creating and managing users and channels.

To run this reset, invoke `npm run reset`. You can also invoke a reset on your production database and bucket with `npm run reset:prod`.

### Avatar autogeneration

The creation of an account invokes the generation of an avatar image. See `avatar-gen/gen.ts` for the implementation, but the basis is that it superimposes a black SVG (inverted) of a random animal from a set of animals, over a background of a random color from a set of colors. Both the color set and `avatar-gen/animals` can be freely adjusted to contain any colors and SVGs you wish.

### Endpoint overview

| Endpoint                                     | Description                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /login`                                | Log in to a user account. This returns a JWT representing the user on success.                                                                                                                                                                                                                                       |
| `POST /signup`                               | Create a user account.                                                                                                                                                                                                                                                                                               |
| `GET /github`                                | Authenticate using a GitHub App.<br />- `?code=<string>`: token string for authentication, required.                                                                                                                                                                                                                 |
| `GET /me`                                    | Get the user data of the authenticated user (yourself).                                                                                                                                                                                                                                                              |
| `PUT /me`                                    | Edit the user data of the authenticated user (yourself).                                                                                                                                                                                                                                                             |
| `GET /channels`                              | Get all channels the authenticated user is a member of in a forward-paginated list.<br />- `?title=<string>`: filters for titles containing the string.<br />- `?take=<int>`: limits max list size by the indicated amount.<br />- `?before=<id string>`: gets results after the channel indicated by the id string. |
| `POST /channels`                             | Create a channel.                                                                                                                                                                                                                                                                                                    |
| `GET /channel/:channel`                      | Get basic info, including memberlist, about a channel.                                                                                                                                                                                                                                                               |
| `PUT /channel/:channel`                      | Edit basic info about a channel.                                                                                                                                                                                                                                                                                     |
| `DELETE /channel/:channel`                   | Delete a channel.                                                                                                                                                                                                                                                                                                    |
| `POST /channel/:channel/leave`               | Leave a channel.                                                                                                                                                                                                                                                                                                     |
| `POST /channel/:channel/invite`              | Invite a user to a channel.                                                                                                                                                                                                                                                                                          |
| `POST /channel/:channel/kick`                | Remove a user from a channel.                                                                                                                                                                                                                                                                                        |
| `POST /channel/:channel/settings`            | Edit the `channelSettings` belonging to the authenticated user and for this specific channel.                                                                                                                                                                                                                        |
| `GET /channel/:channel/messages`             | Get all messages of this channel in a forward-paginated list.<br />- `?take=<int>`: limits max list size by the indicated amount.<br />- `?before=<id string>`: gets results after the message indicated by the id string.                                                                                           |
| `POST /channel/:channel/messages`            | Create a message for this channel.                                                                                                                                                                                                                                                                                   |
| `GET /channel/:channel/pinned`               | Get all pinned messages of this channel.                                                                                                                                                                                                                                                                             |
| `GET /channel/:channel/message/:message`     | Get a message.                                                                                                                                                                                                                                                                                                       |
| `PUT /channel/:channel/message/:message`     | Edit a message.                                                                                                                                                                                                                                                                                                      |
| `DELETE /channel/:channel/message/:message`  | Delete a message.                                                                                                                                                                                                                                                                                                    |
| `PUT /channel/:channel/message/:message/pin` | Pin or unpin a message.                                                                                                                                                                                                                                                                                              |
| `GET /channel/:channel/avatar`               | Get the avatar of a channel.                                                                                                                                                                                                                                                                                         |
| `GET /user/:user/avatar`                     | Get the avatar of a user.                                                                                                                                                                                                                                                                                            |
