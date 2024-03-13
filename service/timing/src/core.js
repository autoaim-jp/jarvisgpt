const mod = {}

export const init = async ({
  setting, input, lib, amqpConnection,
}) => {
  mod.setting = setting
  mod.input = input
  mod.lib = lib

  const amqpVoiceChannel = await amqpConnection.createChannel()
  amqpVoiceChannel.prefetch(mod.setting.getValue('amqp.MAX_THREAD_N'))
  mod.amqpVoiceChannel = amqpVoiceChannel

  mod.voiceFilePathList = []
}

const _consumeAmqpHandler = () => {
  let quietUntiTimestamp = Date.now()
  return async (msg) => {
    if (msg !== null) {
      console.log({ msg })
      const requestJson = JSON.parse(msg.content.toString())

      logger.info({ requestJson })
      const { requestId, voiceFilePath, textId } = requestJson

      logger.info({ msg: 'play', voiceFilePath })
      mod.voiceFilePathList.push(voiceFilePath)

      const isShell = false

      const tmpOutputList = []
      // await mod.lib.fork({ commandList: ['sox', '-h'], outputList: tmpOutputList, isShell })
      const playCommandList = ['play', voiceFilePath, '-t', 'alsa']
      await mod.lib.fork({ commandList: playCommandList, outputList: tmpOutputList, isShell })
      logger.info({ tmpOutputList })

      const getDurationCommandList = ['soxi', '-D', voiceFilePath]
      const outputList = []
      await mod.lib.fork({ commandList: getDurationCommandList, outputList, isShell })
      logger.info({ outputList })

      const quietMs = (outputList[0] || 0) * 1000
      await mod.lib.awaitSleep({ ms: quietMs })

      mod.amqpVoiceChannel.ack(msg)
    } else {
      // Consumer cancelled by server
      throw new Error()
    }
  }
}

export const handleFileRequest = ({ res }) => {
  const voiceFilePath = mod.voiceFilePathList.shift()
  if (voiceFilePath) {
    // res.end(mod.input.readFile({ filePath: voiceFilePath }))
    res.end(voiceFilePath)
  } else {
    res.status(404)
    res.end()
  }
}


export const startConsumer = async () => {
  const promptQueue = mod.setting.getValue('amqp.VOICE_DATA_QUEUE')
  await mod.amqpVoiceChannel.assertQueue(promptQueue)

  mod.amqpVoiceChannel.consume(promptQueue, _consumeAmqpHandler())
}

export default {}

