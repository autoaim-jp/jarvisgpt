import fs from 'fs'
import winston from 'winston'
import dotenv from 'dotenv'
import amqplib from 'amqplib'
import { spawn } from 'child_process'

import * as setting from './setting.js'
import * as output from './output.js'
import * as core from './core.js'
import * as lib from './lib.js'

const asocial = { setting, output, core, lib, }
const a = asocial

const init = async () => {
  dotenv.config()
  setting.init({ env: process.env })
  output.init({ fs })
  lib.init({ winston, spawn })

  const { SERVICE_NAME } = a.setting.getList('env.SERVICE_NAME')
  lib.monkeyPatch({ SERVICE_NAME })
 
  const {
    AMQP_USER, AMQP_PASS, AMQP_HOST, AMQP_PORT,
  } = a.setting.getList('env.AMQP_USER', 'env.AMQP_PASS', 'env.AMQP_HOST', 'env.AMQP_PORT')
  const amqpConnection = await a.lib.createAmqpConnection({
    amqplib, AMQP_USER, AMQP_PASS, AMQP_HOST, AMQP_PORT,
  })
  await core.init({
    setting, output, lib, amqpConnection,
  })

  core.cleanExitNodemonAfterChekingSpeakContainer()

  logger.info(`init done`)
}

const main = async () => {
  await a.app.init()
  a.core.startConsumer()
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

