import { Router } from 'express'
import { z } from 'zod'
import * as anilist from './adapters/anilist'
import * as anime365 from './adapters/anime365'

export const tsuchimikado = Router()

const FromIdTypes = z.enum(['shiki', 'anilist', 'mal'])
type FromIdTypes = z.infer<typeof FromIdTypes>
const ToIdTypes = z.enum(['shiki', 'anilist', 'mal', 'anime365', 'crunchyroll'])
type ToIdTypes = z.infer<typeof ToIdTypes>

const cache = {
    manga: {
        shiki: {
            anilist: new Map<number, number>(),
        },
        anilist: {
            shiki: new Map<number, number>()
        }
    },
    anime: {
        shiki: {
            anilist: new Map<number, number>(),
            anime365: new Map<number, number>(),
            crunchyroll: new Map<number, string>(),
        },
        anilist: {
            shiki: new Map<number, number>(),
        },
        anime365: {
            shiki: new Map<number, number>()
        },
    }
}

const getFromCache = (from: FromIdTypes, to: ToIdTypes, category: 'anime' | 'manga', id: number) => {
    return (cache as any)[category]?.[from]?.[to]?.get(id)
}

const setToCache = (from: FromIdTypes, to: ToIdTypes, category: 'anime' | 'manga', id1: number, id2: number | string) => {
    (cache as any)[category]?.[from]?.[to]?.set(id1, id2);
    (cache as any)[category]?.[to]?.[from]?.set(id2, id1)
}

tsuchimikado.get('/resolve/:id', async (req, res) => {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
        return res.status(404).send('¯\\_(ツ)_/¯')
    }
    const from = FromIdTypes.catch('shiki').parse(req.query.from)
    const to = ToIdTypes.catch('anilist').parse(req.query.to)
    const manga = 'manga' in req.query
    const category = manga ? 'manga' : 'anime'

    let resolvedId
    if (from == to || (['shiki', 'mal'].includes(from) && ['shiki', 'mal'].includes(to))) {
        resolvedId = id
    } else if (['shiki', 'mal'].includes(from) && to == 'anilist') {
        resolvedId = getFromCache('shiki', 'anilist', category, id)
        if (!resolvedId) {
            resolvedId = await anilist.resolveMalId(id, category)
            if (resolvedId) {
                setToCache('shiki', 'anilist', category, id, resolvedId)
            }
        }
    } else if (from == 'anilist' && ['shiki', 'mal'].includes(to)) {
        resolvedId = getFromCache('anilist', 'shiki', category, id)
        if (!resolvedId) {
            resolvedId = await anilist.resolveId(id, category)
            if (resolvedId) {
                setToCache('anilist', 'shiki', category, id, resolvedId)
            }
        }
    } else if (['shiki', 'mal'].includes(from) && to == 'anime365' && !manga) {
        resolvedId = getFromCache('shiki', 'anime365', category, id)
        if (!resolvedId) {
            resolvedId = await anime365.resolveMalId(id)
            if (resolvedId) {
                setToCache('shiki', 'anime365', category, id, resolvedId)
            }
        }
    } else if (['shiki', 'mal'].includes(from) && to == 'crunchyroll' && !manga) {
        let crunchyrollUrl = getFromCache('shiki', 'crunchyroll', category, id)
        if (crunchyrollUrl) {
            return res.redirect(crunchyrollUrl)
        }
        const anilistId = await anilist.resolveMalId(id, 'anime')
        if (anilistId) {
            crunchyrollUrl = await anilist.resolveToCrunchyroll(anilistId)
            if (crunchyrollUrl) {
                setToCache('shiki', 'crunchyroll', category, id, crunchyrollUrl)
                return res.redirect(crunchyrollUrl)
            }
        }
    }

    if (!resolvedId) {
        return res.status(404).send('¯\\_(ツ)_/¯')
    }

    if (to == 'shiki') {
        return res.redirect(`https://shikimori.one/${manga ? 'mangas' : 'animes'}/${resolvedId}`)
    }
    if (to == 'mal') {
        return res.redirect(`https://myanimelist.net/${manga ? 'manga' : 'anime'}/${resolvedId}`)
    }
    if (to == 'anilist') {
        return res.redirect(`https://anilist.co/${manga ? 'manga' : 'anime'}/${resolvedId}`)
    }
    if (to == 'anime365') {
        return res.redirect(`https://anime365.ru/catalog/${resolvedId}`)
    }
})