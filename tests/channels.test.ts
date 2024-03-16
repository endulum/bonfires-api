import './mongoConfigTesting'
import { assertDefined, reqShort, validationLoop } from './helpers'
import User from '../models/user'
import Channel from '../models/channel'

let users: Array<{
  username: string
  id: string
  token: string
}> = []

beforeAll(async () => {
  users = await Promise.all(['demo-1', 'demo-2', 'demo-1'].map(async (username) => {
    const userDocument = await User.create({ username, password: 'password' })
    const response = await reqShort('/login', 'post', null, { username, password: 'password' })
    return {
      username: userDocument.username,
      id: userDocument.id.toString(),
      token: response.body.token
    }
  }))
})

describe('basic channel ops', () => {
  let channelId: string

  describe('create a channel', () => {
    test('POST /channels - 422 if input error (username)', async () => {
      await validationLoop(
        'title',
        [
          { value: '', msg: 'Please enter a title.' },
          { value: 'a', msg: 'Channel title must be between 2 and 32 characters long.' }
        ],
        { title: 'My First Camp' },
        '/channels', 'post', users[0].token
      )
    })

    test('POST /channels - 200 and creates a channel with creator as admin', async () => {
      const response = await reqShort('/channels', 'post', users[0].token, {
        title: 'My First Camp'
      })
      expect(response.status).toBe(200)
      let existingChannel = await Channel.findOne({ title: 'My First Camp' })
      existingChannel = assertDefined(existingChannel)
      expect(existingChannel.admin.toString()).toEqual(users[0].id)
      expect(existingChannel.users[0].toString()).toEqual(users[0].id)
      channelId = existingChannel.id
    })
  })

  describe('view channel details', () => {
    test('GET /channel/:channel - 401 if not logged in', async () => {
      const response = await reqShort(`/channel/${channelId}`, 'get', null)
      expect(response.status).toBe(401)
    })

    test('GET /channel/:channel - 404 if channel does not exist', async () => {
      const response = await reqShort('/channel/blah', 'get', users[0].token)
      expect(response.status).toBe(404)
      expect(response.text).toBe('Channel not found.')
    })

    test('GET /channel/:channel - 403 if logged-in user is not in this channel', async () => {
      const response = await reqShort(`/channel/${channelId}`, 'get', users[1].token)
      expect(response.status).toBe(403)
      expect(response.text).toBe('You are not a member of this channel.')
    })

    test('GET /channel/:channel - 200 and returns channel details', async () => {
      const response = await reqShort(`/channel/${channelId}`, 'get', users[0].token)
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
        `/channel/${channelId}/invite`, 'post', users[0].token
      )
    })

    test('POST /channel/:channel/invite - 200 and invites user to channel', async () => {
      let response = await reqShort(
        `/channel/${channelId}/invite`, 'post', users[0].token,
        { username: users[1].username }
      )
      expect(response.status).toBe(200)
      response = await reqShort(
        `/channel/${channelId}`, 'get', users[1].token
      )
      expect(response.body.users.length).toBe(2)
    })
  })

  describe('leave the channel', () => {
    test('DELETE /channel/:channel - 403 if admin', async () => {
      const response = await reqShort(`/channel/${channelId}`, 'delete', users[0].token)
      expect(response.status).toBe(403)
      expect(response.text).toEqual('You cannot leave a channel if you are its admin and there are other users in the channel. Please promote one of the other users of this channel to admin before leaving.')
    })

    test('DELETE /channel/:channel - 200 and removes logged-in user from channel', async () => {
      let response = await reqShort(`/channel/${channelId}`, 'delete', users[1].token)
      expect(response.status).toBe(200)
      response = await reqShort(`/channel/${channelId}`, 'get', users[1].token)
      expect(response.status).toBe(403)
      response = await reqShort(`/channel/${channelId}`, 'get', users[0].token)
      expect(response.status).toBe(200)
    })

    test('DELETE /channel/:channel - 200 and deletes channel if nobody is left', async () => {
      const response = await reqShort(`/channel/${channelId}`, 'delete', users[0].token)
      expect(response.status).toBe(200)
      const existingChannel = await Channel.findById(channelId)
      expect(existingChannel).toBe(null)
    })
  })
})

describe('channel admin ops', () => {
  let channelId: string

  beforeAll(async () => {
    const channel = await Channel.create({
      title: 'My First Camp',
      admin: users[0].id,
      users: users.map(user => user.id)
    })
    channelId = channel.id
  })

  describe('edit channel details', () => {
    test('PUT /channel/:id - 403 if logged-in user is not admin', async () => {
      const response = await reqShort(`/channel/${channelId}`, 'put', users[1].token)
      expect(response.status).toBe(403)
      expect(response.text).toEqual('You are not the admin of this channel.')
    })

    test('PUT /channel/:channel - 422 if input error (channel title)', async () => {
      await validationLoop(
        'title',
        [
          { value: '', msg: 'Please enter a channel title.' },
          { value: Array(100).fill('A').join(''), msg: 'Channel titles cannot be more than 64 characters long.' }
        ],
        { title: 'Our Cool Camp' },
        `/channel/${channelId}`, 'put', users[0].token
      )
    })

    test('PUT /channel/:channel - 200 and edits channel details', async () => {
      let response = await reqShort(`/channel/${channelId}`, 'put', users[0].token, {
        title: 'Our Cool Camp'
      })
      expect(response.status).toBe(200)
      response = await reqShort(`/channel/${channelId}`, 'get', users[1].token)
      expect(response.body.title).toEqual('Our Cool Camp')
    })
  })
})
