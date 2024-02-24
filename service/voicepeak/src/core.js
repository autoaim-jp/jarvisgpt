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

// debug export
export const _convertTextToVoiceFile = async ({ requestJson }) => {
  const { requestId, textId, text, maxTextId } = requestJson

  // for debug
  // const textFilePath = '0002.wav'
  const textFilePath = `${mod.setting.getValue('file.RESULT_FILE_DIR')}${requestId}/${textId}.wav`

  const voiceEncoded = { requestId, textId, textFilePath, }

  // for docker
  // const commandList = ['/app/bin/Voicepeak/voicepeak', '-s', text, '-o', textFilePath]
  // for host
  const commandList = ['~/Documents/VoicepeakDownloads/Voicepeak/voicepeak', '-s', `'${text}'`, '-o', textFilePath]
  const outputList = []
  const isShell = true
  console.log({ commandList })
  await mod.lib.fork({ commandList, outputList, isShell })

  console.log('ここでvoicepeakで変換', voiceEncoded)
  console.log({ outputList })

  return voiceEncoded
}


const _consumeAmqpHandler = ({ voiceQueue }) => {
  return async (msg) => {
    if (msg !== null) {
      const requestJson = JSON.parse(msg.content.toString())
      console.log({ requestJson })

      const voiceEncoded = await _convertTextToVoiceFile({ requestJson })

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

