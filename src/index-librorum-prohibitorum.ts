import { Bot } from "grammy"
import { AnimeShort, API, SHIKIMORI_URL } from "shikimori"
import { config } from "./config"

const shikimori = new API({
    axios: {
        headers: { "Accept-Encoding": "*" }
    }
})
const bot = new Bot(config.token)

bot.on('inline_query', async ctx => {
    const query = ctx.inlineQuery.query
    const offset = ctx.inlineQuery.offset
    console.log('get query "%s" with offset "%s"', query, offset)
    if (query.length == 0) {
        console.log("query is empty. stopping")
        await ctx.answerInlineQuery([], {
            next_offset: ''
        })
        return
    }

    const page = Number(offset) || 1
    const animes = await shikimori.animes.get({
        search: query,
        limit: 10,
        page
    })

    const nextOffset = animes.length > 0 ? (page + 1).toString() : ''
    await ctx.answerInlineQuery(animes.map(anime => {
        const image = getAbsoluteImage(anime)
        return {
            type: 'article',
            id: anime.id.toString(),
            thumbnail_url: image.preview,
            thumbnail_width: 120,
            thumbnail_height: 180,
            title: anime.name,
            description: anime.russian,
            input_message_content: {
                message_text: anime.name + ' / ' + anime.russian + '\n' + SHIKIMORI_URL + anime.url
            },
            url: SHIKIMORI_URL + anime.url,
            hide_url: true
        }
    }), {
        next_offset: nextOffset
    })
})

bot.start()

function getAbsoluteImage(anime: AnimeShort) {
    const original = SHIKIMORI_URL + (anime.image.original ?? '/assets/globals/missing_original.jpg')
    const preview = SHIKIMORI_URL + (anime.image.preview ?? '/assets/globals/missing_preview.jpg')
    return { original, preview }
}