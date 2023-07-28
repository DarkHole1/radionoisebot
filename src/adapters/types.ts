export type ContentType = 'anime' | 'manga' | 'ranobe'

// Unauthorized API types
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

// Authorized API types
export interface IAuthorizedAPI { }
export type GetAuthorizedAPI = () => IAuthorizedAPI

export type getOAuthURL = (redirect_uri: URL) => URL