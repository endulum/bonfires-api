import mongoose from 'mongoose'
import User from './models/user'
import Channel from './models/channel'
import Message from './models/message'
import 'dotenv/config'

const uri: string | undefined = process.env.CONNECTION
const pass: string | undefined = process.env.MENTORPASS

async function main (): Promise<void> {
  if (uri !== undefined) {
    console.log(`Connecting with URL "${uri}"`)
    const conn = await mongoose.connect(uri)
    console.log(`Connected to database "${conn.connection.name}"`)

    await User.deleteMany({})
    await Channel.deleteMany({})
    await Message.deleteMany({})
    console.log('Deleted all content.\n')

    const mentor = await User.create({
      username: 'bonfire-tips',
      password: pass ?? 'password'
    })

    console.log('Created first account.')

    const otherGuy = await User.create({
      username: 'demo-user',
      password: pass ?? 'password'
    })

    console.log('Created second account.')

    const demoChannel = await Channel.create({
      title: 'Demo Camp',
      admin: mentor,
      users: [mentor, otherGuy]
    })

    console.log('Created demo channel.')

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
        channel: demoChannel,
        user: index % 2 === 0 ? mentor : otherGuy,
        content: message
      })
      index++
    }

    console.log('Created demo channel conversation.')

    console.log('Nothing left to do, closing connection.')
    void mongoose.connection.close()
  }
}

main().catch((e) => console.error.bind(console, e))
