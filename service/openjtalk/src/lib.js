const mod = {}

export const init = ({ winston, spawn }) => {
  mod.winston = winston
  mod.spawn = spawn
}

export const createAmqpConnection = async ({
  amqplib, AMQP_USER, AMQP_PASS, AMQP_HOST, AMQP_PORT,
}) => {
  let conn = null
  while (conn === null) {
    try {
      conn = await amqplib.connect(`amqp://${AMQP_USER}:${AMQP_PASS}@${AMQP_HOST}:${AMQP_PORT}`)
    } catch(err) {
      logger.error({ msg: 'amqplib connection', err })
      await awaitSleep({ ms: 1 * 1000 })
    }
  }
  return conn
}

export const fork = ({ commandList, outputList, isShell }) => {
  return new Promise((resolve, reject) => {
    const proc = mod.spawn(commandList[0], commandList.slice(1), { shell: isShell, })
    logger.info({ msg: 'start: spawn', commandList })

    proc.stderr.on('data', (err) => {
      logger.info({ msg: 'stderr:', err: err.toString() })
    })
    proc.stdout.on('data', (data) => {
      logger.info('stdout:', data.toString())
      const result = ((data || '').toString() || '').slice(0, -1).split(',')
      outputList.push(result)
    })
    proc.on('close', (code) => {
      logger.info('end: spawn', code)
      resolve()
    })
  })
}

export const awaitSleep = ({ ms }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}


const _createGlobalLogger = ({ SERVICE_NAME }) => {
  const logger = mod.winston.createLogger({
    level: 'info',
    format: mod.winston.format.json(),
    defaultMeta: { service: SERVICE_NAME },
    transports: [
      new mod.winston.transports.Console({ level: 'debug' }),
      new mod.winston.transports.File({ filename: 'log/combined.log', level: 'info' }),
    ],
  })
  return logger
}


export const monkeyPatch = ({ SERVICE_NAME }) => {
  global.logger = _createGlobalLogger({ SERVICE_NAME })
}


export default {}

