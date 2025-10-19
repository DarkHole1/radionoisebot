import { z } from "zod";

export const RawUserData = z.record(z.object({
    search_engine: z.enum([ 'shiki', 'anilist' ]),
    default_type: z.enum(['anime', 'manga', 'ranobe']).default("anime")
}))
export type RawUserData = z.infer<typeof RawUserData>