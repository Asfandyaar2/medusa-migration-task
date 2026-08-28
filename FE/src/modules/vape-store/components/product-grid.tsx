import { ProductCardData } from "@lib/util/to-card-product"
import ProductCard from "./product-card"

export default function ProductGrid({
  products,
  className = "grid-cols-2 small:grid-cols-3 medium:grid-cols-4",
}: {
  products: ProductCardData[]
  className?: string
}) {
  return (
    <ul className={`grid gap-x-6 gap-y-8 ${className}`}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
