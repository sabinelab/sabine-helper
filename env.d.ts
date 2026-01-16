declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string
      DATABASE_URL: string
      PREFIX: string
      MOD_LOG: string
      SABINE_TOKEN: string
      MP_TOKEN: string
      MP_WEBHOOK_URL: string
      STRIPE_WEBHOOK_URL: string
      ERROR_LOG: string
      USERS_LOG: string
      PREMIUM_LOG: string
      INTERVAL: number
      API_URL: string
      STRIPE_TOKEN: string
      STRIPE_SECRET_WEBHOOK: string
      REDIS_URL: string
    }
  }
}
export {}
