import fs from 'fs'
import winston from 'winston'
import dotenv from 'dotenv'
import amqplib from 'amqplib'
import express from 'express'
import http from 'http'
import { spawn } from 'child_process'

import * as setting from './setting.js'
import * as core from './core.js'
import * as input from './input.js'
import * as action from './action.js'
import * as lib from './lib.js'

const asocial = { setting, core, input, action, lib, }
const a = asocial

const init = async () => {
  dotenv.config()
  a.setting.init({ env: process.env })
  a.lib.init({ winston, spawn })
  a.input.init({ fs })

  const { SERVICE_NAME } = a.setting.getList('env.SERVICE_NAME')
  lib.monkeyPatch({ SERVICE_NAME })

  const {
    AMQP_USER, AMQP_PASS, AMQP_HOST, AMQP_PORT,
  } = a.setting.getList('env.AMQP_USER', 'env.AMQP_PASS', 'env.AMQP_HOST', 'env.AMQP_PORT')
  const amqpConnection = await a.lib.createAmqpConnection({
    amqplib, AMQP_USER, AMQP_PASS, AMQP_HOST, AMQP_PORT,
  })
  await core.init({
    setting, input, lib, amqpConnection, fs
  })

  logger.info(`init done`)
}

const startWebServer = () => {
  const expressApp = express()
  expressApp.disable('x-powered-by')

  const { handleFileRequest } = a.core
  expressApp.get('/', a.action.getFileHandler({ handleFileRequest }))

  const server = http.createServer(expressApp)
  const { SERVER_PORT } = a.setting.getList('server.SERVER_PORT')
  server.listen(SERVER_PORT, () => {
    logger.info(`Listen to: ${SERVER_PORT}`)
  })
}

const main = async () => {
  await a.app.init()
  a.core.startConsumer()
  a.app.startWebServer()
  fs.writeFileSync('/tmp/setup.done', '0')
  logger.info(`start`)
}

const app = {
  init,
  main,
  startWebServer,
}
asocial.app = app

a.app.main()

export default app

