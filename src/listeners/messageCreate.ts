import { Constants, Message, TextChannel } from 'oceanic.js'
import createListener from '../structures/client/createListener.ts'
import { SabineGuild, SabineUser } from '../database/index.ts'
import CommandContext from '../structures/command/CommandContext.ts'
import Logger from '../structures/util/Logger.ts'

export default createListener({
  name: 'messageCreate',
  async run(client, message) {
    if(message.author.bot) return
    if(message.channel?.type !== Constants.ChannelTypes.GUILD_TEXT) return
    if(!message.guild) return
    if(!message.member) return
    if(!message.content.toLowerCase().startsWith(process.env.PREFIX)) return

    let messageArray = message.content.split(' ')
    let command = messageArray.shift()!.toLowerCase()
    let args = messageArray.slice(0)
    let cmd = client.commands.get(command.slice(process.env.PREFIX.length)) || client.commands.get(client.aliases.get(command.slice(process.env.PREFIX.length))!)

    if(!cmd) return
    if(cmd.onlyDev && message.author.id !== '441932495693414410') return
    if(cmd.onlyMod && !['1237458600046104617', '1237458505196114052', '1237457762502574130'].some(r => message.member?.roles.includes(r))) return
    if(cmd.onlyBooster && !message.member.premiumSince) return
    if(cmd.onlyBoosterAndPremium && !['1265770785893515285', '1314272663316856863', '1314272739917303888', '1314272766891003945'].some(r => message.member?.roles.includes(r))) return

    const user = await SabineUser.fetch(message.author.id) ?? new SabineUser(message.author.id)
    const guild = await SabineGuild.fetch(message.guild.id) ?? new SabineGuild(message.guild.id)

    const ctx = new CommandContext({
      db: {
        user,
        guild
      },
      guild: message.guild,
      message: message as Message<TextChannel>,
      client,
      args
    })

    const getUser = async (user: string) => {
      try {
        return await client.rest.users.get(user.replace(/[<@!>]/g, ''))
      }
      catch(e) {
        new Logger(client).error(e as Error)
      }
    }

    const getMember = (member: string) => {
      return ctx.guild.members.get(member.replace(/[<@!>]/g, ''))
    }

    cmd.run({ ctx, getMember, getUser, client })
      .catch(e => {
        new Logger(client).error(e)
        ctx.send(`An unexpected error has occurred...\n\`${e}\``)
      })
  }
})