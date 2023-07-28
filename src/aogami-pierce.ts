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
}: SupportedAPIParam & IDParam) {
    const token = tokens[id]
    switch (type) {
        case 'shiki':
            const { api, token: newToken } = await shiki.getAuthorizedAPI(token)
            if (newToken != null) {
                tokens[id] = newToken
                await writeFile('data/tokens.json', JSON.stringify(tokens))
            }
            return api
    }
}

export function getOAuthURL({ type, redirect_uri }: SupportedAPIParam & { redirect_uri: URL }) {
    switch (type) {
        case 'shiki':
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
            tokens[id] = token
            await writeFile('data/tokens.json', JSON.stringify(tokens))
            return token
    }
}

export function loggedIn(id: number) {
    return id in tokens
}