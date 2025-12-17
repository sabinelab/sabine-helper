import { TextChannel } from 'discord.js'
import createCommand from '../structures/command/createCommand'

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

    await ctx.guild.bans.remove(user.id)

    await ctx.send(`\`${user.tag}\` (\`${user.id}\`) has been unbanned for ${ctx.message.author.toString()}`)

    const channel = client.channels.cache.get(process.env.MOD_LOG) as TextChannel

    await channel.send({
      content: `\`${user.tag}\` (\`${user.id}\`) has been unbanned for ${ctx.message.author.toString()}`
    })
  }
})