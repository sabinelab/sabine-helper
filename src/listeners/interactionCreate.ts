import { CategoryChannel, ComponentInteraction, Constants, TextChannel } from 'oceanic.js'
import transcript from 'oceanic-transcripts'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import createListener from '../structures/client/createListener.ts'
import EmbedBuilder from '../structures/builders/EmbedBuilder.ts'
import ButtonBuilder from '../structures/builders/ButtonBuilder.ts'
import Stripe from 'stripe'

const mercadopago = new MercadoPagoConfig({ accessToken: process.env.MP_TOKEN })
const stripe = new Stripe(process.env.STRIPE_TOKEN)

export default createListener({
  name: 'interactionCreate',
  async run(client, interaction) {
    if(interaction instanceof ComponentInteraction) {
      if(!interaction.guild || !interaction.guildID || !interaction.member || !interaction.channel) return

      const args = interaction.data.customID.split(';')

      if(interaction.data.customID === 'ticket') {
        await interaction.defer(64)

        const category = interaction.guild.channels.get('1277285123070361673') as CategoryChannel

        if(category.channels.some(ch => ch.name.includes(interaction.user.id))) {
          return await interaction.createFollowup({ content: 'You already have an open ticket. Please wait until a moderator deletes it.' })
        }

        const channel = await interaction.guild.createChannel(
          Constants.ChannelTypes.GUILD_TEXT,
          {
            name: `ticket_${interaction.user.id}`,
            parentID: interaction.guild.channels.get(interaction.channelID)?.parentID,
            permissionOverwrites: [
              {
                id: interaction.guildID,
                deny: BigInt(1024),
                type: 0
              },
              {
                id: '1237457762502574130',
                allow: BigInt(52224),
                type: 0
              },
              {
                id: interaction.member.id,
                allow: BigInt(52224),
                type: 1
              }
            ]
          }
        )

        const msg = await channel.createMessage({
          content: `${interaction.user.mention} Ticket successfully created! Someone will reach out to you soon.\n- While you wait, describe what you need help with.\n- Don't mention anyone — just be patient.`,
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: 'Close',
                  style: Constants.ButtonStyles.DANGER,
                  customID: 'close-ticket',
                  emoji: {
                    name: '🔒'
                  }
                }
              ]
            }
          ]
        })

        await interaction.createFollowup({ content: `Ticket created successfully!\n${msg.jumpLink}` })
      }
      else if(interaction.data.customID === 'close-ticket') {
        if(!['1237458600046104617', '1237458505196114052', '1237457762502574130'].some(r => interaction.member!.roles.includes(r))) return

        await interaction.deferUpdate(64)

        await (interaction.channel as TextChannel).createMessage({ content: `Closing ticket <t:${((Date.now() + 10000) / 1000).toFixed(0)}:R>` })

        const attach = await transcript.createTranscript(interaction.channel as TextChannel, {
          poweredBy: false,
          saveImages: true,
          hydrate: true,
          filename: `transcript-${(interaction.channel as TextChannel).name.replace('ticket_', '')}.html`
        })

        setTimeout(async () => {
          await interaction.channel!.delete()
          client.rest.channels.createMessage('1313845851998781562', {
            content: `Ticket requested by: <@${(interaction.channel as TextChannel).name.replace('ticket_', '')}>`,
            allowedMentions: {
              users: false
            },
            files: [attach]
          })
        }, 10000)
      }
      else if(args[0] === 'premium') {
        if(!interaction.guild || !interaction.guildID || !interaction.channel || !interaction.member) return

        switch((interaction as ComponentInteraction<Constants.SelectMenuTypes>).data.values.raw[0]) {
          case 'premium_booster': {
            if(interaction.member.premiumSince) {
              await interaction.createMessage({
                content: `Você já é um Premium Booster!\nCaso queira gerar e/ou ativar sua chave, siga o passo a passo:\n- Usar o comando \`${process.env.PREFIX}gerarchave\` em https://canary.discord.com/channels/1233965003850125433/1313588710637568030\n- Usar \`${process.env.PREFIX}ativarchave <servidor>\` no mesmo canal\n - Seguir o passo a passo no tópico que será criado`,
                flags: 64
              })
              break
            }
            await interaction.createMessage({
              content: `Para conseguir o Premium Booster, você precisa seguir os seguintes passos:\n- Impulsionar o servidor\n- Usar o comando \`${process.env.PREFIX}gerarchave\` em https://canary.discord.com/channels/1233965003850125433/1313588710637568030 (o canal só libera depois que você impulsiona o servidor)\n- Usar \`${process.env.PREFIX}ativarchave <servidor>\` no mesmo canal\n - Seguir o passo a passo no tópico que será criado`,
              flags: 64
            })
          }
            break
          case 'premium_br': {
            await interaction.createMessage({
              content: '<a:carregando:809221866434199634> Preparando o ambiente para a sua compra...',
              flags: 64
            })

            const thread = await (interaction.channel as TextChannel)
              .startThreadWithoutMessage({
                name: `BRL Premium (${interaction.user.id})`,
                type: 12,
                invitable: false
              })

            const preference = new Preference(mercadopago)

            const res = await preference.create(
              {
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
              }
            )

            if(!res.init_point) {
              await thread.createMessage({ content: `Não foi possível gerar o link de pagamento e a sua compra não pôde ser concluída.\nO tópico será excluído <t:${((Date.now() + 10000) / 1000).toFixed(0)}:R>` })
              
              return setTimeout(() => thread.delete(), 10000)
            }

            await thread.addMember(interaction.user.id)

            const embed = new EmbedBuilder()
              .setTitle('Plano Premium')
              .setDesc(`Clique no botão abaixo para ser redirecionado para a página de pagamento do Mercado Pago <:mercadopago:1313901326744293427>\nRealize o pagamento <t:${((Date.now() + 600000) / 1000).toFixed(0)}:R>, caso contrário, o link expirará.`)

            const button = new ButtonBuilder()
              .setStyle('link')
              .setLabel('Link de pagamento')
              .setURL(res.init_point)

            await thread.createMessage(embed.build({
              components: [
                {
                  type: 1,
                  components: [button]
                }
              ]
            }))

            await interaction.editOriginal({ content: `Ambiente criado! Continue com a compra em ${thread.mention}` })
          }
            break
          case 'premium_usd': {
            await interaction.createMessage({
              content: '<a:carregando:809221866434199634> Getting everything ready for your purchase...',
              flags: 64
            })

            const thread = await (interaction.channel as TextChannel)
              .startThreadWithoutMessage({
                name: `USD Premium (${interaction.user.id})`,
                type: 12,
                invitable: false
              })

            await thread.addMember(interaction.member.id)

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

            if(!payment.url) {
              return await thread.createMessage({ content: 'The payment link could not be generated and your purchase could not be completed.' })
            }
            const embed = new EmbedBuilder()
              .setTitle('Premium Plan')
              .setDesc(`Click on the button below to be redirected to the <:stripe:1409597720313987204> Stripe payment page.\nYou must complete the payment <t:${((Date.now() + (30 * 60 * 1000)) / 1000).toFixed(0)}:R>, or the link will expire.`)

            const button = new ButtonBuilder()
              .setStyle('link')
              .setLabel('Payment link')
              .setURL(payment.url)

            await thread.createMessage(embed.build({
              components: [
                {
                  type: 1,
                  components: [button]
                }
              ]
            }))

            await interaction.editOriginal({ content: `Everything is ready! Continue your purchase in ${thread.mention}` })
          }
        }
      }
    }
  }
})