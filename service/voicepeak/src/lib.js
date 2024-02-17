const mod = {}

export const init = ({ winston }) => {
  mod.winston = winston
}

export const createAmqpConnection = async ({
  amqplib, AMQP_USER, AMQP_PASS, AMQP_HOST, AMQP_PORT,
}) => {
  const conn = await amqplib.connect(`amqp://${AMQP_USER}:${AMQP_PASS}@${AMQP_HOST}:${AMQP_PORT}`)
  return conn
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

