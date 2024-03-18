# Bonfires (API)
Bonfires is a simple messaging web app allowing users to start "camps" with one another and send messages in them. This repo hosts the API of Bonfires.

## Technologies
- Express as the server framework
- MongoDB as the server database
- Style enforced with ESLint ("Standard with TypeScript")
- Functionality enforced with Jest + Supertest testing

## Behavior Checklist
### Users
- [x] `POST /signup` - creates a user account
- [x] `POST /login` - returns an authentication token for a user account, provided correct account details
- [x] `GET /user/:user` - returns a user's details
- [x] `PUT /user/:user` - edits a user's details
### Channels
- [x] `GET /channels` - returns all channels the logged-in user is in
- [x] `POST /channels` - creates a channel, and sets the logged-in user as admin of channel
- [x] `GET /channel/:id` - returns a channel's details
- [x] `PUT /channel/:id` - edits a channel's details (admin only)
- [x] `DELETE /channel/:id` - removes logged-in user from a channel, and deletes the channel if no users remain
- [x] `POST /channel/:id/invite` - adds a user to a channel by username
- [x] `POST /channel/:id/kick` - removes a user from a channel by username (admin only)
- [x] `POST /channel/:id/promote` - passes admin role to another user (admin only)
- [x] `POST /channel/:id/name` - edits logged-in user's display name for a channel
### Messages
- [x] `GET /channel/:id/messages` - returns all messages posted in a channel
- [x] `POST /channel/:id/messages` - creates a message in a channel
- [ ] `DELETE /message/:id` - permanently deletes a message (admin only, otherwise can only delete own messages)
