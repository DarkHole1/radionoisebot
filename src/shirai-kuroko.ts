import { readFileSync } from "fs"
import { writeFile } from "fs/promises"
import { Composer } from "grammy"
import { guard, isUserHasId } from "grammy-guard"
import { RawTags } from "./models/tags"

export const shirai = new Composer()
const isCreatorGuard = guard(isUserHasId(369810644))

const hashToAnime = loadFromFile()

shirai.on('msg::hashtag')
    .filter(
        ctx => !!ctx.msg.reply_to_message,
        isCreatorGuard,
        async ctx => {
            console.log('Hmmm')
            const hashtag = ctx.entities('hashtag')[0].text
            const reply = ctx.msg.reply_to_message!
            if (!reply.entities) return
            const anime = reply.entities.map(e => ({ ...e, text: reply.text!.substring(e.offset, e.offset + e.length) })).filter(e => e.type == 'url' && e.text.startsWith('https://shikimori.me/animes/'))[0].text

            hashToAnime.set(hashtag, anime)
            await saveToFile(hashToAnime)
            await ctx.reply(`Добавили связь хештега ${hashtag} с аниме ${anime}`)
        }
    )


shirai.on(':is_automatic_forward', async ctx => {
    const tags = ctx.entities('hashtag').map(e => e.text)
    console.log('gotcha %s', tags)
    const animes = tags.flatMap(tag => hashToAnime.get(tag) ?? [])
    if(animes.length == 0) return
    await ctx.reply(`Аниме:\n${animes.join('\n')}`, {
        reply_to_message_id: ctx.msg.message_id
    })
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