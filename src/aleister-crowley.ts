import axios from "axios"
import FormData from 'form-data'
import { Router } from "express"
import { Composer } from "grammy"
import { config } from "./config"
import { RawTokenResponse } from "./models/token-response"

export const aleister = new Composer
export const treeDiagram = Router()

treeDiagram.get('/oauth', async (req, res) => {
    if (!req.query.code) {
        return res.redirect('/')
    }
    if (!req.query.id) {
        return res.redirect('/wrong.html')
    }

    const form = new FormData();
    form.append('grant_type', 'authorization_code')
    form.append('client_id', config.shiki.client_id)
    form.append('client_secret', config.shiki.client_secret)
    form.append('code', req.query.code)
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
    if(!parsed.success) {
        return res.redirect('/wrong.html')
    }
    
    // TODO
})