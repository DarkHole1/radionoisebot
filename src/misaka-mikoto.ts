import { Composer, InlineKeyboard } from "grammy"
import { AnimeShort, MangaShort, SHIKIMORI_URL } from "shikimori"
import { getAuthorizedAPI, loggedIn } from "./aleister-crowley"
import * as shiki from './adapters/shiki'

export const misaka = new Composer()
const shikimori = shiki.getUnauthorizedAPI()
type SearchType = 'anime' | 'manga' | 'ranobe'

misaka.on('inline_query', async ctx => {
    let query = ctx.inlineQuery.query
    const offset = ctx.inlineQuery.offset
    console.log('get query "%s" with offset "%s"', query, offset)

    let searchType: SearchType = 'anime'
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
            button: !loggedIn(ctx.from.id) ? {
                text: "Войти в шики",
                start_parameter: "shiki"
            } : undefined,
            cache_time: 0
        })
        return
    }


    const page = Number(offset) || 1
    const results = await shikimori.search({
        type: searchType,
        query,
        page
    })
    // const results = await getSearchResults(searchType, query, page)

    const nextOffset = results.length > 0 ? (page + 1).toString() : ''
    await ctx.answerInlineQuery(results.map(result => ({
        type: 'article',
        id: result.id,
        thumbnail_url: result.image.preview,
        thumbnail_width: 120,
        thumbnail_height: 180,
        title: result.name,
        description: result.russian,
        input_message_content: {
            message_text: `${result.name} / ${result.russian}\n${result.url}`
        },
        reply_markup: new InlineKeyboard().text('Добавить в запланированное', `add-planned:${searchType[0]}:${result.id}`),
        url: result.url,
        hide_url: true
    }
    )), {
        next_offset: nextOffset
    })
})

misaka.callbackQuery(/add-planned:(?:(a|m|r):)?(\d+)/, async ctx => {
    const id = ctx.from.id
    const saveType: SearchType = parseSaveType(ctx.match[1])
    const taretType = saveType == 'anime' ? 'Anime' : 'Manga'
    const translate = saveType == 'anime' ? 'аниме' : (saveType == 'manga') ? 'манга' : 'ранобэ'
    const that = saveType == 'manga' ? 'эта' : 'это'
    const anime_id = parseInt(ctx.match[2])

    const shiki = await getAuthorizedAPI(id)
    if (!shiki) {
        await ctx.answerCallbackQuery('Кажись ваш аккаунт супер не присоединён к шикимори')
        return
    }

    try {
        const me = await shiki.users.whoami()
        if (!me) {
            await ctx.answerCallbackQuery('Кажись ваш аккаунт супер не присоединён к шикимори')
            return
        }

        let rates = await shiki.userRates.get({
            user_id: me.id,
            target_type: taretType,
            target_id: anime_id
        })

        if (rates.length != 0) {
            await ctx.answerCallbackQuery(`У вас уже есть ${that} ${translate} в списке`)
            return
        }

        await shiki.userRates.create({
            target_id: anime_id,
            target_type: taretType,
            user_id: me.id,
            status: 'planned'
        })

        await ctx.answerCallbackQuery('Успешно добавили в список :3')
        return
    } catch (e) {
        console.error(e)
    }
    await ctx.answerCallbackQuery('Что-то пошло не так')
})

function getAbsoluteImage(anime: AnimeShort | MangaShort) {
    const original = SHIKIMORI_URL + (anime.image.original ?? '/assets/globals/missing_original.jpg')
    const preview = SHIKIMORI_URL + (anime.image.preview ?? '/assets/globals/missing_preview.jpg')
    return { original, preview }
}

// async function getSearchResults(searhType: SearchType, query: string, page = 1) {
//     switch (searhType) {
//         case 'anime':
//             return await shikimori.animes.get({
//                 search: query,
//                 limit: 10,
//                 page
//             })
//         case 'manga':
//             return await shikimori.mangas.get({
//                 search: query,
//                 limit: 10,
//                 page
//             })
//         case 'ranobe':
//             return await shikimori.ranobe.get({
//                 search: query,
//                 limit: 10,
//                 page
//             })
//     }
// }

function parseSaveType(match?: string): SearchType {
    if (!match || match == 'a') {
        return 'anime'
    }

    if (match == 'm') {
        return "manga"
    }

    return 'ranobe'
}