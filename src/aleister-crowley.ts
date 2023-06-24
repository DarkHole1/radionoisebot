import axios from "axios"
import FormData from 'form-data'
import { Router } from "express"
import { Composer, InlineKeyboard } from "grammy"
import { config } from "./config"
import { RawTokenResponse } from "./models/token-response"
import { RawTokens } from "./models/tokens"
import { readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { guard, isPrivateChat } from "grammy-guard"

export const aleister = new Composer
export const treeDiagram = Router()

let tokens = RawTokens.parse(JSON.parse(readFileSync('data/tokens.json', { encoding: 'utf-8' })))

treeDiagram.get('/oauth', async (req, res) => {
    if (!req.query.code || typeof req.query.code != 'string') {
        return res.redirect('/')
    }
    if (!req.query.id || typeof req.query.id != 'string') {
        return res.redirect('/wrong.html')
    }

    const { id, code } = req.query
    console.log('Get code %s %s', id, code)
    const form = new FormData();
    form.append('grant_type', 'authorization_code')
    form.append('client_id', config.shiki.client_id)
    form.append('client_secret', config.shiki.client_secret)
    form.append('code', code)
    form.append('redirect_uri', 'https://radionoise.darkhole.space/oauth')

    console.log('Start fetching token')
    const response = await axios.post(
        'https://shikimori.me/oauth/token',
        form,
        {
            headers: {
                ...form.getHeaders(),
                'User-Agent': config.shiki.name
            },
            validateStatus: status => true
        }
    )

    if(response.status != 200) {
        console.log(response.data)
        return res.redirect('/wrong.html')
    }

    console.log('Parsing token')
    const parsed = RawTokenResponse.safeParse(response.data)
    if (!parsed.success) {
        return res.redirect('/wrong.html')
    }

    tokens[id] = {
        access_token: parsed.data.access_token,
        refresh_token: parsed.data.refresh_token,
        valid_until: parsed.data.created_at + parsed.data.expires_in
    }
    console.log('Saving tokens')
    await writeFile('data/tokens.json', JSON.stringify(tokens))
    return res.redirect('/success.html')
})

aleister.command(
    'shiki',
    guard(isPrivateChat),
    ctx => ctx.reply('Чтобы авторизироваться нажмите на кнопк и разрешите использовать списочек', {
        reply_markup: new InlineKeyboard().url('Кнопк', `https://shikimori.me/oauth/authorize?client_id=F6s8z_R8j53KECTldG7IWBlH9FpjlrYnRqzhgcJrGOs&redirect_uri=https%3A%2F%2Fradionoise.darkhole.space%2Foauth?id=${ctx.from!.id}&response_type=code&scope=user_rates`)
    })
)