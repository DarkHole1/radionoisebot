export type ContentType = 'anime' | 'manga' | 'ranobe'

export type SearchParams = {
    query: string,
    type: ContentType,
    page: number
}
export type SearchResult = {
    id: string,
    image: {
        preview: string,
        original: string
    },
    name: string,
    russian: string,
    url: string
}

export interface IUnauthorizedAPI {
    search(params: SearchParams): Promise<SearchResult[]>
}
export type GetUnauthorizedAPI = () => IUnauthorizedAPI