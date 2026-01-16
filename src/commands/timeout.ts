import translate from '@iamtraction/google-translate'
import type { TextChannel } from 'discord.js'
import ms from 'enhanced-ms'
import createCommand from '../structures/command/createCommand'

export default createCommand({
  name: 'timeout',
  aliases: ['t'],
  onlyMod: true,
  async run({ ctx, getMember, client }) {
    await ctx.message.delete()

    const member = getMember(ctx.args[0])

    const time = ctx.args[1]
    let reason = ctx.args.slice(2).join(' ')

    if (!member) {
      return await ctx.send('Provide a valid member')
    }

    if (!time || !ms(time)) {
      return await ctx.send('Provide the time (`30m`, `1h`, `1d`)')
    }
    if (!reason) {
      return await ctx.send('Please provide a reason.')
    }

    switch (reason) {
      case 'div':
        reason = 'Unauthorized promotion in text or voice channels.'
        break
      case 'divdm':
        reason = 'Unauthorized promotion via direct message.'
        break
      case 'toxic':
        reason = 'Disrespectful behavior in text or voice channels.'
        break
      case 'owo':
        reason = '1, 2, 3 testing... OwO'
        break
      case 'nsfw':
        reason = 'Sharing NSFW content in text or voice channels.'
    }

    await member.user
      .createDM()
      .then(dm =>
        dm.send({
          content: `You have been muted **${ms(ms(time))}** in \`${ctx.guild.name}\` for \`${reason}\``
        })
      )
      .catch(() => {})

    await member.edit({
      communicationDisabledUntil: new Date(Date.now() + ms(time)).toISOString()
    })

    const t = (
      await translate(ms(ms(time))!, {
        to: 'pt'
      })
    ).text

    await ctx.send(
      `\`${member.user.username}\` (\`${member.id}\`) has been timed out for **${t}** for \`${reason}\``
    )

    const channel = client.channels.cache.get(process.env.MOD_LOG) as TextChannel

    await channel
      .send({
        content: `\`${member.user.username}\` (\`${member.id}\`) has been muted for **${t}** for \`${reason}\``
      })
      .then(msg => {
        msg
          .startThread({
            name: `Timeout ${member.user.username} (${member.id})`
          })
          .then(t =>
            t.send({
              content: `${ctx.message.author.toString()}, send the evidence of the punishment here.`
            })
          )
      })
  }
})
