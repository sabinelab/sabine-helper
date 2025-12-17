import { TextChannel } from 'discord.js'
import createCommand from '../structures/command/createCommand'
import ButtonBuilder from '../structures/builders/ButtonBuilder'

export default createCommand({
  name: 'ticket',
  onlyDev: true,
  async run({ ctx, client }) {
    await ctx.message.delete()

    const channel = client.channels.cache.get('1277285687074357313') as TextChannel

    const messages = await channel.messages.fetch()
    const message = messages.find(m => m.author.id === client.user?.id)

    if(!message) {
      const button = new ButtonBuilder()
        .defineStyle('blue')
        .setLabel('Create a Ticket')
        .setEmoji('🤝')
        .setCustomId('ticket')

      await channel.send({
        content: '## Customer Support Center\nIn this area, you can ask questions and solve issues with the bot by contacting the Sabine team.',
        components: [
          {
            type: 1,
            components: [button.toJSON()]
          }
        ]
      })
    }

    else {
      const button = new ButtonBuilder()
        .defineStyle('blue')
        .setLabel('Create a Ticket')
        .setEmoji('🤝')
        .setCustomId('ticket')

      await message.edit({
        content: '## Customer Support Center\nIn this area, you can ask questions and solve issues with the bot by contacting the Sabine team.',
        components: [
          {
            type: 1,
            components: [button.toJSON()]
          }
        ]
      })
    }
  }
})