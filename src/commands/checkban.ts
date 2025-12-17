import createCommand from '../structures/command/createCommand'

export default createCommand({
  name: 'checkban',
  onlyMod: true,
  async run({ ctx, getUser, client }) {
    const args = {
      user: async () => {
        const u = await getUser(ctx.args[1])

        if(!u) return await ctx.send('Enter a valid user ID.')

        const ban = await client.prisma.blacklist.findUnique({
          where: {
            id: u.id
          }
        })

        if(!ban) return await ctx.send(`\`${u.tag}\` is not banned from the bot.`)

        let timestamp: string | undefined

        if(ban.ends_at) {
          timestamp = (ban.ends_at.getTime() / 1000).toFixed(0)
        }

        const when = (ban.when.getTime() / 1000).toFixed(0)

        await ctx.send(`\`${u.tag}\` is banned from the bot.\n**Reason:** \`${ban.reason}\`\n**Date:** <t:${when}:f> | <t:${when}:R>\n**Ends at:** ${!timestamp ? 'Never' : `<t:${timestamp}:F> | <t:${timestamp}:R>`}`)
      },
      guild: async () => {
        if(!ctx.args[1]) return await ctx.send('Enter a valid guild ID.')

        const ban = await client.prisma.blacklist.findUnique({
          where: {
            id: ctx.args[1]
          }
        })

        if(!ban) return await ctx.send(`\`${ctx.args[1]}\` is not banned from the bot.`)

        let timestamp: string | undefined

        if(ban.ends_at) {
          timestamp = (ban.ends_at.getTime() / 1000).toFixed(0)
        }

        const when = (ban.when.getTime() / 1000).toFixed(0)

        await ctx.send(`\`${ban.name}\` is banned from the bot.\n**Reason:** \`${ban.reason}\`\n**Date:** <t:${when}:f> | <t:${when}:R>\n**Ends at:** ${!timestamp ? 'Never' : `<t:${timestamp}:F> | <t:${timestamp}:R>`}`)
      }
    }
    if(!ctx.args[0] || !Object.keys(args).some(key => key === ctx.args[0])) {
      return await ctx.send(`Missing arguments! Try \`${process.env.PREFIX}checkban user [id]\` or \`${process.env.PREFIX}checkban guild [id]\``)
    }

    await args[ctx.args[0] as 'user' | 'guild']()
  }
})