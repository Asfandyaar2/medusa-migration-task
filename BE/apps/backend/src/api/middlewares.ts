import { defineMiddlewares, validateAndTransformQuery } from "@medusajs/framework/http"
import { GetVapeProductsSchema } from "./store/vape-products/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/vape-products",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetVapeProductsSchema, {
          defaults: [
            "id",
            "title",
            "handle",
            "thumbnail",
            "description",
            "collection.id",
            "collection.handle",
            "variants.id",
            "variants.title",
            "variants.sku",
          ],
          isList: true,
        }),
      ],
    },
  ],
})
