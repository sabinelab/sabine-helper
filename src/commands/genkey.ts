import createCommand from '../structures/command/createCommand'

export default createCommand({
  name: 'genkey',
  aliases: ['gerarchave'],
  onlyBooster: true,
  async run({ ctx, client }) {
    const key = await client.prisma.key.create({
      data: {
        type: 'PREMIUM',
        user: ctx.message.author.id,
        active_in: [],
        active: false
      }
    })

    ctx.message.author.createDM().then(dm => dm.send({
      content: `Your Key Booster is \`${key.id}\`.\nDo not share with ANYONE.`
    }))
      .catch(() => ctx.send('Open your DM for this server.'))
      .then(() => {
        ctx.message.react('1300882212190945292')
      })
  }
})