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


const _consumeAmqpHandler = ({ voiceQueue }) => {
  return async (msg) => {
    if (msg !== null) {
      const requestJson = JSON.parse(msg.content.toString())
      console.log({ requestJson })
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

  mod.amqpPromptChannel.consume(chatgptResponseQueue, _consumeAmqpHandler({ voiceQueue }))
}

export default {}

