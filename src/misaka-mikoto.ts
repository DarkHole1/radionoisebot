import { Composer, InlineKeyboard } from "grammy"
import * as aogami from './aogami-pierce'
import { ContentType } from "./adapters/types"
import { config } from './config'
import { getUserData, setUserData } from "./last-order"
import { guard, isPrivateChat, reply } from "grammy-guard"
import { z } from "zod"

export const misaka = new Composer()
const searchAPI = {
    shiki: aogami.getUnauthorizedAPI({ type: 'shiki' }),
    anilist: aogami.getUnauthorizedAPI({ type: 'anilist' })
}

misaka.on('inline_query', async ctx => {
    let query = ctx.inlineQuery.query
    const offset = ctx.inlineQuery.offset
    console.log('get query "%s" with offset "%s" from user @%s', query, offset, ctx.inlineQuery.from.username)

    const userData = getUserData({ userId: ctx.from.id })
    const searchEngine = userData.search_engine
    const defaultSearchType = userData.default_type

    let searchType: ContentType = defaultSearchType
    if (query.startsWith('m/') || query.startsWith('м/')) {
        searchType = 'manga'
        query = query.slice(2)
    } else if (query.startsWith('r/') || query.startsWith('р/')) {
        searchType = 'ranobe'
        query = query.slice(2)
    } else if (query.startsWith('a/') || query.startsWith('а/')) {
        searchType = 'anime'
        query = query.slice(2)
    }

    if (query.length == 0) {
        console.log("query is empty. stopping")
        await ctx.answerInlineQuery([], {
            next_offset: '',
            button: !aogami.loggedIn(ctx.from.id) ? {
                text: "Войти в шики",
                start_parameter: "login"
            } : undefined,
            // cache_time: 0
        })
        return
    }

    const page = Number(offset) || 1
    const results = await searchAPI[searchEngine].search({
        type: searchType,
        query,
        page
    })

    const nextOffset = results.length > 0 ? (page + 1).toString() : ''
    await ctx.answerInlineQuery(results.map(result => ({
        type: 'article',
        id: result.id,
        thumbnail_url: result.image.preview,
        thumbnail_width: 120,
        thumbnail_height: 180,
        title: result.mainTitle,
        description: result.secondaryTitle,
        input_message_content: {
            message_text: `${result.mainTitle} / ${result.secondaryTitle}\n${result.url}`,
            link_preview_options: {
                url: result.previewUrl ?? result.url
            }
        },
        reply_markup: makeKeyboard(searchType, searchAPI[searchEngine].type, result),
        url: result.url,
        hide_url: true
    }
    )), {
        next_offset: nextOffset
    })
})

misaka.callbackQuery(/add-planned:(?:(a|m|r):)?(\d+)/, async ctx => {
    const id = ctx.from.id
    const saveType = parseSaveType(ctx.match[1])
    const translate = saveType == 'anime' ? 'аниме' : (saveType == 'manga') ? 'манга' : 'ранобэ'
    const that = saveType == 'manga' ? 'эта' : 'это'
    const anime_id = parseInt(ctx.match[2])

    const authorizedAPI = await aogami.getAuthorizedAPI({ id })
    if (!authorizedAPI) {
        await ctx.answerCallbackQuery('Кажись ваш аккаунт супер не присоединён к шикимори или анилисту')
        return
    }

    try {
        if (await authorizedAPI.hasTitle({ type: saveType, id: anime_id })) {
            await ctx.answerCallbackQuery(`У вас уже есть ${that} ${translate} в списке`)
            return
        }

        await authorizedAPI.addPlanned({
            type: saveType, id: anime_id
        })

        await ctx.answerCallbackQuery('Успешно добавили в список :3')
        return
    } catch (e) {
        console.error(e)
    }
    await ctx.answerCallbackQuery('Что-то пошло не так')
})

// TODO: Split settings to another module (perhaps?)
misaka.command(
    'search_engine',
    guard(isPrivateChat, reply('Эта команда работает только в личных сообщениях', { replyToMessage: true })),
    async (ctx) => {
        if (['shiki', 'anilist'].includes(ctx.match)) {
            const userId = ctx.from!.id
            const userData = getUserData({ userId })
            await setUserData({
                userId, data: {
                    ...userData,
                    search_engine: ctx.match as any
                }
            })
            return await ctx.reply(`Успешно сменили поисковой движок!`)
        }
        await ctx.reply(`Выберите поисковой движок из списка:`, {
            reply_markup: new InlineKeyboard()
                .text('Shikimori', 'set-search-engine:shiki')
                .text('Anilist', 'set-search-engine:anilist')
        })
    }
)

misaka.callbackQuery(/set-search-engine:(shiki|anilist)/, async (ctx) => {
    try {
        const userId = ctx.from.id
        const userData = getUserData({ userId })
        await setUserData({ userId, data: { ...userData, search_engine: ctx.match[1] as any } })
        await ctx.answerCallbackQuery('Успешно сменили поисковой движок!')
        return
    } catch (e) {
        console.error(e);
    }
    await ctx.answerCallbackQuery('Что-то пошло не так')
})

misaka.command(
    'default_search',
    guard(isPrivateChat, reply('Эта команда работает только в личных сообщениях', { replyToMessage: true })),
    async (ctx) => {
        if (['anime', 'manga', 'ranobe'].includes(ctx.match)) {
            const userId = ctx.from!.id
            const userData = getUserData({ userId })
            await setUserData({
                userId, data: {
                    ...userData,
                    default_type: ctx.match as any
                }
            })
            return await ctx.reply(`Успешно сменили тип поиска по-умолчанию!`)
        }
        await ctx.reply(`Выберите, что искать по-умолчанию:`, {
            reply_markup: new InlineKeyboard()
                .text('Аниме', 'set-default-type:anime')
                .text('Мангу', 'set-default-type:manga')
                .text('Ранобэ', 'set-default-type:ranobe')
        })
    }
)

misaka.callbackQuery(/set-default-type:(anime|manga|ranobe)/, async (ctx) => {
    try {
        const userId = ctx.from.id
        const userData = getUserData({ userId })
        await setUserData({ userId, data: { ...userData, default_type: ctx.match[1] as any } })
        await ctx.answerCallbackQuery('Успешно сменили тип поиска по-умолчанию!')
        return
    } catch (e) {
        console.error(e);
    }
    await ctx.answerCallbackQuery('Что-то пошло не так')
})

export function makeKeyboard(searchType: string, searchEngine: string, result: { id: string | number, externalLinks?: Map<string, string> }): InlineKeyboard {
    const keyboard = new InlineKeyboard()
    if (searchType == 'anime') {
        keyboard
            .url('Shiki', `${config.server.resolve}/${result.id}?from=${searchEngine}&to=shiki`)
            .url('MAL', `${config.server.resolve}/${result.id}?from=${searchEngine}&to=mal`)
            .url('Anilist', `${config.server.resolve}/${result.id}?from=${searchEngine}&to=anilist`)
            .row()
    } else if (searchType == 'manga') {
        keyboard
            .url('Shiki', `${config.server.resolve}/${result.id}?from=${searchEngine}&to=shiki&manga`)
            .url('MAL', `${config.server.resolve}/${result.id}?from=${searchEngine}&to=mal&manga`)
            .url('Anilist', `${config.server.resolve}/${result.id}?from=${searchEngine}&to=anilist&manga`)
            .row()
    } else if (searchType == 'ranobe') {
        keyboard
            .url('Shiki', `${config.server.resolve}/${result.id}?from=${searchEngine}&to=shiki&manga`)
            .url('MAL', `${config.server.resolve}/${result.id}?from=${searchEngine}&to=mal&manga`)
            .url('Anilist', `${config.server.resolve}/${result.id}?from=${searchEngine}&to=anilist&manga`)
            .row()
    }
    if (result.externalLinks) {
        const knownLinks = {
            'kinopoisk': 'Кинопоиск',
            'crunchyroll': 'Crunchyroll'
        }
        for (const [key, name] of Object.entries(knownLinks)) {
            const value = result.externalLinks.get(key)
            if (value) {
                keyboard.url(name, value)
            }
        }
        keyboard.row()
    }
    keyboard.text('Добавить в запланированное', `add-planned:${searchType[0]}:${result.id}`)
    return keyboard
}

function parseSaveType(match?: string): ContentType {
    if (!match || match == 'a') {
        return 'anime'
    }

    if (match == 'm') {
        return "manga"
    }

    return 'ranobe'
}