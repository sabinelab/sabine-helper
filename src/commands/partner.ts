import { SabineGuild } from '../database/index.ts'
import createCommand from '../structures/command/createCommand.ts'

export default createCommand({
  name: 'partner',
  onlyDev: true,
  async run({ ctx }) {
    const args = {
      add: async() => {
        const guild = await SabineGuild.fetch(ctx.args[1])

        if(!guild) {
          return await ctx.send('This guild does not exists in database')
        }

        guild.partner = true
        guild.invite = ctx.args[2]

        await guild.save()
        await ctx.send('Guild added!')
      },
      remove: async() => {
        const guild = await SabineGuild.fetch(ctx.args[1])

        if(!guild) {
          return await ctx.send('This guild does not exists in database')
        }

        guild.partner = null
        guild.invite = null

        await guild.save()
        await ctx.send('Guild removed!')
      }
    }
    if(
      !['add', 'remove'].includes(ctx.args[0])
      ||
      !args[ctx.args[0] as 'add' | 'remove']
      ||
      !ctx.args[1]
      ||
      !ctx.args[2]
    ) {
      return await ctx.send(`Invalid argument! Use \`${process.env.PREFIX}partner add/remove [guild_id] [guild_invite]\``)
    }
    await args[ctx.args[0] as 'add' | 'remove']()
  }
})