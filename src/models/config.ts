import { z } from "zod"

export const RawConfig = z.object({
    token: z.string(),
    shiki: z.object({
        client_id: z.string(),
        client_secret: z.string(),
        name: z.string()
    }),
    anilist: z.object({
        client_id: z.string(),
        client_secret: z.string(),
        name: z.string()
    }),
    anime365: z.object({
        name: z.string()
    }),
    server: z.object({
        oauth: z.string(),
        resolve: z.string()
    })
})
export type RawConfig = z.infer<typeof RawConfig>
