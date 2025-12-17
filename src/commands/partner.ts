import { prisma, redis, SabineGuild } from '@db'
import createCommand from '../structures/command/createCommand'

export default createCommand({
  name: 'partner',
  onlyDev: true,
  async run({ ctx }) {
    const args = {
      add: async () => {
        const guild = await SabineGuild.fetch(ctx.args[1])

        if(!guild) {
          return await ctx.send('This guild does not exists in database')
        }

        await prisma.guild.update({
          where: {
            id: guild.id
          },
          data: {
            partner: true,
            invite: ctx.args[2]
          }
        })
        await redis.del(`guild:${guild.id}`)
        await ctx.send('Guild added!')
      },
      remove: async () => {
        const guild = await SabineGuild.fetch(ctx.args[1])

        if(!guild) {
          return await ctx.send('This guild does not exists in database')
        }

        await prisma.guild.update({
          where: {
            id: guild.id
          },
          data: {
            partner: null,
            invite: null
          }
        })
        await redis.del(`guild:${guild.id}`)
        await ctx.send('Guild removed!')
      }
    }
    if(
      !['add', 'remove'].includes(ctx.args[0]) ||
      !args[ctx.args[0] as 'add' | 'remove'] ||
      !ctx.args[1] ||
      !ctx.args[2]
    ) {
      return await ctx.send(`Invalid argument! Use \`${process.env.PREFIX}partner add/remove [guild_id] [guild_invite]\``)
    }
    await args[ctx.args[0] as 'add' | 'remove']()
  }
})