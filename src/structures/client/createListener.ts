import type { ClientEvents } from 'discord.js'
import type App from './App'

type Listener<T extends keyof ClientEvents> = {
  name: T
  run: (client: App, ...args: ClientEvents[T]) => Promise<unknown>
}

export default function <T extends keyof ClientEvents>(listener: Listener<T>): Listener<T> {
  return listener
}
