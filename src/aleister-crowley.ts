import { Router } from "express"
import { Composer, InlineKeyboard } from "grammy"
import { config } from "./config"
import { guard, isPrivateChat, reply } from "grammy-guard"
import * as aogami from './aogami-pierce'

export const aleister = new Composer
export const treeDiagram = Router()

treeDiagram.get('/oauth/:type', (req, res) => {
    if (!req.query.id || typeof req.query.id != 'string' || !(['shiki', 'anilist']).includes(req.params.type)) {
        return res.redirect('/wrong.html')
    }
    res.cookie('type', req.params.type)
    res.cookie('id', req.query.id)
    return res.redirect(aogami.getOAuthURL({
        type: req.params.type as aogami.SupportedAPI,
        redirect_uri: getRedirectURI()
    }).toString())
})

treeDiagram.get('/oauth', async (req, res) => {
    if (!req.query.code || typeof req.query.code != 'string') {
        return res.redirect('/')
    }
    if (!req.cookies.id || typeof req.cookies.id != 'string' || !req.query.type || typeof req.query.type != 'string') {
        return res.redirect('/wrong.html')
    }

    const { id, code, type } = req.cookies
    const realType: aogami.SupportedAPI = type == 'anilist' ? 'anilist' : 'shiki'
    console.log('Get code %s %s %s', id, code, type)
    const token = await aogami.getToken({
        type: realType,
        id: parseInt(id),
        redirect_uri: getRedirectURI(),
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
        reply_markup: new InlineKeyboard()
            .url('Shikimori', getLoginURI('shiki', ctx.from!.id).toString())
            .url('Anilist', getRedirectURI('anilist', ctx.from!.id).toString())
    })
)

function getRedirectURI() {
    let result = new URL(config.server.oauth)
    return result
}

function getLoginURI(type: aogami.SupportedAPI, id: number) {
    const result = new URL(config.server.oauth)
    result.pathname += '/' + type
    result.searchParams.append('id', id.toString())
    return result
}