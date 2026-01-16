import { UserSchema } from '../database'
import createCommand from '../structures/command/createCommand'

export default createCommand({
  name: 'addpremium',
  onlyDev: true,
  async run({ ctx, getUser }) {
    const duser = await getUser(ctx.args[0])

    if (!duser) {
      return await ctx.send('Invalid user.')
    }

    const user = (await UserSchema.fetch(duser.id)) ?? new UserSchema(duser.id)

    await user.addPremium('ADD_PREMIUM_BY_COMMAND')
    await ctx.send(`Premium activated for ${duser.toString()}`)
  }
})
