import { TextChannel } from 'oceanic.js'
import createCommand from '../structures/command/createCommand.ts'
import ButtonBuilder from '../structures/builders/ButtonBuilder.ts'

export default createCommand({
  name: 'ticket',
  onlyDev: true,
  async run({ ctx, client }) {
    await ctx.message.delete()

    const channel = client.getChannel('1277285687074357313') as TextChannel

    const messages = await channel.getMessages()
    const message = messages.filter(m => m.author.id === client.user.id)[0]

    if(!message) {
      const button = new ButtonBuilder()
        .setStyle('blue')
        .setLabel('Create a Ticket')
        .setEmoji('🤝')
        .setCustomId('ticket')

      await channel.createMessage(button.build('## Customer Support Center\nIn this area, you can ask questions and solve issues with the bot by contacting the Sabine team.'))
    }

    else {
      const button = new ButtonBuilder()
        .setStyle('blue')
        .setLabel('Create a Ticket')
        .setEmoji('🤝')
        .setCustomId('ticket')
        
      await message.edit(button.build('## Customer Support Center\nIn this area, you can ask questions and solve issues with the bot by contacting the Sabine team.'))
    }
  }
})