import { AnimesGetResponse, AnimeShort, API, MangasGetResponse, MangaShort, SHIKIMORI_URL } from "shikimori"
import { config } from "../config"
import { IUnauthorizedAPI, SearchParams, SearchResult } from "./types"

const defaultOptions = {
    userAgent: config.shiki.name,
    axios: {
        headers: { "Accept-Encoding": "*" }
    }
}

class UnauthorizedAPI implements IUnauthorizedAPI {
    private shiki: API

    constructor() {
        this.shiki = new API(defaultOptions)
    }

    async search({ query, type, page }: SearchParams): Promise<SearchResult[]> {
        let results: (AnimesGetResponse | MangasGetResponse)
        const args = {
            search: query,
            limit: 10,
            page
        }

        switch (type) {
            case 'anime':
                results = await this.shiki.animes.get(args)
                break
            case 'manga':
                results = await this.shiki.mangas.get(args)
                break
            case 'ranobe':
                results = await this.shiki.ranobe.get(args)
                break
        }

        const adaptedResults = results.map((res): SearchResult => {
            return {
                id: res.id.toString(),
                image: getAbsoluteImage(res),
                name: res.name,
                russian: res.russian,
                url: new URL(res.url, SHIKIMORI_URL).toString()
            }
        })
        return adaptedResults
    }
}

export function getUnauthorizedAPI(): IUnauthorizedAPI {
    return new UnauthorizedAPI()
}

function getAuthorizedAPI() { }

export function getOAuthURL(redirect_uri: URL): URL {
    const result = new URL('https://shikimori.me/oauth/authorize')
    result.searchParams.append('client_id', config.shiki.client_id)
    result.searchParams.append('redirect_uri', redirect_uri.toString())
    result.searchParams.append('response_type', 'code')
    result.searchParams.append('scope', 'user_rates')
    return result
}

function getToken(url: string, token: string) { }

function getAbsoluteImage(anime: AnimeShort | MangaShort) {
    const original = new URL(anime.image.original ?? '/assets/globals/missing_original.jpg', SHIKIMORI_URL).toString()
    const preview = new URL(anime.image.preview ?? '/assets/globals/missing_preview.jpg', SHIKIMORI_URL).toString()
    return { original, preview }
}