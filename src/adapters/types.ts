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
    mainTitle: string,
    secondaryTitle: string,
    url: string,
    previewUrl?: string
}

export interface IUnauthorizedAPI {
    search(params: SearchParams): Promise<SearchResult[]>
}
export type GetUnauthorizedAPI = () => IUnauthorizedAPI

// Authorized API types
export interface IAuthorizedAPI {
    hasTitle(params: { type: ContentType, id: number }): Promise<boolean>
    addPlanned(params: { type: ContentType, id: number }): Promise<void>
}
export type GetAuthorizedAPI = (token: OAuthToken) => Promise<{ api: IAuthorizedAPI | null, token: OAuthToken | null }>

export type GetOAuthURL = (redirect_uri: URL) => URL

export type OAuthToken = {
    access_token: string
    refresh_token?: string,
    valid_until?: number
}
export type GetToken = (redirect_uri: URL, code: string) => Promise<OAuthToken | null>