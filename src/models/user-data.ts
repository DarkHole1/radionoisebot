import { z } from "zod";

export const RawUserData = z.record(z.object({
    search_engine: z.enum([ 'shiki', 'anilist' ])
}))
export type RawUserData = z.infer<typeof RawUserData>