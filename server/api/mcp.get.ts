import { createEventStream } from 'h3'

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)

  await eventStream.push({
    id: 'init',
    data: JSON.stringify({
      type: 'connection',
      status: 'ready'
    })
  })

  const keepAliveInterval = setInterval(() => {
    eventStream.push({
      event: 'ping',
      data: 'keepalive'
    })
  }, 30000)

  eventStream.onClosed(() => {
    clearInterval(keepAliveInterval)
  })

  return eventStream.send()
})