import './mongoConfigTesting'
import { assertDefined, reqShort, validationLoop } from './helpers'
import User, { type IUserDocument } from '../models/user'
import Channel from '../models/channel'

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
  let channelId: string

  describe('create a channel', () => {
    test('POST /channels - 422 if input error (username)', async () => {
      await validationLoop(
        'title',
        [
          { value: '', msg: 'Please enter a title.' },
          { value: 'a', msg: 'Channel title must be between 2 and 32 character long.' }
        ],
        { title: 'My First Camp' },
        '/channels', 'post', userTokens[0]
      )
    })

    test('POST /channels - 200 and creates a channel with creator as admin', async () => {
      const response = await reqShort('/channels', 'post', userTokens[0])
      expect(response.status).toBe(200)
      let channel = await Channel.findOne({ title: 'My First Camp' })
      channel = assertDefined(channel)
      expect(channel.admin).toEqual(users[0].id)
      expect(channel.users).toEqual([users[0].id])
      channelId = channel.id
    })
  })

  describe('view channel details', () => {
    test('GET /channel/:channel - 401 if not logged in', async () => {
      const response = await reqShort(`/channel/${channelId}`, 'get', null)
      expect(response.status).toBe(401)
    })

    test('GET /channel/:channel - 404 if channel does not exist', async () => {
      const response = await reqShort('/channel/blah', 'get', userTokens[0])
      expect(response.status).toBe(404)
      expect(response.text).toBe('This channel does not exist.')
    })

    test('GET /channel/:channel - 403 if logged-in user is not in this channel', async () => {
      const response = await reqShort(`/channel/${channelId}`, 'get', userTokens[1])
      expect(response.status).toBe(403)
      expect(response.text).toBe('You are not a member of this channel.')
    })

    test('GET /channel/:channel - 200 and returns channel details', async () => {
      const response = await reqShort(`/channel/${channelId}`, 'get', userTokens[0])
      expect(response.status).toBe(200)
      console.log(response.body)
    })
  })
})
