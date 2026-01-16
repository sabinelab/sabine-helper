import { prisma } from '@db'
import { Prisma } from '@generated'
import createCommand from '@/structures/command/createCommand'

export default createCommand({
  name: 'resetseason',
  onlyDev: true,
  async run({ ctx }) {
    const msg = await ctx.send('<a:loading:809221866434199634> Reseting season... just wait.')

    await prisma.$transaction([
      prisma.user.updateMany({
        data: {
          reserve_players: [],
          active_players: [],
          correct_predictions: 0,
          incorrect_predictions: 0,
          arena_wins: 0,
          ranked_wins: 0,
          unranked_wins: 0,
          swiftplay_wins: 0,
          ranked_swiftplay_wins: 0,
          arena_defeats: 0,
          ranked_defeats: 0,
          unranked_defeats: 0,
          swiftplay_defeats: 0,
          ranked_swiftplay_defeats: 0,
          arena_metadata: Prisma.DbNull,
          pity: 0,
          claims: 0,
          fates: 0,
          rank_rating: 0,
          gold_packs: 0,
          iron_packs: 0,
          bronze_packs: 0,
          silver_packs: 0,
          diamond_packs: 0,
          radiant_packs: 0,
          immortal_packs: 0,
          platinum_packs: 0,
          ascendant_packs: 0,
          coins: 0,
          daily_time: null,
          claim_time: null
        }
      }),
      prisma.match.deleteMany(),
      prisma.prediction.deleteMany(),
      prisma.transaction.deleteMany()
    ])

    let cursor = '0'

    do {
      const [next, keys] = await Bun.redis.scan(cursor, 'MATCH', 'user:*', 'COUNT', 100)

      if (keys.length) {
        await Bun.redis.del(...keys)
      }

      cursor = next
    } while (cursor !== '0')

    await msg.edit('Season reseted successfully!')
  }
})
