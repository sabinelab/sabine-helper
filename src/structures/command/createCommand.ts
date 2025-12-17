import { GuildMember, User } from 'discord.js'
import App from '../client/App'
import CommandContext from './CommandContext'

type CommandOptions = {
  ctx: CommandContext
  client: App
  getMember: (member: string) => GuildMember | undefined
  getUser: (user: string) => Promise<User | undefined>
}

type CreateComponentInteractionOptions = {
  ctx: CommandContext
  client: App
}

export type Command = {
  name: string
  aliases?: string[]
  client?: App
  onlyDev?: boolean
  onlyMod?: boolean
  onlyBooster?: boolean
  onlyPremium?: boolean
  onlyBoosterAndPremium?: boolean
  run: (options: CommandOptions) => Promise<unknown>
  createInteraction?: (options: CreateComponentInteractionOptions) => Promise<unknown>
}

export default function(command: Command) {
  return command
}