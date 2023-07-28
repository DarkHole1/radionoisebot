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
export type GetAuthorizedAPI = (token: OAuthToken) => Promise<{ api: IAuthorizedAPI | null, token: OAuthToken | null }>

export type GetOAuthURL = (redirect_uri: URL) => URL

export type OAuthToken = {
    access_token: string
    refresh_token?: string,
    valid_until?: number
}
export type GetToken = (redirect_uri: string, code: string) => Promise<OAuthToken | null>