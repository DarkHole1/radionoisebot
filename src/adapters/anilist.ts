import axios from 'axios'
import { config } from '../config'
import { RawTokenShortResponse } from '../models/token-response'
import { ContentType, IAuthorizedAPI, IUnauthorizedAPI, OAuthToken, SearchParams, SearchResult } from './types'

const searchQuery = `query ($query: String, $type: MediaType, $page: Int, $format: MediaFormat, $format_not: MediaFormat) {
    Page(page: $page, perPage: 10) {
      pageInfo {
        total
        hasNextPage
      }
      media(type: $type, search: $query, sort: SEARCH_MATCH, format: $format, format_not: $format_not) {
        id
        idMal
        siteUrl
        coverImage {
          medium
          large
        }
        title {
          english
          romaji
        }
      }
    }
  }  
  `
const viewerQuery = `query {
    Viewer {
      id
      name
    }
  }
  `
const resolveMalIdQuery = `query ($id: Int, $type: MediaType) {
    Media(idMal: $id, type: $type) {
      id
    }
  }
  `
const searchInListQuery = `query ($id: Int, $mediaId: Int) {
    MediaList(userId: $id, mediaId: $mediaId) {
      id
      mediaId
      media {
        title {
          english
          romaji
        }
      }
    }
  }
  `
const addQuery = `mutation($mediaId: Int) {
	SaveMediaListEntry(mediaId: $mediaId, status: PLANNING) {
    id
    status
  }
}`
const ANILIST_URL = 'https://graphql.anilist.co'

async function makeAPICall(params: { query: string, variables?: unknown }, token?: string) {
    const auth = token ? { 'Authorization': 'Bearer ' + token } : {}
    const res = await axios.post(ANILIST_URL, JSON.stringify(params), {
        headers: {
            ...auth,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
    })
    return res.data
}

class UnauthorizedAPI implements IUnauthorizedAPI {
    async search(params: SearchParams): Promise<SearchResult[]> {
        const type = params.type == 'anime' ? 'ANIME' : 'MANGA'
        const format = params.type == 'anime' ? {} : (params.type == 'manga' ? { format_not: 'NOVEL' } : { format: 'NOVEL' })
        const res = await makeAPICall({
            query: searchQuery, variables: {
                query: params.query,
                page: params.page,
                type,
                ...format
            }
        })
        if ('errors' in res) {
            console.error('An error occured %o', res.errors)
        }
        const results = res.data.Page.media
        const adaptedResults = results.filter((r: any) => r.idMal != null).map((result: any) => ({
            id: result.idMal,
            image: {
                preview: result.coverImage.medium,
                original: result.coverImage.large
            },
            mainTitle: result.title.romaji,
            secondaryTitle: result.title.english ?? '',
            url: result.siteUrl
        }))
        return adaptedResults
    }
}

class AuthorizedAPI implements IAuthorizedAPI {
    private token: string

    constructor(token: string) {
        this.token = token
    }

    async resolveMalId(type: ContentType, id: number): Promise<number> {
        const anilistType = type == 'anime' ? 'ANIME' : 'MANGA'
        return (await makeAPICall({ query: resolveMalIdQuery, variables: { id, type: anilistType } })).data.Media.id
    }

    async hasTitle({ type, id }: { type: ContentType; id: number }): Promise<boolean> {
        const me = (await makeAPICall({ query: viewerQuery }, this.token)).data.Viewer
        if (!me) {
            throw new Error('Login error')
        }

        const anilistId = await this.resolveMalId(type, id)
        const res = (await makeAPICall({
            query: searchInListQuery, variables: {
                id: me.id,
                mediaId: anilistId
            }
        }, this.token)).data.MediaList

        return res != null
    }

    async addPlanned({ id, type }: { type: ContentType, id: number }): Promise<void> {
        const me = (await makeAPICall({ query: viewerQuery })).data.Viewer
        if (!me) {
            throw new Error('Login error')
        }

        const anilistId = await this.resolveMalId(type, id)
        await makeAPICall({
            query: addQuery,
            variables: {
                mediaId: anilistId
            }
        }, this.token)
    }
}

export function getUnauthorizedAPI(): IUnauthorizedAPI {
    return new UnauthorizedAPI()
}

export async function getAuthorizedAPI(token: OAuthToken): Promise<{ api: IAuthorizedAPI | null, token: OAuthToken | null }> {
    return {
        api: new AuthorizedAPI(token.access_token),
        token: null
    }
}

export function getOAuthURL(redirect_uri: URL): URL {
    const result = new URL('https://anilist.co/api/v2/oauth/authorize')
    result.searchParams.append('client_id', config.anilist.client_id)
    result.searchParams.append('redirect_uri', redirect_uri.toString())
    result.searchParams.append('response_type', 'code')
    return result
}

export async function getToken(redirect_uri: URL, code: string): Promise<OAuthToken | null> {
    const body = {
        grant_type: 'authorization_code',
        client_id: config.anilist.client_id,
        client_secret: config.anilist.client_secret,
        code: code,
        redirect_uri: redirect_uri.toString()
    }

    console.log('Start fetching token')
    const response = await axios.post(
        'https://anilist.co/api/v2/oauth/token',
        JSON.stringify(body),
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            validateStatus: _status => true
        }
    )

    if (response.status != 200) {
        console.log(response.data)
        return null
    }

    console.log('Parsing token')
    const parsed = RawTokenShortResponse.safeParse(response.data)
    if (!parsed.success) {
        return null
    }

    return {
        access_token: parsed.data.access_token
    }
}

