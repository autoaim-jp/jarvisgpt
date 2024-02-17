const mod = {}

export const init = async ({
  setting, lib, amqpConnection,
}) => {
  const amqpPromptChannel = await amqpConnection.createChannel()
  mod.amqpPromptChannel = amqpPromptChannel
  const amqpResponseChannel = await amqpConnection.createChannel()
  mod.amqpResponseChannel = amqpResponseChannel

  mod.setting = setting
  mod.lib = lib
}

const _fetchChatgpt = async ({ role, prompt }) => {
  const stream = await mod.openaiClient.chat.completions.create({
    // model: 'gpt-4',
    model: 'gpt-3.5-turbo',
    messages: [{ role, content: prompt }],
    stream: true,
  })
  let response = ''
  for await (const part of stream) {
    // process.stdout.write(part.choices[0]?.delta?.content || '')
    response += part.choices[0]?.delta?.content || ''
  }

  const responseObj = { response }

  return responseObj
}

const _consumeAmqpHandler = ({ chatgptResponseQueue, voiceQueue }) => {
  return async (msg) => {
    if (msg !== null) {
      const requestJson = JSON.parse(msg.content.toString())
      const responseJson = { dummyVoiceEncoded: requestJson }
      const responseJsonStr = JSON.stringify(responseJson)
      mod.amqpResponseChannel.sendToQueue(voiceQueue, Buffer.from(responseJsonStr))

      mod.amqpPromptChannel.ack(msg)
    } else {
      // Consumer cancelled by server
      throw new Error()
    }
  }
}


export const startConsumer = async () => {
  const chatgptResponseQueue = mod.setting.getValue('amqp.CHATGPT_RESPONSE_QUEUE')
  await mod.amqpPromptChannel.assertQueue(chatgptResponseQueue)

  const voiceQueue = mod.setting.getValue('amqp.VOICE_DATA_QUEUE')
  await mod.amqpResponseChannel.assertQueue(voiceQueue)

  mod.amqpPromptChannel.consume(chatgptResponseQueue, _consumeAmqpHandler({ chatgptResponseQueue, voiceQueue }))
}

export default {}

