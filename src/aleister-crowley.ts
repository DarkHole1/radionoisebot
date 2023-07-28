import { Router } from "express"
import { Composer, InlineKeyboard } from "grammy"
import { config } from "./config"
import { guard, isPrivateChat, reply } from "grammy-guard"
import * as aogami from './aogami-pierce'

export const aleister = new Composer
export const treeDiagram = Router()

treeDiagram.get('/oauth', async (req, res) => {
    if (!req.query.code || typeof req.query.code != 'string') {
        return res.redirect('/')
    }
    if (!req.query.id || typeof req.query.id != 'string') {
        return res.redirect('/wrong.html')
    }

    const { id, code } = req.query
    console.log('Get code %s %s', id, code)
    const token = await aogami.getToken({
        type: 'shiki',
        id: parseInt(id),
        redirect_uri: getRedirectURI(parseInt(id)),
        code
    })
    if (token == null) {
        return res.redirect('/wrong.html')
    }
    return res.redirect('/success.html')
})

aleister.command(
    'login',
    guard(isPrivateChat, reply('Эта команда работает только в личных сообщениях', { replyToMessage: true })),
    ctx => ctx.reply('Чтобы авторизироваться нажмите на кнопк и разрешите использовать списочек', {
        reply_markup: new InlineKeyboard().url('Кнопк', aogami.getOAuthURL({
            type: 'shiki',
            redirect_uri: getRedirectURI(ctx.from!.id)
        }).toString())
    })
)

function getRedirectURI(id: number) {
    let result = new URL(config.server.oauth)
    result.searchParams.append('id', id.toString())
    return result
}
