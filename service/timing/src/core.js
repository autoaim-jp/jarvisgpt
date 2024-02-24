const mod = {}

export const init = async ({
  setting, lib, amqpConnection,
}) => {
  mod.setting = setting
  mod.lib = lib

  const amqpVoiceChannel = await amqpConnection.createChannel()
  amqpVoiceChannel.prefetch(mod.setting.getValue('amqp.MAX_THREAD_N'))
  mod.amqpVoiceChannel = amqpVoiceChannel
}

const _consumeAmqpHandler = () => {
  let quietUntiTimestamp = Date.now()
  return async (msg) => {
    if (msg !== null) {
      console.log({ msg })
      const requestJson = JSON.parse(msg.content.toString())

      logger.info({ requestJson })
      const { requestId, textFilePath, textId } = requestJson

      logger.info({ msg: 'play', textFilePath })

      const commandList = ['soxi', '-D', textFilePath]
      const outputList = []
      const isShell = false
      await mod.lib.fork({ commandList, outputList, isShell })

      const quietMs = (outputList[0] || 0) * 1000
      await mod.awaitSleep(quietMs)

      mod.amqpVoiceChannel.ack(msg)
    } else {
      // Consumer cancelled by server
      throw new Error()
    }
  }
}


export const startConsumer = async () => {
  const promptQueue = mod.setting.getValue('amqp.VOICE_DATA_QUEUE')
  await mod.amqpVoiceChannel.assertQueue(promptQueue)

  mod.amqpVoiceChannel.consume(promptQueue, _consumeAmqpHandler())
}

export default {}

