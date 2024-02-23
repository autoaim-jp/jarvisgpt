const mod = {}

export const init = async ({
  setting, lib, amqpConnection,
}) => {
  mod.setting = setting
  mod.lib = lib

  const amqpChatgptChannel = await amqpConnection.createChannel()
  amqpChatgptChannel.prefetch(mod.setting.getValue('amqp.MAX_THREAD_N'))
  mod.amqpChatgptChannel = amqpChatgptChannel
  const amqpSpeakChannel = await amqpConnection.createChannel()
  mod.amqpSpeakChannel = amqpSpeakChannel
}

const _convertTextToVoiceFile = ({ requestJson }) => {
  const { requestId, textId, text, maxTextId } = requestJson
  const textFilePath = `${mod.setting.getValue('file.RESULT_FILE_DIR')}${requestId}/${textId}.wav`
  const voiceEncoded = { requestId, textId, textFilePath, }

  console.log('ここでvoicepeakで変換', voiceEncoded)

  return voiceEncoded
}


const _consumeAmqpHandler = ({ voiceQueue }) => {
  return async (msg) => {
    if (msg !== null) {
      const requestJson = JSON.parse(msg.content.toString())
      console.log({ requestJson })

      const voiceEncoded = _convertTextToVoiceFile({ requestJson })

      const responseJson = { voiceEncoded, }
      const responseJsonStr = JSON.stringify(responseJson)
      mod.amqpSpeakChannel.sendToQueue(voiceQueue, Buffer.from(responseJsonStr))

      mod.amqpChatgptChannel.ack(msg)
    } else {
      // Consumer cancelled by server
      throw new Error()
    }
  }
}


export const startConsumer = async () => {
  const chatgptResponseQueue = mod.setting.getValue('amqp.CHATGPT_RESPONSE_QUEUE')
  await mod.amqpChatgptChannel.assertQueue(chatgptResponseQueue)

  const voiceQueue = mod.setting.getValue('amqp.VOICE_DATA_QUEUE')
  await mod.amqpSpeakChannel.assertQueue(voiceQueue)

  mod.amqpChatgptChannel.consume(chatgptResponseQueue, _consumeAmqpHandler({ voiceQueue }))
}

export default {}

