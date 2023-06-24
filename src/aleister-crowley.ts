import axios from "axios"
import FormData from 'form-data'
import { Router } from "express"
import { Composer } from "grammy"
import { config } from "./config"
import { RawTokenResponse } from "./models/token-response"
import { RawTokens } from "./models/tokens"
import { readFileSync } from "fs"
import { writeFile } from "fs/promises"

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
    const form = new FormData();
    form.append('grant_type', 'authorization_code')
    form.append('client_id', config.shiki.client_id)
    form.append('client_secret', config.shiki.client_secret)
    form.append('code', code)
    form.append('redirect_uri', 'https://radionoise.darkhole.space/oauth')

    const response = await axios.post(
        'https://shikimori.me/oauth/token',
        form,
        {
            headers: {
                ...form.getHeaders(),
                'User-Agent': config.shiki.name
            }
        }
    )

    const parsed = RawTokenResponse.safeParse(response.data)
    if (!parsed.success) {
        return res.redirect('/wrong.html')
    }

    tokens[id] = {
        access_token: parsed.data.access_token,
        refresh_token: parsed.data.refresh_token,
        valid_until: parsed.data.created_at + parsed.data.expires_in
    }
    await writeFile('data/tokens.json', JSON.stringify(tokens))
    return res.redirect('/success.html')
})