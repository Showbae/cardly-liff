const BASE = 'https://api.line.me/v2/bot'

type LineMessage = Record<string, unknown>

async function linePost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error(`LINE API error ${res.status}:`, text)
  }
}

export async function reply(replyToken: string, messages: LineMessage[]) {
  await linePost('/message/reply', { replyToken, messages })
}

export async function push(to: string, messages: LineMessage[]) {
  await linePost('/message/push', { to, messages })
}
