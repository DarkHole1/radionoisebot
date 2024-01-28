import axios from 'axios'
import { config } from '../config'

const instance = axios.create({
    baseURL: 'https://smotret-anime.online/api/',
    headers: {
        'User-Agent': config.anime365.name,
        'Accept-Encoding': '*'
    }
})

export async function resolveMalId(id: number): Promise<number | undefined> {
    const res = await instance.get('series', {
        params: {
            'myAnimeListId': id,
            'fields': 'id,myAnimeListId'
        }
    })

    // TODO: Parsing
    if(!res.data?.data || res.data.data.length != 1 || typeof res.data.data[0].id != 'number') {
        return
    }
    return res.data.data[0].id
}

export async function resolveId(id: number): Promise<number | undefined> {
    const res = await instance.get(`series/${id}`, {
        params: {
            'fields': 'id,myAnimeListId'
        }
    })

    // TODO: Parsing
    if(!res.data?.data || res.data.data.length != 1 || typeof res.data.data[0].myAnimeListId != 'number') {
        return
    }
    return res.data.data[0].myAnimeListId
}