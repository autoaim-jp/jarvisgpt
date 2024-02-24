const setting = {}

export const init = ({ env }) => {
  const { 
    SERVICE_NAME, 
    AMQP_USER, AMQP_PASS, AMQP_HOST, AMQP_PORT,
  } = env
  setting.env = { 
    SERVICE_NAME, 
    AMQP_USER, AMQP_PASS, AMQP_HOST, AMQP_PORT,
  }
}

setting.amqp = {}
setting.amqp.VOICE_DATA_QUEUE = 'response-speak'
setting.amqp.MAX_THREAD_N = 1

setting.server = {}
setting.server.SERVER_PORT = 8000

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

