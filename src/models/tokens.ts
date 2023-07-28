import { z } from "zod";

export const RawTokens = z.record(z.object({
    access_token: z.string(),
    refresh_token: z.string().optional(),
    valid_until: z.number().optional()
}))
export type RawTokens = z.infer<typeof RawTokens>