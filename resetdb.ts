import mongoose from 'mongoose'
import jsonwebtoken from 'jsonwebtoken'
import User, { type IUserDocument } from './models/user'
import Channel from './models/channel'
import Message from './models/message'
import 'dotenv/config'

const uri: string | undefined = process.env.CONNECTION
const secret: string | undefined = process.env.SECRET

async function main (): Promise<void> {
  if (uri !== undefined) {
    console.log(`Connecting with URL "${uri}"`)
    const conn = await mongoose.connect(uri)
    console.log(`Connected to database "${conn.connection.name}"`)

    await User.deleteMany({})
    await Channel.deleteMany({})
    await Message.deleteMany({})
    console.log('Deleted all content.\n')

    const users: IUserDocument[] = []

    for (let i = 0; i < 4; i++) {
      const user = await User.create({
        username: `demo-user-${i}`,
        password: 'password'
      })
      users.push(user)
      const token = jsonwebtoken.sign({
        username: user.username, id: user.id
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      }, secret!)
      let channelId: string = 'none'
      if (i !== 0) {
        const channel = await Channel.create({
          title: 'My Own Channel',
          admin: user,
          users: [user]
        })
        channelId = channel.id
      }
      console.log(`Demo user ${user.username} created, with token:\n${token}\nand private channel id:\n${channelId}\n`)
    }

    if (users !== undefined) {
      const channel = await Channel.create({
        title: 'Our Cool Channel',
        admin: users[1],
        users: [users[1], users[2], users[3]]
      })
      console.log(`Group channel created with id:\n${channel.id}\n`)
    }

    console.log('Nothing left to do, closing connection.')
    void mongoose.connection.close()
  }
}

main().catch((e) => console.error.bind(console, e))
