import { Client, type ClientOptions } from 'oceanic.js'
import { readdirSync } from 'node:fs'
import path from 'path'
import type { Command } from '../command/createCommand.ts'
import Logger from '../util/Logger.ts'
import { PrismaClient } from '@prisma/client'
import { fileURLToPath } from 'node:url'

const prisma = new PrismaClient()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default class App extends Client {
  public commands: Map<string, Command> = new Map()
  public aliases: Map<string, string> = new Map()
  public prisma: typeof prisma

  public constructor(options?: ClientOptions) {
    super(options)

    this.prisma = prisma
  }

  public override async connect() {
    for(const file of readdirSync(path.join(__dirname, '../../listeners'))) {
      const listener = (await import(`../../listeners/${file}`)).default.default ?? (await import(`../../listeners/${file}`)).default

      if(listener.name === 'ready') this.once('ready', () => listener.run(this).catch((e: Error) => new Logger(this).error(e)))
      else this.on(listener.name, (...args) => listener.run(this, ...args).catch((e: Error) => new Logger(this).error(e)))
    }

    for(const file of readdirSync(path.join(__dirname, '../../commands'))) {
      const command = (await import(`../../commands/${file}`)).default.default ?? (await import(`../../commands/${file}`)).default

      this.commands.set(command.name, command)

      if(command.aliases) {
        command.aliases.forEach((alias: string) => {
          this.aliases.set(alias, command.name)
        })
      }
    }

    await super.connect()
  }
}