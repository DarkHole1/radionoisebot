# Radio Noise Bot

An inline Telegram bot for searching anime, manga, and light novels by title.

[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot-blue?logo=telegram)](https://t.me/radionoisebot)

---

## Usage

In any chat, type:

```
@radionoisebot your query
```

and select a result from the inline suggestions.

### Search prefixes
- **Manga**: `m/`  
  Example: `@radionoisebot m/Toaru Majutsu no Index`
- **Light novels**: `r/`  
  Example: `@radionoisebot r/Toaru Kagaku no Railgun`

If no prefix is used, the bot searches based on your **default search type** (configurable via `/default_search`).

### Commands
- `/login` — Connect your AniList or Shikimori account to quickly add titles to your planning list.
- `/default_search` — Set your preferred default media type (anime, manga, or light novel).
- `/search_engine` — Choose your preferred search backend: **Shikimori** (default) or **AniList**.

---

## Self-Hosting

### Configuration

Create a `config.json` file with the following structure:

```json
{
  "token": "YOUR_TELEGRAM_BOT_TOKEN",
  "shiki": {
    "client_id": "SHIKIMORI_CLIENT_ID",
    "client_secret": "SHIKIMORI_CLIENT_SECRET",
    "name": "Radio Noise Bot"
  },
  "anilist": {
    "client_id": "ANILIST_CLIENT_ID",
    "client_secret": "ANILIST_CLIENT_SECRET",
    "name": "Radio Noise Bot"
  },
  "anime365": {
    "name": "Radio Noise Bot"
  },
  "server": {
    "oauth": "YOUR_OAUTH_CALLBACK_URL",
    "resolve": "YOUR_REDIRECT_ENDPOINT"
  }
}
```

> The `name` field is used in the `User-Agent` header for API requests.

### Running the Bot

```bash
yarn install
yarn run start
```

### Project Structure (for contributors)

The codebase uses thematic filenames inspired by the *Toaru* franchise:

- `index-librorum-prohibitorum.ts` — main entrypoint  
- `aleister-crowley.ts` — OAuth and login logic  
- `aogami-pierce.ts` — abstract API interface for Shikimori / AniList  
- `kakine-teitoku.ts` — `/start` command handler (currently Russian-only)  
- `last-order.ts` — user preferences (save/load)  
- `misaka-mikoto.ts` — core search logic and inline query handler  
- `shirai-kuroko.ts` — personal channel helper utilities  
- `tsuchimikado-motoharu.ts` — ID translation and proxy/redirect handler between APIs  

---

## Roadmap

- [ ] Debounce inline search requests  
- [ ] Improve Shikimori result previews  
- [ ] Add MyAnimeList (MAL) support?

---

## Thanks

- [neverlane/shikimori](https://github.com/neverlane/shikimori) — Modern ES6 Promise-based Shikimori API client 🙌