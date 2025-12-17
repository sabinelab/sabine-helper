import colors from 'colors'
import moment from 'moment'
import { TextChannel } from 'discord.js'
import App from '../client/App'
import EmbedBuilder from '../builders/EmbedBuilder'

export default class Logger {
  private client: App

  public constructor(client: App) {
    this.client = client
  }

  public static send(message: string) {
    return console.log(colors.green(`[${moment(Date.now()).format('hh:mm:ss A')}] ${message}`))
  }

  public static warn(message: string) {
    return console.log(colors.yellow(`[${moment(Date.now()).format('hh:mm:ss A')}] ${message}`))
  }

  public static error(error: Error) {
    return console.log(colors.red(`[${moment(Date.now()).format('hh:mm:ss A')}] ${error.stack ?? error}`))
  }

  public async error(error: Error | string, shardId?: number) {
    const ignoredErrors = [
      'Missing Permissions',
      'AbortError: This operation was aborted'
    ]

    if(ignoredErrors.some(e => error.toString().includes(e))) return

    if(typeof error === 'string') {
      console.log(colors.red(`[${moment(Date.now()).format('hh:mm:ss A')}] ${error}`))

      const embed = new EmbedBuilder()
        .setTitle('An error has occurred')
        .setDesc(`Shard ID: \`${shardId}\`\n\`\`\`js\n${error}\`\`\``)

      const channel = await this.client.channels.cache.get(process.env.ERROR_LOG) as TextChannel

      const webhooks = await channel.fetchWebhooks()
      let webhook = webhooks.find(w => w.name === `${this.client.user?.username} Logger`)

      if(!webhook) webhook = await channel.createWebhook({ name: `${this.client.user?.username} Logger` })

      await webhook.send({
        embeds: [embed],
        avatarURL: this.client.user?.displayAvatarURL({ size: 2048 })
      })
    }
    else {
      console.log(colors.red(`[${moment(Date.now()).format('hh:mm:ss A')}] ${error.stack ?? error}`))

      const embed = new EmbedBuilder()
        .setTitle('An error has occurred')
        .setDesc(`Shard ID: \`${shardId}\`\n\`\`\`js\n${error.stack}\`\`\``)

      const channel = this.client.channels.cache.get(process.env.ERROR_LOG) as TextChannel

      const webhooks = await channel.fetchWebhooks()
      let webhook = webhooks.find(w => w.name === `${this.client.user?.username} Logger`)

      if(!webhook) webhook = await channel.createWebhook({ name: `${this.client.user?.username} Logger` })

      await webhook.send({
        embeds: [embed],
        avatarURL: this.client.user?.displayAvatarURL({ size: 2048 })
      })
    }
  }
}