import createCommand from '../structures/command/createCommand.ts'

export default createCommand({
  name: 'ping',
  async run({ ctx }) {
    await ctx.send(`Pong! \`${ctx.guild.shard.latency}ms\``)
  }
})