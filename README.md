# Bonfires (API)
Bonfires is a simple web app allowing users to start "camps" with one another and send messages in them. This repo hosts the API of Bonfires.

## Technologies
- Express as the server framework
- MongoDB as the server database
- Style enforced with ESLint ("Standard with TypeScript")
- Functionality enforced with Jest + Supertest testing

## Behavior Checklist
### Users
- [x] can create user accounts
- [x] can "log" in and out of user accounts
- [x] can view a user's details
  - [ ] can show mutual channels between logged-in user and target user
- [x] can edit own details 
### Channels
- [x] can create channels
  - [x] channel creator is automatically admin of the channel
- [x] can view a channel's details
- [x] can invite other users to a channel
- [ ] can leave a channel
  - [ ] being the last user to leave a channel deletes the channel
- [ ] can change own display name per channel
- [ ] channels have singular admins with special abilities:
  - [ ] can edit channel details
  - [ ] can kick a user from channel
  - [ ] can pass admin role to another user in channel
  - [ ] cannot leave a channel until admin role is passed
### Messages
- [ ] can send messages to a channel
- [ ] can remove own messages
- [ ] admins can remove any messages
