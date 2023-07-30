import { Bot } from "grammy"
import { aleister, treeDiagram } from "./aleister-crowley"
import { config } from "./config"
import express from 'express'
import path from 'path'
import { shirai } from "./shirai-kuroko"
import { misaka } from "./misaka-mikoto"
import { kakine } from './kakine-teitoku'

const bot = new Bot(config.token)

bot.use(kakine)
bot.use(misaka)
bot.use(aleister)
bot.use(shirai)

const app = express()
app.use(treeDiagram)
app.use(express.static(path.resolve('static')))

app.listen(9086)
bot.start()

