import {
  ButtonStyle,
  ChannelType,
  type GuildMember,
  OverwriteType,
  PermissionFlagsBits,
  type TextChannel
} from 'discord.js'
import transcript from 'discord-html-transcripts'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import Stripe from 'stripe'
import ButtonBuilder from '../structures/builders/ButtonBuilder'
import EmbedBuilder from '../structures/builders/EmbedBuilder'
import createListener from '../structures/client/createListener'

const mercadopago = new MercadoPagoConfig({ accessToken: process.env.MP_TOKEN })
const stripe = new Stripe(process.env.STRIPE_TOKEN)

export default createListener({
  name: 'interactionCreate',
  async run(client, interaction) {
    if (interaction.isMessageComponent()) {
      if (!interaction.guild || !interaction.guildId || !interaction.member || !interaction.channel)
        return

      const args = interaction.customId.split(';')

      if (interaction.customId === 'ticket') {
        await interaction.deferReply({
          flags: 'Ephemeral',
          withResponse: true
        })

        const channels = interaction.guild.channels.cache.filter(
          c => c.parentId === '1277285123070361673'
        )

        if (channels.some(ch => ch.name.includes(interaction.user.id))) {
          return await interaction.followUp({
            content: 'You already have an open ticket. Please wait until a moderator deletes it.'
          })
        }

        const channel = await interaction.guild.channels.create({
          name: `ticket_${interaction.user.id}`,
          type: ChannelType.GuildText,
          parent: interaction.guild.channels.cache.get(interaction.channelId)?.parentId,
          permissionOverwrites: [
            {
              id: interaction.guildId,
              deny: [PermissionFlagsBits.ViewChannel],
              type: OverwriteType.Role
            },
            {
              id: '1237457762502574130',
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles
              ],
              type: OverwriteType.Role
            },
            {
              id: interaction.member.user.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles
              ],
              type: OverwriteType.Member
            }
          ]
        })

        const msg = await channel.send({
          content: `${interaction.user.toString()} Ticket successfully created! Someone will reach out to you soon.\n- While you wait, describe what you need help with.\n- Don't mention anyone — just be patient.`,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: 'Close',
                  style: ButtonStyle.Danger,
                  customId: 'close-ticket',
                  emoji: {
                    name: '🔒'
                  }
                }
              ]
            }
          ]
        })

        await interaction.followUp({ content: `Ticket created successfully!\n${msg.url}` })
      } else if (interaction.customId === 'close-ticket') {
        if (
          !['1237458600046104617', '1237458505196114052', '1237457762502574130'].some(r =>
            (interaction.member as GuildMember).roles.cache.has(r)
          )
        )
          return

        await interaction.deferReply({
          flags: 'Ephemeral',
          withResponse: true
        })

        await (interaction.channel as TextChannel).send({
          content: `Closing ticket <t:${((Date.now() + 10000) / 1000).toFixed(0)}:R>`
        })

        const attach = await transcript.createTranscript(interaction.channel, {
          poweredBy: false,
          saveImages: true,
          hydrate: true,
          filename: `transcript-${(interaction.channel as TextChannel).name.replace('ticket_', '')}.html`
        })

        setTimeout(async () => {
          await interaction.channel!.delete()

          const channel = client.channels.cache.get('1313845851998781562') as TextChannel

          channel.send({
            content: `Ticket requested by: <@${(interaction.channel as TextChannel).name.replace('ticket_', '')}>`,
            allowedMentions: {
              parse: ['roles']
            },
            files: [attach]
          })
        }, 10000)
      } else if (args[0] === 'premium') {
        if (
          !interaction.guild ||
          !interaction.guildId ||
          !interaction.channel ||
          !interaction.member
        )
          return
        if (!interaction.isStringSelectMenu()) return

        switch (interaction.values[0]) {
          case 'premium_booster':
            {
              if ((interaction.member as GuildMember).premiumSince) {
                await interaction.reply({
                  content: `You are already a Premium Booster!\nIf you want to generate and/or activate your key, just use the \`${process.env.PREFIX}genkey\` command.`,
                  flags: 64
                })
                break
              }
              await interaction.reply({
                content: `To get Premium Booster, you need to follow the following steps:\n- Boost the server\n- Use the \`${process.env.PREFIX}genkey\` command`,
                flags: 64
              })
            }
            break
          case 'premium_br':
            {
              await interaction.reply({
                content:
                  '<a:carregando:809221866434199634> Preparando o ambiente para a sua compra...',
                flags: 64
              })

              const thread = await (interaction.channel as TextChannel).threads.create({
                name: `BRL Premium (${interaction.user.id})`,
                type: 12,
                invitable: false
              })

              const preference = new Preference(mercadopago)

              const res = await preference.create({
                body: {
                  items: [
                    {
                      title: 'PREMIUM - SABINE PAYMENTS',
                      quantity: 1,
                      currency_id: 'BRL',
                      unit_price: 5.99,
                      id: 'PREMIUM'
                    }
                  ],
                  notification_url: process.env.MP_WEBHOOK_URL,
                  external_reference: `${thread.id};${interaction.user.id};PREMIUM`,
                  date_of_expiration: new Date(Date.now() + 600000).toISOString()
                }
              })

              if (!res.init_point) {
                await thread.send({
                  content: `Não foi possível gerar o link de pagamento e a sua compra não pôde ser concluída.\nO tópico será excluído <t:${((Date.now() + 10000) / 1000).toFixed(0)}:R>`
                })

                return setTimeout(() => thread.delete(), 10000)
              }

              await thread.members.add(interaction.user.id)

              const embed = new EmbedBuilder()
                .setTitle('Plano Premium')
                .setDesc(
                  `Clique no botão abaixo para ser redirecionado para a página de pagamento do Mercado Pago <:mercadopago:1313901326744293427>\nRealize o pagamento <t:${((Date.now() + 600000) / 1000).toFixed(0)}:R>, caso contrário, o link expirará.`
                )

              const button = new ButtonBuilder()
                .defineStyle('link')
                .setLabel('Link de pagamento')
                .setURL(res.init_point)

              await thread.send({
                components: [
                  {
                    type: 1,
                    components: [button]
                  }
                ],
                embeds: [embed]
              })

              await interaction.editReply({
                content: `Ambiente criado! Continue com a compra em ${thread.toString()}`
              })
            }
            break
          case 'premium_usd': {
            await interaction.reply({
              content:
                '<a:carregando:809221866434199634> Getting everything ready for your purchase...',
              flags: 64
            })

            const thread = await (interaction.channel as TextChannel).threads.create({
              name: `USD Premium (${interaction.user.id})`,
              type: 12,
              invitable: false
            })

            await thread.members.add(interaction.member.user.id)

            const payment = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              line_items: [
                {
                  price_data: {
                    currency: 'usd',
                    product_data: {
                      name: 'Premium - Sabine Payments'
                    },
                    unit_amount: 299
                  },
                  quantity: 1
                }
              ],
              mode: 'payment',
              metadata: {
                thread: thread.id,
                user: interaction.user.id,
                type: 'PREMIUM'
              },
              success_url: process.env.STRIPE_WEBHOOK_URL
            })

            if (!payment.url) {
              return await thread.send({
                content:
                  'The payment link could not be generated and your purchase could not be completed.'
              })
            }
            const embed = new EmbedBuilder()
              .setTitle('Premium Plan')
              .setDesc(
                `Click on the button below to be redirected to the <:stripe:1409597720313987204> Stripe payment page.\nYou must complete the payment <t:${((Date.now() + 30 * 60 * 1000) / 1000).toFixed(0)}:R>, or the link will expire.`
              )

            const button = new ButtonBuilder()
              .defineStyle('link')
              .setLabel('Payment link')
              .setURL(payment.url)

            await thread.send({
              components: [
                {
                  type: 1,
                  components: [button]
                }
              ],
              embeds: [embed]
            })

            await interaction.editReply({
              content: `Everything is ready! Continue your purchase in ${thread.toString()}`
            })
          }
        }
      }
    }
  }
})
