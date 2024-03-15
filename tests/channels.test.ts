import './mongoConfigTesting'
import { assertDefined, reqShort, validationLoop } from './helpers'
import User, { type IUserDocument } from '../models/user'
import Channel, { type IChannelDocument } from '../models/channel'

const users: IUserDocument[] = []
const userTokens: string[] = []

beforeAll(async () => {
  await Promise.all([
    'demo-user-1', 'demo-user-2', 'demo-user-3'
  ].map(async username => {
    const user = await User.create({
      username,
      password: 'password'
    })
    users.push(user)
    const response = await reqShort('/login', 'post', null,
      { username, password: 'password' }
    )
    userTokens.push(response.body.token as string)
  }))
})

describe('channel client ops', () => {
  let channel: IChannelDocument

  describe('create a channel', () => {
    test('POST /channels - 422 if input error (username)', async () => {
      await validationLoop(
        'title',
        [
          { value: '', msg: 'Please enter a title.' },
          { value: 'a', msg: 'Channel title must be between 2 and 32 characters long.' }
        ],
        { title: 'My First Camp' },
        '/channels', 'post', userTokens[0]
      )
    })

    test('POST /channels - 200 and creates a channel with creator as admin', async () => {
      const response = await reqShort('/channels', 'post', userTokens[0], {
        title: 'My First Camp'
      })
      expect(response.status).toBe(200)
      let existingChannel = await Channel.findOne({ title: 'My First Camp' })
      existingChannel = assertDefined(existingChannel)
      expect(existingChannel.admin.toString()).toEqual(users[0].id)
      expect(existingChannel.users[0].toString()).toEqual(users[0].id)
      channel = existingChannel
    })
  })

  describe('view channel details', () => {
    test('GET /channel/:channel - 401 if not logged in', async () => {
      const response = await reqShort(`/channel/${channel.id}`, 'get', null)
      expect(response.status).toBe(401)
    })

    test('GET /channel/:channel - 404 if channel does not exist', async () => {
      const response = await reqShort('/channel/blah', 'get', userTokens[0])
      expect(response.status).toBe(404)
      expect(response.text).toBe('Channel not found.')
    })

    test('GET /channel/:channel - 403 if logged-in user is not in this channel', async () => {
      const response = await reqShort(`/channel/${channel.id}`, 'get', userTokens[1])
      expect(response.status).toBe(403)
      expect(response.text).toBe('You are not a member of this channel.')
    })

    test('GET /channel/:channel - 200 and returns channel details', async () => {
      const response = await reqShort(`/channel/${channel.id}`, 'get', userTokens[0])
      expect(response.status).toBe(200)
      console.log(response.body)
    })
  })

  describe('invite others to channel', () => {
    test('POST /channel/:channel/invite - 422 if input error (username)', async () => {
      await validationLoop(
        'username',
        [
          { value: '', msg: 'Please enter a username.' },
          { value: 'a', msg: 'No user with this username exists.' },
          { value: users[0].username, msg: 'This user is already in this channel.' }
        ],
        { username: users[1].username },
        `/channel/${channel.id}/invite`, 'post', userTokens[0]
      )
    })

    test('POST /channel/:channel/invite - 200 and invites user to channel', async () => {
      let response = await reqShort(
        `/channel/${channel.id}/invite`, 'post', userTokens[0],
        { username: users[1].username }
      )
      expect(response.status).toBe(200)
      response = await reqShort(
        `/channel/${channel.id}`, 'get', userTokens[0]
      )
      expect(response.body.users.length).toBe(2)
    })
  })
})
