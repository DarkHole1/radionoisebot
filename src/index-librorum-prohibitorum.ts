import { Bot, GrammyError, HttpError } from "grammy"
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

bot.catch((err) => {
    const ctx = err.ctx
    console.error(`Error while handling update ${ctx.update.update_id}:`)
    const e = err.error
    if (e instanceof GrammyError) {
        console.error("Error in request:", e.description)
    } else if (e instanceof HttpError) {
        console.error("Could not contact Telegram:", e)
    } else {
        console.error("Unknown error:", e)
    }
})

const app = express()
app.use(treeDiagram)
app.use(express.static(path.resolve('static')))

app.listen(9086)
bot.start()

