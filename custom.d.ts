import { type IUserDocument } from './models/user'
import { type IChannelDocument } from './models/channel'

declare global {
  namespace Express {
    interface Request {
      requestedUser: IUserDocument // for urls where id is in the request params
      requestedChannel: IChannelDocument // same as above but for channels
      loggingInUser: IUserDocument // for logging in
      authenticatedUser: IUserDocument // for protected routes
      existingUser: IUserDocument // for validation chains
    }
  }
}
