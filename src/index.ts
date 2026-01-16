import { type FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import type { TextChannel } from 'discord.js'
import fastify from 'fastify'
import { UserSchema } from './database'
import EmbedBuilder from './structures/builders/EmbedBuilder'
import App from './structures/client/App'

export const client = new App({
  allowedMentions: {
    parse: ['users', 'roles'],
    repliedUser: true
  },
  intents: ['GuildMessages', 'GuildMembers', 'GuildBans', 'Guilds', 'MessageContent']
})

client.connect()

const cache = new Set<string>()

const webhook_route: FastifyPluginAsyncTypebox = async fastify => {
  fastify.post(
    '/mercadopago',
    {
      schema: {
        body: Type.Object({
          type: Type.String(),
          data: Type.Object({
            id: Type.String()
          })
        })
      }
    },
    async req => {
      if (req.body.type === 'payment') {
        const details = await fetch(`https://api.mercadopago.com/v1/payments/${req.body.data.id}`, {
          headers: {
            Authorization: 'Bearer ' + process.env.MP_TOKEN
          }
        }).then(res => res.json())

        const args = details.external_reference.split(';')

        if (details.status === 'approved' && !cache.has(details.external_reference)) {
          cache.add(details.external_reference)

          const user = (await UserSchema.fetch(args[1])) || new UserSchema(args[1])

          const keyId = await user.addPremium('BUY_PREMIUM')

          const embed = new EmbedBuilder()
            .setTitle('Pagamento Aprovado')
            .setDesc(
              `Sua compra de **${details.transaction_details.total_paid_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}** foi aprovada e você já pode aproveitar seus benefícios!\n\nSua chave de ativação é \`${keyId}\`\nNão compartilhe com NINGUÉM!\n\nPara ativar sua chave, vá em https://canary.discord.com/channels/1233965003850125433/1313588710637568030 e use o comando \`${process.env.PREFIX}ativarchave <id do servidor>\``
            )
            .setFooter({
              text: 'O tópico será deletado automaticamente após 45 minutos de inatividade'
            })

          const channel = client.channels.cache.get(args[0]) as TextChannel

          if (channel) await channel.send({ embeds: [embed] })
        } else if (details.status === 'rejected') {
          const embed = new EmbedBuilder()
            .setTitle('Pagamento Rejeitado')
            .setDesc(
              `Sua compra de **${details.transaction_details.total_paid_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}** foi rejeitada e não foi possível prosseguir com o pagamento!`
            )

          const channel = client.channels.cache.get(args[0]) as TextChannel

          if (channel) await channel.send({ embeds: [embed] })
        }
      }
    }
  )

  fastify.post(
    '/stripe',
    {
      schema: {
        body: Type.Object({
          type: Type.String(),
          data: Type.Object({
            object: Type.Object({
              amount_total: Type.Number(),
              metadata: Type.Object({
                user: Type.String(),
                thread: Type.String(),
                type: Type.String()
              })
            })
          })
        })
      }
    },
    async (req, reply) => {
      if (req.body.type === 'checkout.session.completed') {
        const session = req.body.data.object

        const user =
          (await UserSchema.fetch(session.metadata.user)) || new UserSchema(session.metadata.user)

        const keyId = await user.addPremium('BUY_PREMIUM')

        const embed = new EmbedBuilder()
          .setTitle('Payment Approved')
          .setDesc(
            `Your purchase of **${(session.amount_total / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}** has been approved and you can now enjoy your benefits!\n\nYour activation key is \`${keyId}\`\nDo not share with ANYONE!\n\nTo activate your key, go to https://canary.discord.com/channels/1233965003850125433/1313588710637568030 and use the command \`${process.env.PREFIX}activatekey <server ID>\``
          )
          .setFooter({
            text: 'The thread will be deleted automatically after 45 minutes of inactivity'
          })

        const channel = client.channels.cache.get(session.metadata!.thread) as TextChannel

        await channel.send({ embeds: [embed] })

        reply.code(200).send({ message: 'Payment received' })
      } else if (req.body.type === 'checkout.session.async_payment_failed') {
        const session = req.body.data.object

        const embed = new EmbedBuilder()
          .setTitle('Payment Failed')
          .setDesc(
            `Your purchase of **${session.amount_total?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}** has been rejected and it was not possible to proceed with the payment!`
          )

        const channel = client.channels.cache.get(session.metadata!.thread) as TextChannel

        await channel.send({ embeds: [embed] })

        reply.code(400).send({ message: 'Payment rejected' })
      }
    }
  )
}
const server = fastify()

server.register(webhook_route)
server.listen({ host: '0.0.0.0', port: 3000 })
