import createCommand from '../structures/command/createCommand'

export default createCommand({
  name: 'ping',
  async run({ ctx }) {
    await ctx.send(`Pong! \`${ctx.client.ws.ping}ms\``)
  }
})