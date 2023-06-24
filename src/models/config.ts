import { z } from "zod"

export const RawConfig = z.object({
    token: z.string(),
    shiki: z.object({
        client_id: z.string(),
        client_secret: z.string()
    })
})
export type RawConfig = z.infer<typeof RawConfig>
