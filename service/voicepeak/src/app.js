import fs from 'fs'
import winston from 'winston'
import dotenv from 'dotenv'

import * as lib from './lib.js'
import * as setting from './setting.js'

const asocial = { setting, lib, }
const a = asocial

const init = () => {
  dotenv.config()
  setting.init({ env: process.env })
  lib.init({ winston })

  const { SERVICE_NAME } = a.setting.getList('env.SERVICE_NAME')
  lib.monkeyPatch({ SERVICE_NAME })

  logger.info(`init done`)
}

const main = async () => {
  a.app.init()
  fs.writeFileSync('/tmp/setup.done', '0')
  logger.info(`start`)
}

const app = {
  init,
  main,
}
asocial.app = app

a.app.main()

export default app

