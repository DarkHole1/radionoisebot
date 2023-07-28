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
    if (!req.query.id || typeof req.query.id != 'string' || !req.query.type || typeof req.query.type != 'string') {
        return res.redirect('/wrong.html')
    }

    const { id, code, type } = req.query
    const realType: aogami.SupportedAPI = type == 'anilist' ? 'anilist' : 'shiki'
    console.log('Get code %s %s %s', id, code, type)
    const token = await aogami.getToken({
        type: realType,
        id: parseInt(id),
        redirect_uri: getRedirectURI(parseInt(id), realType),
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
        reply_markup: new InlineKeyboard().url('Shikimori', aogami.getOAuthURL({
            type: 'shiki',
            redirect_uri: getRedirectURI(ctx.from!.id, 'shiki')
        }).toString()).url('Anilist', aogami.getOAuthURL({
            type: 'anilist',
            redirect_uri: getRedirectURI(ctx.from!.id, 'anilist')
        }).toString())
    })
)

function getRedirectURI(id: number, type: aogami.SupportedAPI) {
    let result = new URL(config.server.oauth)
    result.searchParams.append('id', id.toString())
    result.searchParams.append('type', type)
    return result
}
