import {
  $Enums,
  type Event,
  type Guild,
  type GuildKey,
  type Key,
  type LiveMessage,
  type Premium,
  PrismaClient,
  type TBDMatch,
  type User
} from '@prisma/client'
import { client } from '../index.ts'
import EmbedBuilder from '../structures/builders/EmbedBuilder.ts'
import { TextChannel } from 'oceanic.js'

export const prisma = new PrismaClient()

type ArenaLineup = {
  player: string
  agent: {
    name: string
    role: string
  }
}

type ArenaMetadata = {
  map: string
  lineup: ArenaLineup[]
}

export class SabineUser implements User {
  public id: string
  public created_at: Date = new Date()
  public correct_predictions: number = 0
  public incorrect_predictions: number = 0
  public lang: $Enums.Language = 'en'
  public premium: Premium | null = null
  public active_players: string[] = []
  public reserve_players: string[] = []
  public coins: bigint = 0n
  public team_name: string | null = null
  public team_tag: string | null = null
  public arena_wins: number = 0
  public ranked_wins: number = 0
  public unranked_wins: number = 0
  public swiftplay_wins: number = 0
  public ranked_swiftplay_wins: number = 0
  public arena_defeats: number = 0
  public ranked_defeats: number = 0
  public unranked_defeats: number = 0
  public swiftplay_defeats: number = 0
  public ranked_swiftplay_defeats: number = 0
  public arena_metadata: ArenaMetadata | null = null
  public daily_time: Date | null = null
  public claim_time: Date | null = null
  public trade_time: Date | null = null
  public warn: boolean = false
  public pity: number = 0
  public claims: number = 0
  public fates: number = 0
  public rank_rating: number = 50
  public remind: boolean | null = null
  public remind_in: string | null = null
  public reminded: boolean = true
  public warned: boolean | null = null
  public iron_packs: number = 0
  public bronze_packs: number = 0
  public silver_packs: number = 0
  public gold_packs: number = 0
  public platinum_packs: number = 0
  public diamond_packs: number = 0
  public ascendant_packs: number = 0
  public immortal_packs: number = 0
  public radiant_packs: number = 0
  public last_vote: Date | null = null
  public vote_streak: number = 0

  public constructor(id: string) {
    this.id = id
  }
  public async save() {
    const data: Partial<User> = {}

    for(const key in this) {
      if(
        typeof this[key] === 'function' ||
        key === 'id' ||
        this[key] === null ||
        this[key] === 'premium'
      ) continue
      (data as any)[key] = this[key]
    }

    const { premium, ...cleanData } = data as any

    if(premium) {
      return await prisma.user.upsert({
        where: { id: this.id },
        update: cleanData,
        create: { id: this.id, ...cleanData }
      })
    }

    else {
      return await prisma.user.upsert({
        where: { id: this.id },
        update: cleanData,
        create: { id: this.id, ...cleanData }
      })
    }
  }
  public static async fetch(id: string) {
    const data = await prisma.user.findUnique({
      where: { id },
      include: {
        premium: true
      }
    })

    if(!data) return data

    let user = new SabineUser(data.id)

    user = Object.assign(user, data)

    return user
  }
  public async addPlayerToRoster(player: string, method: 'CLAIM_PLAYER_BY_CLAIM_COMMAND' | 'CLAIM_PLAYER_BY_COMMAND' = 'CLAIM_PLAYER_BY_CLAIM_COMMAND', channel?: string) {
    this.reserve_players.push(player)

    await Promise.allSettled([
      prisma.transaction.create({
        data: {
          type: method,
          player: Number(player),
          userId: this.id
        }
      }),
      this.save()
    ])

    return this
  }
  public async addPremium(by: 'ADD_PREMIUM_BY_COMMAND' | 'BUY_PREMIUM') {
    const expiresAt = new Date(Date.now() + 2592000000)

    const key = await prisma.key.create({
      data: {
        type: 'PREMIUM',
        user: this.id,
        expires_at: expiresAt,
        active_in: [],
        active: false
      }
    })

    const premium = await prisma.premium.findUnique({
      where: {
        type: 'PREMIUM',
        userId: this.id
      }
    })

    this.warned = false

    await Promise.allSettled([
      prisma.premium.upsert({
        create: {
          type: 'PREMIUM',
          expires_at: expiresAt,
          userId: this.id
        },
        update: {
          expires_at: !premium?.expires_at ? expiresAt : new Date(premium.expires_at.getTime() + 2592000000)
        },
        where: {
          userId: this.id
        }
      }),
      this.save()
    ])

    const channel = client.getChannel(process.env.USERS_LOG) as TextChannel

    const user = client.users.get(this.id)

    const embed = new EmbedBuilder()
      .setTitle('New register')
      .setDesc(`User: ${user?.mention} (${this.id})`)
      .setFields(
        {
          name: by,
          value: 'PREMIUM'
        }
      )

    const webhooks = await channel.getWebhooks()
    let webhook = webhooks.filter(w => w.name === client.user.username + ' Logger')[0]

    if(!webhook) webhook = await channel.createWebhook({ name: client.user.username + ' Logger' })

    await webhook.execute({
      avatarURL: client.user.avatarURL(),
      embeds: [embed]
    })

    return key.id
  }
}
export class SabineGuild implements Guild {
  public id: string
  public lang: $Enums.Language = 'en'
  public tbd_matches: TBDMatch[] = []
  public guildKeyId: string | null = null
  public events: Event[] = []
  public live_messages: LiveMessage[] = []
  public valorant_resend_time: Date | null = null
  public valorant_matches: string[] = []
  public valorant_news_channel: string | null = null
  public valorant_live_feed_channel: string | null = null
  public lol_resend_time: Date | null = null
  public lol_matches: string[] = []
  public lol_news_channel: string | null = null
  public lol_live_feed_channel: string | null = null
  public tournaments_length: number = 5
  public partner: boolean | null = null
  public invite: string | null = null

  public constructor(id: string) {
    this.id = id
  }

  public async save() {
    const data: Partial<Guild> = {}

    for(const key in this) {
      if(
        typeof this[key] === 'function' ||
        key === 'id' ||
        this[key] === null
      ) continue

      if(
        ['tbd_matches', 'events', 'live_messages']
          .includes(key)
      ) {
        (data as any)[key] = {
          [key]: Array.isArray(this[key]) &&
            this[key].length ?
            {
              create: this[key]
            } :
            undefined
        }
      }

      else (data as any)[key] = this[key]
    }

    return await prisma.guild.upsert({
      where: { id: this.id },
      update: data,
      create: { id: this.id, ...data }
    })
  }
  public static async fetch(id: string) {
    const data = await prisma.guild.findUnique({ where: { id } })

    if(!data) return data

    const guild = new SabineGuild(data.id)

    return Object.assign(guild, data)
  }
}