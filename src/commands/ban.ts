import { TextChannel } from 'oceanic.js'
import createCommand from '../structures/command/createCommand.ts'

export default createCommand({
  name: 'ban',
  aliases: ['b'],
  onlyMod: true,
  async run({ ctx, getUser, client }) {
    await ctx.message.delete()

    const user = await getUser(ctx.args[0])

    if(!user) {
      return await ctx.send('Please provide a valid user.')
    }

    let reason = ctx.args.slice(1).join(' ')

    if(!reason) {
      return await ctx.send('Please provide a reason.')
    }

    switch(reason) {
      case 'div': reason = 'Unauthorized promotion in text or voice channels.'
        break
      case 'divdm': reason = 'Unauthorized promotion via direct message.'
        break
      case 'toxic': reason = 'Disrespectful behavior in text or voice channels.'
        break
      case 'owo': reason = '1, 2, 3 testing... OwO'
        break
      case 'nsfw': reason = 'Sharing NSFW content in text or voice channels.'
    }

    await user.createDM().then(dm => dm.createMessage({
      content: `You have been banned from \`${ctx.guild.name}\` for \`${reason}\``
    }))
      .catch(() => { })

    await ctx.guild.createBan(user.id, {
      reason
    })

    await ctx.send(`\`${user.tag}\` (\`${user.id}\`) have been banned for \`${reason}\``)

    const channel = client.getChannel(process.env.MOD_LOG) as TextChannel
    
    channel.createMessage({
      content: `\`${user.tag}\` (\`${user.id}\`) have been banned for \`${reason}\``
    })
      .then(msg => {
        msg.startThread({
          name: `Ban ${user.tag} (${user.id})`
        })
          .then(t => t.createMessage({
            content: `${ctx.message.author.mention}, send the evidence of the punishment here.`
          }))
      })
  }
})