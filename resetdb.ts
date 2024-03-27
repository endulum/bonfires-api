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
    let groupChannelId: string = ''
    let markdownDemoId: string = ''

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
          title: i === 1 ? 'Markdown Demo' : 'My Own Channel',
          admin: user,
          users: [user]
        })
        channelId = channel.id
        if (i === 1) markdownDemoId = channel.id
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
      groupChannelId = channel.id
    }

    let index = 0
    for (const message of [
      'Hey, you know what sucks?',
      'vacuums',
      'Hey, you know what sucks in a metaphorical sense?',
      'black holes',
      'Hey, you know what just isn\'t cool?',
      'lava?'
    ]) {
      await Message.create({
        channel: groupChannelId,
        user: index % 2 === 0 ? users[1].id : users[2].id,
        content: message
      })
      index++
    }

    await Message.create({
      channel: groupChannelId,
      user: users[0].id,
      content: 'I was in this channel, but not anymore.'
    })

    await Message.create({
      channel: groupChannelId,
      user: users[1].id,
      content: 'This is a long paragraph. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean sed luctus sapien. Donec lobortis nisl quam, id bibendum magna consequat ac. Vivamus pharetra elit eget molestie maximus. Vestibulum rutrum venenatis arcu, a venenatis purus ullamcorper id. Etiam eu est eget tellus maximus vestibulum. Mauris at placerat enim. Mauris nec gravida nulla, eget fringilla risus. Nunc tempus, arcu et pellentesque consequat, quam magna egestas arcu, in egestas nisl leo nec elit.'
    })

    index = 0
    for (const message of [
      '**Bold**, *Italic*, ~~Strikethrough~~, [Hyperlink](https://commonmark.org/)',
      '- Bullet one\n- Bullet two\n- Bullet three',
      '![Image](https://commonmark.org/help/images/favicon.png)'
    ]) {
      await Message.create({
        channel: markdownDemoId,
        user: users[1].id,
        content: message
      })
      index++
    }

    console.log('Nothing left to do, closing connection.')
    void mongoose.connection.close()
  }
}

main().catch((e) => console.error.bind(console, e))
