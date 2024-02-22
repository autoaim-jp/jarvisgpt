const mod = {}

export const init = async ({
  setting, lib, amqpConnection, OpenAI,
}) => {
  const amqpPromptChannel = await amqpConnection.createChannel()
  mod.amqpPromptChannel = amqpPromptChannel
  const amqpResponseChannel = await amqpConnection.createChannel()
  mod.amqpResponseChannel = amqpResponseChannel

  mod.setting = setting
  mod.lib = lib

  const OPENAI_CHATGPT_API_KEY = mod.setting.getValue('env.OPENAI_CHATGPT_API_KEY')
  const openaiClient = new OpenAI({
    apiKey: OPENAI_CHATGPT_API_KEY,
  })
  mod.openaiClient = openaiClient
}

const _fetchChatgpt = async ({ role, prompt }) => {
  console.log('start _fetchChatgpt', { role, prompt })
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

  console.log('end _fetchChatgpt', { role, prompt, response })
  return response
}

const _convertChatgptResponse = ({ requestId, chatgptResponse }) => {
  const responseObj = {}
  /* split by split-word*/
  const textList = chatgptResponse.split(/、|。/g).filter((text) => { return text !== '' })
  if (textList.length === 0) {
    return responseObj
  }

  /* append split-word */
  let appendIndex = 0
  chatgptResponse.split('').forEach((char) => {
    if (['、', '。'].indexOf(char) >= 0) {
      textList[appendIndex] = textList[appendIndex] + char
      appendIndex += 1
    }
  })

  /* generate id */
  textList.forEach((text, i) => {
    const fourDigit = ('000' + i).slice(-4)
    const textId = `${requestId}_${fourDigit}`
    responseObj[textId] = { text }
  })

  return responseObj
}

const _consumeAmqpHandler = ({ responseQueue }) => {
  return async (msg) => {
    if (msg !== null) {
      console.log({ msg })
      const SLEEP_BEFORE_REQUEST_MS = mod.setting.getValue('chatgpt.SLEEP_BEFORE_REQUEST_MS')
      console.log(`sleep ${SLEEP_BEFORE_REQUEST_MS}ms`)
      await mod.lib.awaitSleep({ ms: SLEEP_BEFORE_REQUEST_MS })

      const requestJson = JSON.parse(msg.content.toString())

      const { requestId } = requestJson
      const role = requestJson.role || mod.setting.getValue('chatgpt.DEFAULT_ROLE')
      const prompt = requestJson.prompt || mod.setting.getValue('chatgpt.DEFAULT_ROLE')

      const chatgptResponse = await _fetchChatgpt({ role, prompt })
      const responseObj = _convertChatgptResponse({ requestId, chatgptResponse })
      const responseJson = { requestId, response: responseObj }
      const responseJsonStr = JSON.stringify(responseJson)
      mod.amqpResponseChannel.sendToQueue(responseQueue, Buffer.from(responseJsonStr))

      mod.amqpPromptChannel.ack(msg)
    } else {
      // Consumer cancelled by server
      throw new Error()
    }
  }
}


export const startConsumer = async () => {
  const promptQueue = mod.setting.getValue('amqp.CHATGPT_PROMPT_QUEUE')
  await mod.amqpPromptChannel.assertQueue(promptQueue)

  const responseQueue = mod.setting.getValue('amqp.CHATGPT_RESPONSE_QUEUE')
  await mod.amqpResponseChannel.assertQueue(responseQueue)

  mod.amqpPromptChannel.consume(promptQueue, _consumeAmqpHandler({ responseQueue }))
}

export default {}

