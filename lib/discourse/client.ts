/**
 * The Discourse API calls the service makes, each as one of the bot users:
 * start a private message, reply in a topic, and (for Bà Mối in chat) open a
 * direct chat and post into it. Each bot has its own
 * single-user API key, so a leaked key can only ever post as that bot, never
 * as a member or an admin.
 */

export interface DiscourseClient {
  /** Starts a private-message topic from `asUsername` to `recipients`. */
  createPrivateMessage(input: { asUsername: string; recipients: string[]; title: string; raw: string }): Promise<{ topicId: number; postId: number }>
  /** Replies in an existing topic as `asUsername`. */
  createPost(input: { asUsername: string; topicId: number; raw: string }): Promise<{ postId: number }>
  /** Opens (or returns the existing) one-to-one chat between `asUsername` and `targetUsername`. */
  openDirectChat(input: { asUsername: string; targetUsername: string }): Promise<{ channelId: number }>
  /** Posts a chat message as `asUsername` in a channel it belongs to. */
  createChatMessage(input: { asUsername: string; channelId: number; raw: string }): Promise<{ messageId: number }>
}

export class DiscourseError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message)
    this.name = 'DiscourseError'
  }
}

export function createDiscourseClient(options: {
  baseUrl: string
  /** Single-user API keys, by the bot username each belongs to. */
  apiKeys: Record<string, string>
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): DiscourseClient {
  const fetchImpl = options.fetchImpl ?? fetch
  const timeoutMs = options.timeoutMs ?? 5000
  const baseUrl = options.baseUrl.replace(/\/+$/, '')

  async function request<T>(asUsername: string, path: string, body: Record<string, unknown>): Promise<T> {
    const apiKey = Object.hasOwn(options.apiKeys, asUsername) ? options.apiKeys[asUsername] : undefined
    if (!apiKey) throw new DiscourseError(`No API key for ${asUsername}`, null)
    let response: Response
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Api-Username': asUsername,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      throw new DiscourseError(`Discourse unreachable: ${(error as Error).message}`, null)
    }
    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 300)
      throw new DiscourseError(`Discourse ${response.status}: ${detail}`, response.status)
    }
    return (await response.json()) as T
  }

  const createPost = (asUsername: string, body: Record<string, unknown>) =>
    request<{ id: number; topic_id: number }>(asUsername, '/posts.json', body)

  return {
    async createPrivateMessage({ asUsername, recipients, title, raw }) {
      const post = await createPost(asUsername, {
        title, raw, archetype: 'private_message', target_recipients: recipients.join(','),
      })
      return { topicId: post.topic_id, postId: post.id }
    },
    async createPost({ asUsername, topicId, raw }) {
      const post = await createPost(asUsername, { topic_id: topicId, raw })
      return { postId: post.id }
    },
    async openDirectChat({ asUsername, targetUsername }) {
      const result = await request<{ channel?: { id?: number } }>(asUsername, '/chat/api/direct-message-channels.json', {
        target_usernames: [targetUsername], upsert: true,
      })
      const channelId = result.channel?.id
      if (!Number.isInteger(channelId)) throw new DiscourseError('Discourse returned no chat channel', null)
      return { channelId: channelId as number }
    },
    async createChatMessage({ asUsername, channelId, raw }) {
      const result = await request<{ message_id?: number }>(asUsername, `/chat/${channelId}.json`, { message: raw })
      if (!Number.isInteger(result.message_id)) throw new DiscourseError('Discourse returned no chat message', null)
      return { messageId: result.message_id as number }
    },
  }
}
