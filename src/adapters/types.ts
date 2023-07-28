type ContentType = 'anime' | 'manga' | 'ranobe'

type SearchParams = {
    query: string,
    type: ContentType,
    page: number
}
type SearchResult = {
    id: string,
    image: {
        preview: string,
        original: string
    },
    name: string,
    russian: string,
    url: string
}

interface IUnauthorizedAPI {
    search(params: SearchParams): Promise<SearchResult[]>
}
type GetUnauthorizedAPI = () => IUnauthorizedAPI