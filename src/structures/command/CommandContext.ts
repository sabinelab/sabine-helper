import { type File, Guild, type InteractionContent, Message, TextChannel } from 'oceanic.js'
import App from '../client/App.ts'
import { SabineGuild, SabineUser } from '../../database/index.ts'

type Database = {
  user: SabineUser,
  guild: SabineGuild
}

type CommandContextOptions = {
  client: App
  guild: Guild
  message: Message<TextChannel>
  db: Database
  args: string[]
}

export default class CommandContext {
  public client: App
  public guild: Guild
  public message: Message<TextChannel>
  public db: Database
  public args: string[]

  public constructor(options: CommandContextOptions) {
    this.client = options.client
    this.guild = options.guild
    this.message = options.message
    this.db = options.db
    this.args = options.args
  }

  public async send(content: string | InteractionContent, files?: File[]) {
    if(typeof content === 'string') {
      content = { content }
    }

    if(files) {
      content = {
        ...content,
        files
      }
    }

    return await this.message.channel.createMessage(content)
  }
}