import { describe, expect, it } from 'vitest'
import { DiscourseError, createDiscourseClient } from '@/lib/discourse/client'

function fakeFetch(respond: (url: string, init: RequestInit) => Response) {
  const calls: Array<{ url: string; init: RequestInit }> = []
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init })
    return respond(url, init)
  }) as unknown as typeof fetch
  return { calls, fetchImpl }
}

describe('the Discourse client', () => {
  const apiKeys = { ba_moi: 'persona-key-0123456789', thu_duyen: 'relay-key-0123456789' }

  it("posts with each bot's own key, and never with a key for anyone else", async () => {
    const { calls, fetchImpl } = fakeFetch(() => Response.json({ id: 77, topic_id: 55 }))
    const client = createDiscourseClient({ baseUrl: 'https://forum.test/', apiKeys, fetchImpl })
    expect(await client.createPrivateMessage({ asUsername: 'thu_duyen', recipients: ['lan'], title: 'Trò chuyện', raw: 'Chào' }))
      .toEqual({ topicId: 55, postId: 77 })
    expect(await client.createPost({ asUsername: 'ba_moi', topicId: 55, raw: 'Tin vui' })).toEqual({ postId: 77 })
    expect(calls.map((c) => [c.url, (c.init.headers as Record<string, string>)['Api-Key'], (c.init.headers as Record<string, string>)['Api-Username']])).toEqual([
      ['https://forum.test/posts.json', 'relay-key-0123456789', 'thu_duyen'],
      ['https://forum.test/posts.json', 'persona-key-0123456789', 'ba_moi'],
    ])
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ title: 'Trò chuyện', raw: 'Chào', archetype: 'private_message', target_recipients: 'lan' })
    await expect(client.createPost({ asUsername: 'system', topicId: 1, raw: 'x' })).rejects.toThrow('No API key for system')
    await expect(client.createPost({ asUsername: 'constructor', topicId: 1, raw: 'x' })).rejects.toThrow(DiscourseError)
    expect(calls).toHaveLength(2)
  })

  it('reports HTTP failures and outages as DiscourseError with the status', async () => {
    const failing = createDiscourseClient({ baseUrl: 'https://forum.test', apiKeys, fetchImpl: fakeFetch(() => new Response('rate limited', { status: 429 })).fetchImpl })
    await expect(failing.createPost({ asUsername: 'ba_moi', topicId: 1, raw: 'x' })).rejects.toMatchObject({ status: 429 })
    const down = createDiscourseClient({ baseUrl: 'https://forum.test', apiKeys, fetchImpl: (async () => { throw new Error('ECONNREFUSED') }) as unknown as typeof fetch })
    await expect(down.createPost({ asUsername: 'ba_moi', topicId: 1, raw: 'x' })).rejects.toMatchObject({ status: null })
  })

  it('opens a direct chat as the bot and posts into it', async () => {
    const { calls, fetchImpl } = fakeFetch((url) =>
      url.includes('direct-message-channels') ? Response.json({ channel: { id: 812 } }) : Response.json({ success: 'OK', message_id: 9001 }))
    const client = createDiscourseClient({ baseUrl: 'https://forum.test', apiKeys, fetchImpl })
    expect(await client.openDirectChat({ asUsername: 'ba_moi', targetUsername: 'lan' })).toEqual({ channelId: 812 })
    expect(await client.createChatMessage({ asUsername: 'ba_moi', channelId: 812, raw: 'Bà có tin vui' })).toEqual({ messageId: 9001 })
    expect(calls.map((c) => c.url)).toEqual(['https://forum.test/chat/api/direct-message-channels.json', 'https://forum.test/chat/812.json'])
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ target_usernames: ['lan'], upsert: true })
    expect(JSON.parse(calls[1].init.body as string)).toEqual({ message: 'Bà có tin vui' })
    expect((calls[1].init.headers as Record<string, string>)['Api-Key']).toBe('persona-key-0123456789')

    const empty = createDiscourseClient({ baseUrl: 'https://forum.test', apiKeys, fetchImpl: fakeFetch(() => Response.json({})).fetchImpl })
    await expect(empty.openDirectChat({ asUsername: 'ba_moi', targetUsername: 'lan' })).rejects.toThrow(DiscourseError)
    await expect(empty.createChatMessage({ asUsername: 'ba_moi', channelId: 1, raw: 'x' })).rejects.toThrow(DiscourseError)
  })
})
