import { Router } from 'express'
import { z } from 'zod'
import * as anilist from './adapters/anilist'
import * as anime365 from './adapters/anime365'

export const tsuchimikado = Router()

const idTypes = z.enum(['shiki', 'anilist', 'mal', 'anime365'])
const shiki2anilist = new Map<number, number>()
const anilist2shiki = new Map<number, number>()
const anime365toShiki = new Map<number, number>()
const shikiToAnime365 = new Map<number, number>()

tsuchimikado.get('/resolve/:id', async (req, res) => {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
        return res.status(404).send('¯\\_(ツ)_/¯')
    }
    const from = idTypes.catch('shiki').parse(req.query.from)
    const to = idTypes.catch('anilist').parse(req.query.to)

    let resolvedId
    if (from == to || (['shiki', 'mal'].includes(from) && ['shiki', 'mal'].includes(to))) {
        resolvedId = id
    } else if (['shiki', 'mal'].includes(from) && to == 'anilist') {
        resolvedId = shiki2anilist.get(id)
        if (!resolvedId) {
            resolvedId = await anilist.resolveMalId(id, 'anime')
            if (resolvedId) {
                shiki2anilist.set(id, resolvedId)
                anilist2shiki.set(resolvedId, id)
            }
        }
    } else if (from == 'anilist' && ['shiki', 'mal'].includes(to)) {
        resolvedId = anilist2shiki.get(id)
        if (!resolvedId) {
            resolvedId = await anilist.resolveId(id)
            if (resolvedId) {
                anilist2shiki.set(id, resolvedId)
                shiki2anilist.set(resolvedId, id)
            }
        }
    } else if(['shiki', 'mal'].includes(from) && to == 'anime365') {
        resolvedId = shikiToAnime365.get(id)
        if (!resolvedId) {
            resolvedId = await anime365.resolveMalId(id)
            if (resolvedId) {
                shikiToAnime365.set(id, resolvedId)
                anime365toShiki.set(resolvedId, id)
            }
        }
    }

    if (!resolvedId) {
        return res.status(404).send('¯\\_(ツ)_/¯')
    }

    // TODO: Resolve not animes
    if (to == 'shiki') {
        return res.redirect('https://shikimori.one/animes/' + resolvedId)
    }
    if (to == 'mal') {
        return res.redirect('https://myanimelist.net/anime/' + resolvedId)
    }
    if (to == 'anilist') {
        return res.redirect('https://anilist.co/anime/' + resolvedId)
    }
    if(to == 'anime365') {
        return res.redirect('https://anime365.ru/catalog/' + resolvedId)
    }
})