import { z } from "zod"

export const RawTags = z.array(z.tuple([z.string(), z.string()]))
export type RawTags = z.infer<typeof RawTags>