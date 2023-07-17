import e from "express"
import { Composer } from "grammy"
import { guard, isUserHasId } from "grammy-guard"

export const shirai = new Composer()
const isCreatorGuard = guard(isUserHasId(369810644))

const hashToAnime = new Map<string, string>

shirai.on('msg::hashtag', isCreatorGuard)
    .filter(
        ctx => !!ctx.msg.reply_to_message,
        async ctx => {
            const hashtag = ctx.entities('hashtag')[0].text
            const reply = ctx.msg.reply_to_message!
            if (!reply.entities) return
            const anime = reply.entities.map(e => ({...e, text: reply.text!.substring(e.offset, e.offset + e.length)})).filter(e => e.type == 'url' && e.text.startsWith('https://shikimori.me/animes/'))[0].text
            
            hashToAnime.set(hashtag, anime)
            await ctx.reply(`Добавили связь хештега ${hashtag} с аниме ${anime}`)
        }
    )