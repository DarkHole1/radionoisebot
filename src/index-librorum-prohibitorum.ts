import { Bot, InlineKeyboard } from "grammy"
import { AnimeShort, API, SHIKIMORI_URL } from "shikimori"
import { aleister, getAuthorizedAPI, loggedIn, treeDiagram } from "./aleister-crowley"
import { config } from "./config"
import express from 'express'
import path from 'path'

const shikimori = new API({
    userAgent: config.shiki.name,
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
            reply_markup: new InlineKeyboard().text('Добавить в запланированное', `add-planned:${anime.id}`),
            url: SHIKIMORI_URL + anime.url,
            hide_url: true
        }
    }), {
        next_offset: nextOffset
    })
})

bot.callbackQuery(/add-planned:(\d+)/, async ctx => {
    const id = ctx.from.id
    const anime_id = parseInt(ctx.match[1])

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
            target_type: 'Anime',
            target_id: anime_id
        })
        
        if (rates.length != 0) {
            await ctx.answerCallbackQuery('У вас уже есть это аниме в списке')
            return
        }

        await shiki.userRates.create({
            target_id: anime_id,
            target_type: 'Anime',
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

bot.use(aleister)

const app = express()
app.use(treeDiagram)
app.use(express.static(path.resolve('static')))

app.listen(9086)
bot.start()

function getAbsoluteImage(anime: AnimeShort) {
    const original = SHIKIMORI_URL + (anime.image.original ?? '/assets/globals/missing_original.jpg')
    const preview = SHIKIMORI_URL + (anime.image.preview ?? '/assets/globals/missing_preview.jpg')
    return { original, preview }
}