export type VariantPillOption = {
  id: string
  label: string
  disabled?: boolean
}

// Real variant selection — clicking a pill selects that variant (used by
// AddToCartForm to choose which line item gets added to the cart).
export default function VariantPills({
  options,
  selectedId,
  onSelect,
}: {
  options: VariantPillOption[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => (
        <li key={option.id}>
          <button
            type="button"
            disabled={option.disabled}
            onClick={() => onSelect(option.id)}
            className={`inline-block rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              option.id === selectedId
                ? "border-brand-navy bg-brand-navy text-white"
                : "border-brand-navy/30 text-brand-navy hover:border-brand-navy"
            }`}
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  )
}
