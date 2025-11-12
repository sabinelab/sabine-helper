import ms from 'enhanced-ms'
import createCommand from '../structures/command/createCommand.ts'

export default createCommand({
  name: 'blacklist',
  aliases: ['bl'],
  onlyDev: true,
  async run({ ctx, getUser, client }) {
    let reason = ctx.args.slice(3).join(' ')
    let time = ms(ctx.args[3] ?? 'asd')

    if(time) reason = ctx.args.slice(4).join(' ')

    if(ctx.args[0] === 'add') {
      const args = {
        user: async() => {
          if(!ctx.args[2]) return await ctx.send('Missing argument `[id]`')

          const blacklist = await client.prisma.blacklist.findUnique({
            where: {
              id: ctx.args[2],
              type: 'USER'
            }
          })

          if(blacklist) return await ctx.send('This user is already banned.')

          if(!reason) return await ctx.send('Missing argument `[reason]`.')

          await client.prisma.user.delete({
            where: {
              id: ctx.args[2]
            }
          })

          const u = await getUser(ctx.args[2])

          await client.prisma.blacklist.create({
            data: {
              id: ctx.args[2],
              reason,
              ends_at: time ? new Date(Date.now() + time) : null,
              type: 'USER'
            }
          })

          await ctx.send(`\`${u?.tag}\` (\`${u?.id}\`) has been banned from the bot ${time ? 'for ' + ms(time) : 'forever'} for \`${reason}\``)
        },
        guild: async() => {
          if(!ctx.args[2]) return await ctx.send('Missing argument `[id]`')

          const blacklist = await client.prisma.blacklist.findUnique({
            where: {
              id: ctx.args[2],
              type: 'GUILD'
            }
          })

          if(blacklist) return await ctx.send('This guild is already banned.')

          if(!reason) return await ctx.send('Missing argument `[reason]`.')

          await client.prisma.guild.delete({
            where: {
              id: ctx.args[2]
            }
          })

          const g = client.guilds.get(ctx.args[2])

          await client.prisma.blacklist.create({
            data: {
              id: ctx.args[2],
              reason,
              ends_at: time ? new Date(Date.now() + time) : null,
              type: 'GUILD',
              name: g?.name
            }
          })

          await ctx.send(`\`${g?.name}\` (\`${ctx.args[2]}\`) has been banned from the bot ${time ? 'for ' + ms(time) : 'forever'} for \`${reason}\``)
        }
      }
      if(!Object.keys(args).some(key => key === ctx.args[1])) {
        return await ctx.send('Missing argument `user` or `guild`.')
      }

      await args[ctx.args[1] as 'user' | 'guild']()
    }
    else if(ctx.args[0] === 'remove') {
      const args = {
        user: async() => {
          if(!ctx.args[2]) return await ctx.send('Missing argument `[id]`')

          const blacklist = await client.prisma.blacklist.findUnique({
            where: {
              id: ctx.args[2],
              type: 'USER'
            }
          })

          if(!blacklist) return await ctx.send('This user is not banned.')

          const u = await getUser(ctx.args[2])
          await client.prisma.blacklist.delete({
            where: {
              id: ctx.args[2],
              type: 'USER'
            }
          })

          await ctx.send(`\`${u?.tag}\` (\`${u?.id}\`) has been unbanned from the bot.`)
        },
        guild: async() => {
          if(!ctx.args[2]) return await ctx.send('Missing argument `[id]`')

          const blacklist = await client.prisma.blacklist.findUnique({
            where: {
              id: ctx.args[2],
              type: 'USER'
            }
          })

          if(!blacklist) return await ctx.send('This guild is not banned.')
          
          await client.prisma.blacklist.delete({
            where: {
              id: ctx.args[2],
              type: 'GUILD'
            }
          })
          await ctx.send(`\`${ctx.args[2]}\` has been unbanned from the bot.`)
        }
      }

      if(!Object.keys(args).some(key => key === ctx.args[1])) {
        return await ctx.send('Missing argument `user` or `guild`.')
      }

      await args[ctx.args[1] as 'user' | 'guild']()
    }
    else await ctx.send(`Missing arguments! Try \`${process.env.PREFIX}blacklist add/remove user/guild [id] [reason]\``)
  }
})