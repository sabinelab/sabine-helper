import {
  Message,
  type MessageReplyOptions,
  type AttachmentBuilder,
  type AttachmentPayload,
  Guild
} from 'discord.js'
import App from '../client/App'
import { SabineGuild, SabineUser } from '@/database'

type Database = {
  user: SabineUser,
  guild: SabineGuild
}

type CommandContextOptions = {
  client: App
  guild: Guild
  message: Message<true>
  db: Database
  args: string[]
}

export default class CommandContext {
  public client: App
  public guild: Guild
  public message: Message<true>
  public db: Database
  public args: string[]

  public constructor(options: CommandContextOptions) {
    this.client = options.client
    this.guild = options.guild
    this.message = options.message
    this.db = options.db
    this.args = options.args
  }

  public async send(content: string | MessageReplyOptions, files?: (AttachmentBuilder | AttachmentPayload)[]) {
    if(typeof content === 'string') {
      content = { content }
    }

    if(files) {
      content = {
        ...content,
        files
      }
    }

    return await this.message.reply(content)
  }
}