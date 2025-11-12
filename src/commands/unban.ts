import { TextChannel } from 'oceanic.js'
import createCommand from '../structures/command/createCommand.ts'

export default createCommand({
  name: 'unban',
  aliases: ['unb'],
  onlyMod: true,
  async run({ ctx, getUser, client }) {
    await ctx.message.delete()

    const user = await getUser(ctx.args[0])

    if(!user) {
      return await ctx.send('Please provide a valid user.')
    }

    await ctx.guild.removeBan(user.id)

    await ctx.send(`\`${user.tag}\` (\`${user.id}\`) has been unbanned for ${ctx.message.author.mention}`)

    const channel = client?.getChannel(process.env.MOD_LOG) as TextChannel
    
    await channel.createMessage({
      content: `\`${user.tag}\` (\`${user.id}\`) has been unbanned for ${ctx.message.author.mention}`
    })
  }
})