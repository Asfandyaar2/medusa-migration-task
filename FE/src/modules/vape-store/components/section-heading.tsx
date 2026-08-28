type SectionHeadingProps = {
  eyebrow: string
  title: string
  description?: string
  align?: "left" | "center"
  tone?: "dark" | "light"
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left"
  const eyebrowColor = tone === "dark" ? "text-brand-sky" : "text-brand-navy"
  const titleColor = tone === "dark" ? "text-white" : "text-brand-navy"
  const descriptionColor = tone === "dark" ? "text-white/70" : "text-grey-60"

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      <p
        className={`text-xs font-bold uppercase tracking-[0.3em] ${eyebrowColor}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-2 font-display text-3xl font-bold uppercase leading-tight tracking-tight ${titleColor} small:text-4xl`}
      >
        {title}
      </h2>
      {description && (
        <p className={`mt-3 text-sm leading-relaxed ${descriptionColor}`}>
          {description}
        </p>
      )}
    </div>
  )
}
