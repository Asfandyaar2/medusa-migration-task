import { z } from "@medusajs/framework/zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const GetVapeProductsSchema = createFindParams({
  limit: 20,
  offset: 0,
})
  .extend({
    collection_handle: z.string().optional(),
    nicotine_strength: z.string().optional(),
  })
  // createFindParams coerces limit/offset to numbers but doesn't reject
  // negative ones, which otherwise reach the query builder and 500 instead
  // of failing validation.
  .refine((data) => data.limit === undefined || data.limit >= 0, {
    message: "limit must be >= 0",
    path: ["limit"],
  })
  .refine((data) => data.offset === undefined || data.offset >= 0, {
    message: "offset must be >= 0",
    path: ["offset"],
  })

export type GetVapeProductsQuery = z.infer<typeof GetVapeProductsSchema>
