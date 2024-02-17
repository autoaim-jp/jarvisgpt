const setting = {}

export const init = ({ env }) => {
  const { 
    SERVICE_NAME, 
    OPENAI_CHATGPT_API_KEY, 
    AMQP_USER, AMQP_PASS, AMQP_HOST, AMQP_PORT
  } = env
  setting.env = { 
    SERVICE_NAME, 
    OPENAI_CHATGPT_API_KEY, 
    AMQP_USER, AMQP_PASS, AMQP_HOST, AMQP_PORT
  }
}

setting.amqp = {}
setting.amqp.CHATGPT_PROMPT_QUEUE = 'recorded-voice'
setting.amqp.CHATGPT_RESPONSE_QUEUE = 'chatgpt-response'

setting.chatgpt = {}
setting.chatgpt.DEFAULT_ROLE = 'user'
setting.chatgpt.DEFAULT_PROMPT = 'what is chatgpt'
setting.chatgpt.SLEEP_BEFORE_REQUEST_MS = 5 * 1000


export const getList = (...keyList) => {
  /* eslint-disable no-param-reassign */
  const constantList = keyList.reduce((prev, key) => {
    let value = setting
    for (const keySplit of key.split('.')) {
      value = value[keySplit]
    }
    prev[key.slice(key.lastIndexOf('.') + 1)] = value
    return prev
  }, {})
  for (const key of keyList) {
    if (constantList[key.slice(key.lastIndexOf('.') + 1)] === undefined) {
      throw new Error(`[error] undefined setting constant: ${key}`)
    }
  }
  return constantList
}


export const getValue = (key) => {
  let value = setting
  for (const keySplit of key.split('.')) {
    value = value[keySplit]
  }
  return value
}

export default {}

