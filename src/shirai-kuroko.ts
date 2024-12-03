import { readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { Composer } from "grammy"
import { guard, isUserHasId } from "grammy-guard"
import { makeKeyboard } from './misaka-mikoto'
import { RawTags } from "./models/tags"

export const shirai = new Composer()
const isCreatorGuard = guard(isUserHasId(369810644))

const hash2title = loadFromFile()

shirai.on('msg::hashtag')
    .filter(
        ctx => !!ctx.msg.reply_to_message,
        isCreatorGuard,
        async ctx => {
            console.log('Hmmm')
            const hashtag = ctx.entities('hashtag')[0].text
            const reply = ctx.msg.reply_to_message!
            if (!reply.entities) return
            const title = reply.entities
                .map(e => ({ ...e, text: reply.text!.substring(e.offset, e.offset + e.length) }))
                .filter(e => e.type == 'url' && e.text.match(/^https:\/\/shikimori\.(me|one)\/(anime|manga)s\//i))[0].text

            hash2title.set(hashtag, title)
            await saveToFile(hash2title)
            await ctx.reply(`Добавили связь хештега ${hashtag} с аниме ${title}`)
        }
    )


shirai.on(':is_automatic_forward', async ctx => {
    const tags = ctx.entities('hashtag').map(e => e.text)
    console.log('gotcha %s', tags)
    const animes = tags.flatMap(tag => hash2title.get(tag) ?? [])
    for (const title of animes) {
        const res = title2id(title)
        if (!res) {
            return await ctx.reply(title, {
                reply_to_message_id: ctx.msg.message_id
            })
        }
        await ctx.reply(title, {
            reply_markup: makeKeyboard(res.type, { id: res.id }),
            reply_to_message_id: ctx.msg.message_id,
            link_preview_options: {
                url: `http://cdn.anime-recommend.ru/previews/${res.id}.jpg`
            }
        })
    }
})

function loadFromFile(): Map<string, string> {
    try {
        const text = readFileSync('data/tags.json', { encoding: 'utf-8' })
        const json = JSON.parse(text)
        const parsed = RawTags.parse(json)
        return new Map(parsed)
    } catch (e) {
        return new Map()
    }
}

async function saveToFile(map: Map<string, string>) {
    const entries = Array.from(map.entries())
    const text = JSON.stringify(entries)
    await writeFile('data/tags.json', text)
}

function title2id(url: string) {
    const match = url.match(/^https:\/\/shikimori\.(?:me|one)\/(anime|manga)s\/.*?(\d+)/)
    if (!match) {
        return null
    }
    return {
        type: match[1],
        id: parseInt(match[2])
    }
}