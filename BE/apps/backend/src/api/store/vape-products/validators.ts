import { z } from "@medusajs/framework/zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const GetVapeProductsSchema = createFindParams({
  limit: 20,
  offset: 0,
}).extend({
  collection_handle: z.string().optional(),
  nicotine_strength: z.string().optional(),
})

export type GetVapeProductsQuery = z.infer<typeof GetVapeProductsSchema>
