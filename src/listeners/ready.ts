import { TextChannel } from 'oceanic.js'
import createListener from '../structures/client/createListener.ts'
import Logger from '../structures/util/Logger.ts'

export default createListener({
  name: 'ready',
  async run(client) {
    Logger.send(`${client.user.tag} online!`)

    const removeUserFromBlacklist = async() => {
      const blacklist = await client.prisma.blacklist.findMany({
        where: {
          ends_at: {
            not: null
          },
          type: 'USER'
        }
      })

      if(!blacklist.length) return

      for(const user of blacklist) {
        if(!user.ends_at) continue

        if(user.ends_at < new Date()) {
          await client.prisma.blacklist.delete({
            where: {
              id: user.id,
              type: 'USER'
            }
          })

          const channel = client.getChannel('1237496064580386917') as TextChannel

          await channel.createMessage({ content: `[Auto] - \`${(await client.rest.users.get(user.id)).tag}\` (\`${user.id}\`) has been unbanned from the bot.` })
        }
      }
    }
    const removeGuildFromBlacklist = async() => {
      const blacklist = await client.prisma.blacklist.findMany({
        where: {
          ends_at: {
            not: null
          },
          type: 'GUILD'
        }
      })

      if(!blacklist.length) return

      for(const guild of blacklist) {
        if(!guild.ends_at) continue

        if(guild.ends_at < new Date()) {
          await client.prisma.blacklist.delete({
            where: {
              id: guild.id,
              type: 'GUILD'
            }
          })

          const channel = client.getChannel('1237496064580386917') as TextChannel

          await channel.createMessage({ content: `[Auto] - \`${guild.id}\` has been unbanned from the bot.` })
        }
      }
    }

    const removePremium = async() => {
      const users = await client.prisma.user.findMany({
        include: {
          premium: true
        }
      })

      if(!users.length) return

      for(const user of users) {
        if(!user.premium) continue
        if(user.premium.expires_at > new Date()) continue

        const member = client.guilds.get('1233965003850125433')!.members.get(user.id)

        if(member) {
          await member.removeRole('1314272663316856863')
          member.user.createDM().then(dm => dm.createMessage({
            content: `Your premium has expired! If you want to renew your premium, go to https://canary.discord.com/channels/1233965003850125433/1313902950426345492 and select a premium!`
          }))
          .catch()
        }

        await client.prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            premium: {
              delete: {
                userId: user.id
              }
            },
            warned: false
          }
        })
      }
    }
    const sendPremiumWarn = async() => {
      const users = await client.prisma.user.findMany({
        include: {
          premium: true
        }
      })

      for(const user of users) {
        if(user.warned) continue
        if(!user.premium) continue
        
        const member = client.guilds.get('1233965003850125433')!.members.get(user.id)

        if((user.premium.expires_at.getTime() - Date.now()) <= 2.592e+8) {
          if(member) {
            member.user.createDM().then(dm => dm.createMessage({
              content: `Your premium will expires <t:${(user.premium!.expires_at.getTime() / 1000).toFixed(0)}:R>! If you want to renew your premium, go to https://canary.discord.com/channels/1233965003850125433/1313902950426345492 and select a premium!`
            }))
            .catch(() => {})
          }
        }

        await client.prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            warned: true
          }
        })
      }
    }
    const deleteInactiveThreads = async() => {
      const guild = client.guilds.get('1233965003850125433')!
      const channels = guild.channels.filter(c => ['1313902950426345492', '1313588710637568030'].includes(c.id)) as TextChannel[]

      for(const channel of channels) {
        const threads = channel.threads.filter(t => Date.now() - new Date(t.createdAt).getTime() >= 1000 * 60 * 45)

        for(const thread of threads) await thread.delete()
      }
    }

    const deleteKeys = async() => {
      const keysToDelete = await client.prisma.key.findMany({
        where: {
          expires_at: {
            lte: new Date()
          },
          type: 'PREMIUM'
        },
        select: {
          id: true
        }
      })

      if(!keysToDelete.length) return
      
      await client.prisma.$transaction([
        client.prisma.guildKey.deleteMany({
          where: {
            keyId: {
              in: keysToDelete.map(key => key.id)
            }
          }
        }),
        client.prisma.key.deleteMany({
          where: {
            id: {
              in: keysToDelete.map(key => key.id)
            }
          }
        })
      ])
    }

    const verifyKeyBooster = async() => {
      const keys = await client.prisma.key.findMany({
        where: {
          type: 'BOOSTER'
        }
      })

      if(!keys.length) return
      
      const keysToDelete: string[] = []

      for(const key of keys) {
        const member = client.guilds.get('1233965003850125433')!.members.get(key.user)
        if(!member || (member && !member.premiumSince)) {
          keysToDelete.push(key.id)
        }
      }

      if(!keysToDelete.length) return

      await client.prisma.$transaction([
        client.prisma.guildKey.deleteMany({
          where: {
            keyId: {
              in: keysToDelete
            }
          }
        }),
        client.prisma.key.deleteMany({
          where: {
            id: {
              in: keysToDelete
            }
          }
        })
      ])
    }
    const verifyPartners = async() => {
      const channel = client.getChannel('1346170715165950086') as TextChannel
      const message = (await channel.getMessages({
        filter: (message) => message.author.id === client.user.id
      }))[0]

      if(!message) {
        const guilds = await client.prisma.guild.findMany({
          where: {
            partner: true,
            invite: {
              not: null
            }
          }
        })

        if(!guilds.length) return

        let content = '## Our official Partners\n'

        for(const guild of guilds) {
          content += `- ${guild.invite}\n`
        }

        await channel.createMessage({ content })
      }
      else {
        const guilds = await client.prisma.guild.findMany({
          where: {
            partner: true,
            invite: {
              not: null
            }
          }
        })

        let content = '## Our official Partners\n'

        for(const guild of guilds) {
          content += `- ${guild.invite}\n`
        }
        
        await message.edit({ content })
      }
    }
    const runTasks = async() => {
      await deleteKeys().catch(e => new Logger(client).error(e))
      await verifyKeyBooster().catch(e => new Logger(client).error(e))
      await deleteInactiveThreads().catch(e => new Logger(client).error(e))
      await sendPremiumWarn().catch(e => new Logger(client).error(e))
      await removePremium().catch(e => new Logger(client).error(e))
      await removeUserFromBlacklist().catch(e => new Logger(client).error(e))
      await removeGuildFromBlacklist().catch(e => new Logger(client).error(e))
      await verifyPartners().catch(e => new Logger(client).error(e))
      setTimeout(runTasks, process.env.INTERVAL ?? 60 * 1000)
    }
    await runTasks()
  }
})