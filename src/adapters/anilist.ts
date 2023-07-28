import axios from 'axios'
import { IUnauthorizedAPI, SearchParams, SearchResult } from './types'

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

const ANILIST_URL = 'https://graphql.anilist.co'

async function makeAPICall(params: { query: string, variables?: unknown }) {
    const res = await axios.post(ANILIST_URL, JSON.stringify(params), {
        headers: {
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

export function getUnauthorizedAPI(): IUnauthorizedAPI {
    return new UnauthorizedAPI()
}