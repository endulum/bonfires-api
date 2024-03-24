import './mongoConfigTesting'
import { reqShort, validationLoop } from './helpers'
import User from '../models/user'
import Channel, { type IChannelDocument } from '../models/channel'
import Message from '../models/message'

let users: Array<{
  username: string
  id: string
  token: string
}> = []

let groupChannel: IChannelDocument

beforeAll(async () => {
  users = await Promise.all(['demo-1', 'demo-2', 'demo-3', 'demo-4'].map(async (username) => {
    const userDocument = await User.create({ username, password: 'password' })
    const response = await reqShort('/login', 'post', null, { username, password: 'password' })

    const ownChannel = await Channel.create({
      title: 'My Own Channel',
      admin: userDocument.id,
      users: [userDocument.id]
    })

    return {
      username: userDocument.username,
      id: userDocument.id.toString(),
      token: response.body.token,
      ownChannel
    }
  }))

  groupChannel = await Channel.create({
    title: 'Our Channel',
    admin: users[0].id,
    users: [users[0].id]
  })
})

describe('message client ops', () => {
  describe('post a message in a channel', () => {
    test('POST /channel/:channel/messages - 403 if logged-in user is not in channel', async () => {
      const response = await reqShort(`/channel/${groupChannel.id}/messages`, 'post', users[3].token)
      expect(response.status).toBe(403)
    })

    test('POST /channel/:channel/messages - 422 if input error (message)', async () => {
      await validationLoop(
        'content',
        [
          { value: '', msg: 'Please enter a message.' },
          { value: Array(1000).fill('A').join(''), msg: 'Messages cannot be more than 512 characters long.' }
        ],
        { content: 'Hello, World' },
        `/channel/${groupChannel.id}/messages`, 'post', users[0].token
      )
    })

    test('POST /channel/:channel/messages - 200 and creates message for channel', async () => {
      const response = await reqShort(`/channel/${groupChannel.id}/messages`, 'post', users[0].token, { content: 'Hello, World' })
      expect(response.status).toBe(200)
    })
  })

  describe('see all messages of a channel', () => {
    test('GET /channel/:channel/messages - 403 if logged-in user is not in channel', async () => {
      const response = await reqShort(`/channel/${groupChannel.id}/messages`, 'get', users[3].token)
      expect(response.status).toBe(403)
    })

    test('GET /channel/:channel/messages - 200 and returns array of messages', async () => {
      const response = await reqShort(`/channel/${groupChannel.id}/messages`, 'get', users[0].token)
      expect(response.status).toBe(200)
      console.log(response.body)
    })
  })

  describe('if channel is deleted, its messages are gone, too', () => {
    test('DELETE /channel/:channel deletes all affiliated messages', async () => {
      await reqShort(`/channel/${groupChannel.id}`, 'delete', users[0].token)
      const messages = await Message.find({})
      expect(messages.length).toBe(0)
    })
  })
})
