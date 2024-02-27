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

// debug export
export const _convertTextToVoiceFile = async ({ requestJson }) => {
  const { requestId, textId, text, maxTextId } = requestJson

  const voiceDirPath = `${mod.setting.getValue('file.RESULT_FILE_DIR')}${requestId}/`
  const voiceFilePath = `${voiceDirPath}${textId}.wav`

  const voiceEncoded = { requestId, textId, voiceFilePath, }

  mod.output.makeDir({ path: voiceDirPath })

  // for docker
  // const commandList = ['/app/bin/Voicepeak/voicepeak', '-s', text, '-o', voiceFilePath]
  // for host
  const commandList = ['echo', `'${text}'`, '|', 'open_jtalk', '-x', '/var/lib/mecab/dic/open-jtalk/naist-jdic/', '-m', '/usr/share/hts-voice/nitech-jp-atr503-m001/nitech_jp_atr503_m001.htsvoice', '-r', '1.0', '-ow', voiceFilePath]
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

