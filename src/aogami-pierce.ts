import { RawTokens } from "./models/tokens"
import * as shiki from './adapters/shiki'
import * as anilist from './adapters/anilist'
import { readFileSync } from 'fs'
import { writeFile } from 'fs/promises'

let tokens = RawTokens.parse(JSON.parse(readFileSync('data/tokens.json', { encoding: 'utf-8' })))

export type SupportedAPI = 'shiki' | 'anilist'
type SupportedAPIParam = {
    type: SupportedAPI
}
type IDParam = {
    id: number
}

export function getUnauthorizedAPI({ type }: SupportedAPIParam) {
    switch (type) {
        case 'shiki':
            return shiki.getUnauthorizedAPI()
        case 'anilist':
            return anilist.getUnauthorizedAPI()
    }
}

export async function getAuthorizedAPI({
    type, id
}: Partial<SupportedAPIParam> & IDParam) {
    const token = tokens[id]
    if (token.type != type) {
        return null
    }
    const realType = type ?? token.type
    switch (realType) {
        case 'shiki':
            const { api, token: newToken } = await shiki.getAuthorizedAPI(token)
            if (newToken != null) {
                tokens[id] = {
                    type: 'shiki',
                    ...newToken
                }
                await writeFile('data/tokens.json', JSON.stringify(tokens))
            }
            return api

        case 'anilist':
            const { api: api2, token: newToken2 } = await shiki.getAuthorizedAPI(token)
            if (newToken2 != null) {
                tokens[id] = {
                    type: 'anilist',
                    ...newToken2
                }
                await writeFile('data/tokens.json', JSON.stringify(tokens))
            }
            return api2
    }
}

export function getOAuthURL({ type, redirect_uri }: SupportedAPIParam & { redirect_uri: URL }) {
    switch (type) {
        case 'shiki':
            return shiki.getOAuthURL(redirect_uri)
        case 'anilist':
            return shiki.getOAuthURL(redirect_uri)
    }
}

export async function getToken({
    type, id, redirect_uri, code
}: SupportedAPIParam & IDParam & { redirect_uri: URL, code: string }) {
    switch (type) {
        case 'shiki':
            const token = await shiki.getToken(redirect_uri, code)
            if (token == null) {
                return null
            }
            tokens[id] = {
                type: 'shiki',
                ...token
            }
            await writeFile('data/tokens.json', JSON.stringify(tokens))
            return token
        case 'anilist':
            const token2 = await shiki.getToken(redirect_uri, code)
            if (token2 == null) {
                return null
            }
            tokens[id] = {
                type: 'anilist',
                ...token2
            }
            await writeFile('data/tokens.json', JSON.stringify(tokens))
            return token2
    }
}

export function loggedIn(id: number) {
    return id in tokens
}