/**
 * The two Discourse API calls the service makes: start a private message and
 * reply in a topic, each as a named bot user (Api-Username). The API key
 * should be scoped to the bot users only.
 */

export interface DiscourseClient {
  /** Starts a private-message topic from `asUsername` to `recipients`. */
  createPrivateMessage(input: { asUsername: string; recipients: string[]; title: string; raw: string }): Promise<{ topicId: number; postId: number }>
  /** Replies in an existing topic as `asUsername`. */
  createPost(input: { asUsername: string; topicId: number; raw: string }): Promise<{ postId: number }>
}

export class DiscourseError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message)
    this.name = 'DiscourseError'
  }
}

export function createDiscourseClient(options: {
  baseUrl: string
  apiKey: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}): DiscourseClient {
  const fetchImpl = options.fetchImpl ?? fetch
  const timeoutMs = options.timeoutMs ?? 5000
  const baseUrl = options.baseUrl.replace(/\/+$/, '')

  async function createPost(asUsername: string, body: Record<string, unknown>): Promise<{ id: number; topic_id: number }> {
    let response: Response
    try {
      response = await fetchImpl(`${baseUrl}/posts.json`, {
        method: 'POST',
        headers: {
          'Api-Key': options.apiKey,
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
    return (await response.json()) as { id: number; topic_id: number }
  }

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
  }
}
