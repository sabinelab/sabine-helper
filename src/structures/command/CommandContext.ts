import type {
  AttachmentBuilder,
  AttachmentPayload,
  Guild,
  Message,
  MessageReplyOptions
} from 'discord.js'
import type { GuildSchema, UserSchema } from '@/database'
import type App from '../client/App'

type Database = {
  user: UserSchema
  guild: GuildSchema
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

  public async send(
    content: string | MessageReplyOptions,
    files?: (AttachmentBuilder | AttachmentPayload)[]
  ) {
    if (typeof content === 'string') {
      content = { content }
    }

    if (files) {
      content = {
        ...content,
        files
      }
    }

    return await this.message.channel.send(content)
  }
}
