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
  const speakRequestList = []
  /* split by split-word*/
  const splitWordList = mod.setting.getValue('chatgpt.SPLIT_WORD_LIST')
  const textList = chatgptResponse.split(new RegExp(splitWordList.join('|'), 'g')).filter((text) => { return text !== '' })
  if (textList.length === 0) {
    return speakRequestList
  }

  /* append split-word */
  let appendIndex = 0
  chatgptResponse.split('').forEach((char) => {
    if (appendIndex >= textList.length) {
      return
    }
    if (splitWordList.indexOf(char) >= 0) {
      textList[appendIndex] = textList[appendIndex] + char
      appendIndex += 1
    }
  })

  /* generate id */
  const maxTextId = ('000' + (textList.length - 1)).slice(-4)
  textList.forEach((text, i) => {
    const textId = ('000' + i).slice(-4)
    speakRequestList.push({ requestId, textId, text, maxTextId })
  })

  return speakRequestList
}

const _filterPrompt = ({ prompt }) => {
  let promptFiltered = null
  let promptCondition = '100文字以内で解答。口語で解答。'
  if (prompt.indexOf('ねぇ') >= 0 || prompt.indexOf('ねー') >= 0) {
    promptFiltered = promptCondition + prompt
  }
  if (prompt.indexOf('教えて') >= 0) {
    promptFiltered = promptCondition + prompt
  }

  return promptFiltered
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

      const promptFiltered = _filterPrompt({ prompt })
      if (promptFiltered === null) {
        mod.amqpPromptChannel.ack(msg)
        return
      }

      const chatgptResponse = await _fetchChatgpt({ role, prompt: promptFiltered })
      const speakRequestList = _convertChatgptResponse({ requestId, chatgptResponse })
      speakRequestList.forEach((speakRequest) => {
        const speakRequestJsonStr = JSON.stringify(speakRequest)
        mod.amqpResponseChannel.sendToQueue(responseQueue, Buffer.from(speakRequestJsonStr))
      })

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

