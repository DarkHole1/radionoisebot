import axios from "axios"
import FormData from 'form-data'
import { AnimesGetResponse, AnimeShort, API, APIOptions, MangasGetResponse, MangaShort } from "shikimori"
import { config } from "../config"
import { RawTokenResponse } from "../models/token-response"
import { ContentType, IAuthorizedAPI, IUnauthorizedAPI, OAuthToken, SearchParams, SearchResult } from "./types"

const SHIKIMORI_URL = 'https://shikimori.one'
const SHIKIMORI_GRAPHQL_URL = `${SHIKIMORI_URL}/api/graphql`

const defaultOptions: APIOptions = {
    baseURL: 'https://shikimori.one/api',
    userAgent: config.shiki.name,
    axios: {
        headers: { "Accept-Encoding": "*" }
    }
}

const searchAnimeQuery = `query($search: String, $page: PositiveInt, $limit: PositiveInt) {
  animes(search: $search, page: $page, limit: $limit) {
    id
    name
    russian
    url
    externalLinks {
      kind
      url
    }
    poster {
      originalUrl
      previewAltUrl
    }
    fansubbers
    fandubbers
  }
}`

async function makeAPICall(params: { query: string, variables?: unknown }) {
    const res = await axios.post(SHIKIMORI_GRAPHQL_URL, JSON.stringify(params), {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        validateStatus: _status => true
    })
    return res.data
}

type ShikimoriSearchParams = {
    search: string,
    page: number,
    limit: number
}
type SimpeAnime = {
    id: number,
    name: string,
    russian: string,
    url: string,
    image: {
        original?: string
        preview?: string
    },
    externalLinks?: Map<string, string>
}
type SimpleAnimesResponse = SimpeAnime[]

async function searchAnime(params: ShikimoriSearchParams): Promise<SimpleAnimesResponse> {
    const res = await makeAPICall({
        query: searchAnimeQuery,
        variables: params
    })

    if ('errors' in res) {
        console.error('An error occured %o', res.errors)
    }

    return (res.data?.animes ?? []).map((anime: any) => {
        const externalLinks = new Map(anime.externalLinks.map((link: any) => [link.kind, link.url]))
        if (anime.fandubbers?.includes('Crunchyroll') || anime.fansubbers?.includes('Crunchyroll')) {
            externalLinks.set('crunchyroll', `${config.server.resolve}/${anime.id}?from=shiki&to=crunchyroll`)
        }
        return {
            id: anime.id,
            name: anime.name,
            russian: anime.russian,
            url: anime.url,
            image: {
                original: anime.poster.originalUrl,
                preview: anime.poster.previewAltUrl
            },
            externalLinks: externalLinks
        }
    })
}

class UnauthorizedAPI implements IUnauthorizedAPI {
    private shiki: API

    type = 'shiki'

    constructor() {
        console.log('creating uapi')
        this.shiki = new API(defaultOptions)
        console.log(defaultOptions)
        console.log(this.shiki.request)
    }

    async search({ query, type, page }: SearchParams): Promise<SearchResult[]> {
        let results: (AnimesGetResponse | MangasGetResponse | SimpleAnimesResponse)
        const args = {
            search: query,
            limit: 10,
            page
        }

        switch (type) {
            case 'anime':
                // results = await this.shiki.animes.get(args)
                results = await searchAnime(args)
                break
            case 'manga':
                results = await this.shiki.mangas.get(args)
                break
            case 'ranobe':
                results = await this.shiki.ranobe.get(args)
                break
        }

        // Prevents extensive caching
        const daysFromStart = Math.floor(Date.now() / 1000 / 60 / 60 / 24)
        const adaptedResults = results.map((res): SearchResult => {
            return {
                id: res.id.toString(),
                image: getAbsoluteImage(res),
                mainTitle: res.name,
                secondaryTitle: res.russian,
                url: new URL(res.url, SHIKIMORI_URL).toString(),
                previewUrl: `http://cdn.anime-recommend.ru/previews/${type == 'anime' ? '' : 'manga/'}${res.id}.jpg?${daysFromStart}`,
                externalLinks: 'externalLinks' in res ? res.externalLinks : undefined
            }
        })
        return adaptedResults
    }
}

class AuthorizedAPI implements IAuthorizedAPI {
    private shiki: API

    constructor(token: string) {
        this.shiki = new API({
            token, ...defaultOptions
        })
    }

    async hasTitle({ type, id }: { type: ContentType; id: number }): Promise<boolean> {
        const me = await this.shiki.users.whoami()
        if (!me) {
            throw new Error('Login error')
        }

        let rates = await this.shiki.userRates.get({
            user_id: me.id,
            target_type: type == 'anime' ? 'Anime' : 'Manga',
            target_id: id
        })

        return rates.length != 0
    }

    async addPlanned({ id, type }: { type: ContentType; id: number }): Promise<void> {
        const me = await this.shiki.users.whoami()
        if (!me) {
            throw new Error('Login error')
        }

        await this.shiki.userRates.create({
            target_id: id,
            target_type: type == 'anime' ? 'Anime' : 'Manga',
            user_id: me.id,
            status: 'planned'
        })
    }
}

export function getUnauthorizedAPI(): IUnauthorizedAPI {
    return new UnauthorizedAPI()
}

export async function getAuthorizedAPI(token: OAuthToken): Promise<{ api: IAuthorizedAPI | null, token: OAuthToken | null }> {
    const now = Date.now() / 1000
    let newToken: OAuthToken | null = null
    let accessToken = token.access_token

    if (token.valid_until && token.valid_until < now) {
        console.log('Refreshing token')
        const form = new FormData()
        form.append('grant_type', 'refresh_token')
        form.append('client_id', config.shiki.client_id)
        form.append('client_secret', config.shiki.client_secret)
        form.append('refresh_token', token.refresh_token)

        const response = await axios.post(
            'https://shikimori.one/oauth/token',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': config.shiki.name
                },
                validateStatus: status => true
            }
        )

        if (response.status != 200) {
            console.log(response.data)
            return { api: null, token: null }
        }

        console.log('Parsing token')
        const parsed = RawTokenResponse.safeParse(response.data)
        if (!parsed.success) {
            console.log(parsed)
            return { api: null, token: null }
        }

        newToken = {
            access_token: parsed.data.access_token,
            refresh_token: parsed.data.refresh_token,
            valid_until: parsed.data.created_at + parsed.data.expires_in
        }
        accessToken = parsed.data.access_token
    }

    return {
        api: new AuthorizedAPI(accessToken),
        token: newToken
    }
}

export function getOAuthURL(redirect_uri: URL): URL {
    const result = new URL('https://shikimori.one/oauth/authorize')
    result.searchParams.append('client_id', config.shiki.client_id)
    result.searchParams.append('redirect_uri', redirect_uri.toString())
    result.searchParams.append('response_type', 'code')
    result.searchParams.append('scope', 'user_rates')
    return result
}

export async function getToken(redirect_uri: URL, code: string): Promise<OAuthToken | null> {
    const form = new FormData()
    form.append('grant_type', 'authorization_code')
    form.append('client_id', config.shiki.client_id)
    form.append('client_secret', config.shiki.client_secret)
    form.append('code', code)
    form.append('redirect_uri', redirect_uri.toString())

    console.log('Start fetching token')
    const response = await axios.post(
        'https://shikimori.one/oauth/token',
        form,
        {
            headers: {
                ...form.getHeaders(),
                'User-Agent': config.shiki.name
            },
            validateStatus: _status => true
        }
    )

    if (response.status != 200) {
        console.log(response.data)
        return null
    }

    console.log('Parsing token')
    const parsed = RawTokenResponse.safeParse(response.data)
    if (!parsed.success) {
        return null
    }

    return {
        access_token: parsed.data.access_token,
        refresh_token: parsed.data.refresh_token,
        valid_until: parsed.data.created_at + parsed.data.expires_in
    }
}

function getAbsoluteImage(anime: AnimeShort | MangaShort | SimpeAnime) {
    const original = new URL(anime.image.original ?? '/assets/globals/missing_original.jpg', SHIKIMORI_URL).toString()
    const preview = new URL(anime.image.preview ?? '/assets/globals/missing_preview.jpg', SHIKIMORI_URL).toString()
    return { original, preview }
}