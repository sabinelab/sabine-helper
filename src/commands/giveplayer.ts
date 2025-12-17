import { getPlayer } from '@sabinelab/players'
import createCommand from '../structures/command/createCommand'
import { SabineUser } from '../database'

export default createCommand({
  name: 'giveplayer',
  onlyDev: true,
  async run({ ctx, getUser }) {
    if(!ctx.args[0]) {
      return await ctx.send('Provide a user.')
    }

    if(!ctx.args[1] || ctx.args[1] === '') {
      return await ctx.send('Provide a player.')
    }

    const _user = await getUser(ctx.args[0])

    const player = getPlayer(ctx.args[1])

    if(!_user) {
      return await ctx.send('Invalid user.')
    }

    const user = await SabineUser.fetch(_user.id) ?? new SabineUser(_user.id)

    if(!player) {
      return await ctx.send('Invalid player.')
    }

    await user.addPlayerToRoster(player.id.toString(), 'CLAIM_PLAYER_BY_COMMAND')

    await ctx.send(`${_user.toString()} received **${player.name} (${player.collection})** sucessfully!`)
  }
})