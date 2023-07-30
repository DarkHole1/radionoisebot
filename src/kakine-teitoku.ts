import { fmt, code } from '@grammyjs/parse-mode'
import { Composer } from 'grammy'

export const kakine = new Composer

const greeting = fmt
    `Привет! Это Мисака-бот или Радиошум. Я умею искать аниме по названию. Просто попробуй написать в поле сообщения ${code('@radionoisebot магический индекс')} и у тебя будет список аниме, что я нашла.

В качестве поискового движка у меня используется поиск от Шикимори, так что я могу искать и по русским названиям. А ещё я умею искать по манге и ранобэ; для этого напиши в начале запроса ${code('m/')} или ${code('м/')} для поиска по манге и ${code('r/')} или ${code('р/')} для поиска по ранобэ. Если по каким-то причинам я решила, что вам нужно не аниме, тогда используйте ${code('a/')} или ${code('а/')} в начале для поиска по аниме.

Немного примеров:
${code('@radionoisebot м/научный рейлган')} - ищет мангу с названием "научный рейлган"
${code('@radionoisebot r/магический индекс')} - ищет ранобэ с названием "магический индекс"
${code('@radionoisebot a/m/anga')} - ищет аниме с названием "m/anga"

И последняя функция, которую я могу сделать: быстрое добавление в запланированное. Для этого надо сначала войти через кнопочку /login, а потом выбрать любимую систему (пока что я поддерживаю только Шикимори и АниЛист) и войти там. После чего можете нажимать все кнопки и быстренько добавлять к себе в запланированное.`

kakine.command('start').filter(
    ctx => ctx.match == '',
    ctx => ctx.reply(greeting.toString(), {
        entities: greeting.entities
    })
)