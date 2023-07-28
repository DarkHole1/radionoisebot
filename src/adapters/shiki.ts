import { AnimesGetResponse, AnimeShort, API, MangasGetResponse, MangaShort, SHIKIMORI_URL } from "shikimori"
import { config } from "../config"

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
        switch (type) {
            case 'anime':
                results = await this.shiki.animes.get({
                    search: query,
                    limit: 10,
                    page
                })
                break
            case 'manga':
                results = await this.shiki.mangas.get({
                    search: query,
                    limit: 10,
                    page
                })
                break
            case 'ranobe':
                results = await this.shiki.ranobe.get({
                    search: query,
                    limit: 10,
                    page
                })
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
function getOAuthURL(base: URL) { }
function getToken(url: string, token: string) { }

function getAbsoluteImage(anime: AnimeShort | MangaShort) {
    const original = new URL(anime.image.original ?? '/assets/globals/missing_original.jpg', SHIKIMORI_URL).toString()
    const preview = new URL(anime.image.preview ?? '/assets/globals/missing_preview.jpg', SHIKIMORI_URL).toString()
    return { original, preview }
}