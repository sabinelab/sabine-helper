import {
  $Enums,
  type Premium,
  type User
} from '@generated'
import { client } from '..'
import EmbedBuilder from '../structures/builders/EmbedBuilder'
import { TextChannel } from 'discord.js'
import { prisma, redis } from '@/database'
import { updateCache, voidCatch } from '@/database/update-cache'
import { hydrateData } from '@/database/hydrate-data'

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
  public async save(update = true) {
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

    // eslint-disable-next-line
    const { premium, ...cleanData } = data as any

    const user = await prisma.user.upsert({
      where: { id: this.id },
      update: cleanData,
      create: {
        id: this.id,
        ...cleanData
      },
      include: {
        premium: true
      }
    })

    if(update) {
      updateCache(`user:${user.id}`, user, true).catch(voidCatch)
    }

    return user
  }
  public static async fetch(id: string) {
    const cachedData = await redis.get(`user:${id}`)

    if(cachedData) {
      const hydrated = hydrateData<typeof this>(JSON.parse(cachedData))
      const user = new SabineUser(id)

      return Object.assign(user, hydrated)
    }

    const data = await prisma.user.findUnique({
      where: { id },
      include: {
        premium: true
      }
    })

    if(!data) return data

    updateCache(`user:${id}`, data).catch(voidCatch)

    const user = new SabineUser(data.id)

    return Object.assign(user, data)
  }

  public async addPlayerToRoster(player: string, method: 'CLAIM_PLAYER_BY_CLAIM_COMMAND' | 'CLAIM_PLAYER_BY_COMMAND' = 'CLAIM_PLAYER_BY_CLAIM_COMMAND') {
    const updates: any = {
      reserve_players: {
        push: player
      }
    }

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: method,
          player: Number(player),
          userId: this.id
        }
      }),
      prisma.user.update({
        where: {
          id: this.id
        },
        data: updates
      })
    ])
    await redis.del(`user:${this.id}`)

    return this
  }
  public async addPremium(by: 'ADD_PREMIUM_BY_COMMAND' | 'BUY_PREMIUM') {
    const expiresAt = new Date(Date.now() + 2592000000)

    const premium = await prisma.premium.findFirst({
      where: {
        type: 'PREMIUM',
        userId: this.id
      }
    })

    this.warned = false

    const [key] = await prisma.$transaction([
      prisma.key.create({
        data: {
          type: 'PREMIUM',
          user: this.id,
          expires_at: expiresAt,
          active_in: [],
          active: false
        }
      }),
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
      prisma.user.update({
        where: {
          id: this.id
        },
        data: {
          warned: false
        }
      })
    ])
    await redis.del(`user:${this.id}`)

    const channel = client.channels.cache.get(process.env.USERS_LOG) as TextChannel

    const user = client.users.cache.get(this.id)

    const embed = new EmbedBuilder()
      .setTitle('New register')
      .setDesc(`User: ${user?.toString()} (${this.id})`)
      .setFields(
        {
          name: by,
          value: 'PREMIUM'
        }
      )

    const webhooks = await channel.fetchWebhooks()
    let webhook = webhooks.find(w => w.name === client.user?.username + ' Logger')

    if(!webhook) webhook = await channel.createWebhook({ name: client.user?.username + ' Logger' })

    await webhook.send({
      avatarURL: client.user?.displayAvatarURL({ size: 2048 }),
      embeds: [embed]
    })

    return key
  }
}