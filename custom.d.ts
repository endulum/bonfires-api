import { type IUserDocument } from './models/user'
import { type IChannelDocument } from './models/channel'

declare global {
  namespace Express {
    interface Request {
      authUser: IUserDocument // the authenticated user
      user: IUserDocument // the user indicated by :user
      existingUser: IUserDocument // for validation chains involving users
      channel: IChannelDocument // the channel indicated by :channel
    }
  }
}
