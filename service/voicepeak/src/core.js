const mod = {}

export const init = async ({
  setting, output, lib, amqpConnection,
}) => {
  mod.setting = setting
  mod.output = output
  mod.lib = lib

  const amqpChatgptChannel = await amqpConnection.createChannel()
  amqpChatgptChannel.prefetch(mod.setting.getValue('amqp.MAX_THREAD_N'))
  mod.amqpChatgptChannel = amqpChatgptChannel
  const amqpSpeakChannel = await amqpConnection.createChannel()
  mod.amqpSpeakChannel = amqpSpeakChannel
}

export const cleanExitNodemonAfterChekingSpeakContainer = () => {
  const { SPEAK_CONTAINER, SERVICE_NAME } = mod.setting.getList('env.SPEAK_CONTAINER', 'env.SERVICE_NAME')
  logger.info({ msg: 'check SPEAK_CONTAINER', SPEAK_CONTAINER, SERVICE_NAME })
  if (SPEAK_CONTAINER !== SERVICE_NAME) {
    logger.info({ msg: 'exit because of the other SPEAK_CONTAINER' })
    process.once('SIGUSR2', () => {
      process.kill(process.pid, 'SIGUSR2')
    })
    process.exit(0)
  }
}

const _convertTextToVoiceFile = async ({ requestJson }) => {
  const { requestId, textId, text, maxTextId } = requestJson

  const voiceDirPath = `${mod.setting.getValue('file.RESULT_FILE_DIR')}${requestId}/`
  const voiceFilePath = `${voiceDirPath}${textId}.wav`

  const voiceEncoded = { requestId, textId, voiceFilePath, }

  mod.output.makeDir({ path: voiceDirPath })

  // for docker
  // const commandList = ['/app/bin/Voicepeak/voicepeak', '-s', text, '-o', voiceFilePath]
  // for host
  const commandList = ['~/Documents/VoicepeakDownloads/Voicepeak/voicepeak', '-s', `'${text}'`, '--speed', '150', '-o', voiceFilePath]
  const outputList = []
  const isShell = true
  await mod.lib.fork({ commandList, outputList, isShell })

  return voiceEncoded
}


const _consumeAmqpHandler = ({ voiceQueue }) => {
  return async (msg) => {
    if (msg !== null) {
      const requestJson = JSON.parse(msg.content.toString())
      console.log({ requestJson })

      const voiceEncoded = await _convertTextToVoiceFile({ requestJson })

      const responseJsonStr = JSON.stringify(voiceEncoded)
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

