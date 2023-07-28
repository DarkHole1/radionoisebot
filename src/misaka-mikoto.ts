import { Composer, InlineKeyboard } from "grammy"
import * as shiki from './adapters/shiki'
import * as anilist from './adapters/anilist'
import * as aogami from './aogami-pierce'
import { ContentType } from "./adapters/types"

export const misaka = new Composer()
const shikimori = anilist.getUnauthorizedAPI()
// const shikimori = shiki.getUnauthorizedAPI()

misaka.on('inline_query', async ctx => {
    let query = ctx.inlineQuery.query
    const offset = ctx.inlineQuery.offset
    console.log('get query "%s" with offset "%s"', query, offset)

    let searchType: ContentType = 'anime'
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
        title: result.mainTitle,
        description: result.secondaryTitle,
        input_message_content: {
            message_text: `${result.mainTitle} / ${result.secondaryTitle}\n${result.url}`
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
    const saveType = parseSaveType(ctx.match[1])
    const taretType = saveType == 'anime' ? 'Anime' : 'Manga'
    const translate = saveType == 'anime' ? 'аниме' : (saveType == 'manga') ? 'манга' : 'ранобэ'
    const that = saveType == 'manga' ? 'эта' : 'это'
    const anime_id = parseInt(ctx.match[2])

    const shiki = await aogami.getAuthorizedAPI({ type: 'shiki', id })
    if (!shiki) {
        await ctx.answerCallbackQuery('Кажись ваш аккаунт супер не присоединён к шикимори')
        return
    }

    try {
        if (await shiki.hasTitle({ type: saveType, id: anime_id })) {
            await ctx.answerCallbackQuery(`У вас уже есть ${that} ${translate} в списке`)
            return
        }

        await shiki.addPlanned({
            type: saveType, id: anime_id
        })

        await ctx.answerCallbackQuery('Успешно добавили в список :3')
        return
    } catch (e) {
        console.error(e)
    }
    await ctx.answerCallbackQuery('Что-то пошло не так')
})

function parseSaveType(match?: string): ContentType {
    if (!match || match == 'a') {
        return 'anime'
    }

    if (match == 'm') {
        return "manga"
    }

    return 'ranobe'
}