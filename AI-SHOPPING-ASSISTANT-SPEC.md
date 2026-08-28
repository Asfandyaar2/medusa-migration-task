# AI Shopping Assistant — Implementation Spec

A chat widget on the storefront that answers from what the site actually contains — the
10-product catalogue, the blog, and the store's own brand/policy facts — rather than the model's
general knowledge. That grounding is what keeps it from hallucinating a product, price, or policy
that doesn't exist, and lets it respond usefully (not just "I don't know") when something genuinely
isn't on the site. Model: **`gpt-4o-mini`** (fixed per requirement; see
[Model choice](#model-choice-gpt-4o-mini) for what that trade-off actually means here).

## 1. Goal

The storefront's own hero copy already sells "no endless scrolling — just the brands worth
stocking." An assistant that turns a sentence like *"something fruity, low nicotine"* into a
direct answer is a natural extension of that same pitch, not a bolted-on gimmick. With only 10
SKUs the ceiling is modest — this won't out-perform a well-designed filter UI on a catalogue this
small — but it's cheap to build well at this scale and gives a concrete, demonstrable AI feature.

## 2. Scope

**In scope (v1):**
- Natural-language product recommendation from the existing 10-product catalogue
- Questions about published blog posts (title/excerpt-level) and basic brand/policy facts
  (what the store is, that it's a demo with no real payment, etc.)
- A graceful, redirecting answer — not a hallucination and not a dead-end refusal — when the
  question is about something genuinely outside all of the above
- Follow-up questions in the same conversation (e.g., "what about something stronger")
- Structured output so the UI renders real product cards (real price/image/link), not prose the
  model could get wrong
- Streaming replies

**Out of scope (v1):**
- Adding to cart from the chat itself (recommend → shopper clicks through to the real product
  page and uses the existing, already-optimized `AddToCartForm`)
- Persisted conversation history across sessions/devices (session-only)
- Order status / account questions (would need customer auth context — separate effort)
- Any other catalogue beyond the 10 current products (no RAG/embeddings needed at this size — see
  [§4](#4-data-grounding-reuse-what-already-exists))

## 3. Architecture

```
Shopper types a message
        │
        ▼
Chat widget (client component)
        │  POST via server action
        ▼
Server action: askShoppingAssistant()
        │
        ├─► listVapeProducts({})  ──► existing Medusa /store/vape-products route
        │        (already built, already cached — see §4)
        │
        ├─► builds system prompt + catalogue JSON + recent turns
        │
        ▼
OpenAI gpt-4o-mini (structured output, streamed)
        │
        ▼
{ reply: string, recommended_handles: string[] }
        │
        ▼
Widget renders the reply text + real ProductCard components
for each handle (looked up from the same catalogue payload —
never trusts the model for price/image)
```

Nothing new is needed on the Medusa backend. The catalogue-fetching half of this already exists
(`FE/src/lib/data/vape-products.ts:listVapeProducts`) and already returns exactly the shape
needed: id, title, handle, thumbnail, description, collection, variants with prices.

## 4. Data grounding: the whole site, not just products

Grounding the assistant in *only* the product catalogue means any question outside those 10 SKUs
(a blog topic, the brand's own tagline, the fact this is a demo store) has nothing real to answer
from — which is exactly what produces hallucination or drift. The fix isn't a bigger model, it's
feeding it more of what's actually true. This project already has three real content sources, and
none of them need a new endpoint:

| Source | Function (already exists) | How it's used |
|---|---|---|
| **Products** (10, fixed) | `listVapeProducts()` — `FE/src/lib/data/vape-products.ts` | Full catalogue, every turn (§ below — unchanged from the original plan) |
| **Blog posts** (grows over time) | `listBlogPosts()` — `FE/src/lib/data/blog.ts` | Title + excerpt + category + tags for every published post, every turn — **not** full `content` (see why below) |
| **Brand/policy facts** (fixed, tiny) | `STORE_NAME`, `STORE_TAGLINE`, `NICOTINE_WARNING` — `FE/src/lib/constants/store.ts` — plus the footer's "demo storefront, test payment only" line | A handful of always-true sentences, hardcoded into the system prompt, not fetched |

**Products** stay a full-content dump every request: 10 items is ~800–1500 tokens as JSON, trivial
for gpt-4o-mini's context window, and simpler/more accurate than retrieval at this scale (no
vector DB, no embeddings — retrieval only pays for itself once content stops fitting in context
at all).

**Blog posts get excerpts, not full articles, by default** — this project's blog is explicitly
designed to grow (`listBlogPosts` paginates, `content` per post is free-form long-form text), so
dumping every post's *full* content into every chat turn doesn't scale the way the fixed
10-product catalogue does, and burns tokens on posts the question has nothing to do with. Titles
+ excerpts are enough for the model to know *what blog content exists* and mention/link it
accurately; if a question clearly needs a specific post's full detail, that's a natural v1.1
addition — a second function the model can call, `get_blog_post(slug)` → `getBlogPostBySlug()` —
not needed for v1's scope of "recommend a product, answer it if we've written about it."

**Brand/policy facts** close the biggest drift risk: without them, a generic LLM will cheerfully
invent a shipping policy or a return window because it "sounds right" for an e-commerce store.
With the real, current copy in the prompt (including "this is a demo storefront, no real payment
is processed" — a fact a hallucinating model would never produce on its own but a real customer
absolutely needs to hear), the model has nothing to invent from *and* nothing true left to omit.

## 5. System prompt & guardrails

This is the part that actually determines quality — the model call is trivial by comparison.

```
You are the shopping assistant for Cirrus Vapor Co., a vape store selling
disposable vapes and bottled e-liquids. Everything you know about this store
is in the CONTEXT below — you have no other information about it, and you
must never present outside/general knowledge as if it were this store's fact.

Rules:
- Recommend products by flavor, format (disposable vs. e-liquid), and
  nicotine strength preference only. Never phrase a recommendation as medical
  or dosage advice ("you should use 6mg") — frame it as a taste/preference
  match only ("6mg is a middle strength if you want something noticeably
  lighter than 12mg").
- If something isn't in the CONTEXT — a product we don't carry, a policy
  we haven't published, a blog topic we haven't written about — say so
  plainly and warmly, then redirect to the closest real thing we do have.
  Never invent a policy, product, or fact to fill the gap, and never answer
  with a flat "I don't know" and nothing else. Example: asked about
  international shipping when no shipping policy exists in CONTEXT →
  "I don't have shipping details handy, but our full catalogue is at
  /collections/e-liquids and /collections/disposable-vapes if you want to
  browse while you wait to hear back" — not silence, not a made-up policy.
- Keep replies short (2-4 sentences) — this is a product-finder, not an essay.
- This is an age-restricted product. If asked anything about health effects,
  addiction risk, or usage beyond flavor/strength preference, decline briefly
  and point to the product page's own nicotine warning — don't answer as a
  health authority.
- Always return your answer via the structured tool call, never as plain text.

CONTEXT:
  Brand facts: <STORE_NAME, STORE_TAGLINE, NICOTINE_WARNING, "demo storefront,
    no real payment processed">
  Products: <trimmed JSON from listVapeProducts()>
  Blog posts: <title + excerpt + category + tags for each, from listBlogPosts()>

RECENT CONVERSATION:
<last ~6 messages, oldest first>
```

Two rules are doing the real compliance/quality work here, not just tone:
- **"Never medical advice"** — nicotine is a regulated product category; an assistant that drifts
  into dosage-style language is a real compliance exposure, not a phrasing nitpick.
- **"Everything you know is in CONTEXT"** — this is what actually suppresses hallucination and
  drift, more than any instruction to "be accurate." A model told to be accurate will still fill
  gaps with plausible-sounding general knowledge; a model told its knowledge boundary IS the
  context has nothing to fill gaps *with*. Combined with the redirect-to-something-real rule, an
  out-of-scope question gets a helpful, on-brand answer instead of either a hallucinated fact or a
  dead-end "I can't help with that."

## 6. Structured output contract

Use OpenAI's structured outputs (JSON schema mode) rather than parsing free text, so the widget
never has to guess what the model meant:

```ts
// Response shape from the model, enforced by JSON schema
type AssistantReply = {
  reply: string                  // shown as the chat bubble text
  recommended_handles: string[]  // 0-3 handles, MUST exist in the catalogue passed in
}
```

The server action validates every handle in `recommended_handles` against the catalogue it just
fetched before returning anything to the client — if the model ever hallucinates a handle, it's
silently dropped rather than rendered as a broken product card. This is the single most important
correctness check in the whole feature: it converts "the model might lie" into "the model's lies
never reach the UI."

## 7. File plan

Matching this project's existing conventions (`"use server"` files under `lib/data/`, UI under
`modules/vape-store/components/`):

| File | Purpose |
|---|---|
| `FE/src/lib/data/shopping-assistant.ts` | `"use server"` action: builds the prompt, calls OpenAI, validates handles |
| `FE/src/modules/vape-store/components/shopping-assistant/index.tsx` | Floating chat widget (client component): open/close state, message list, input |
| `FE/src/modules/vape-store/components/shopping-assistant/product-suggestion-card.tsx` | Renders one recommended product inline in the chat (reusing the existing `ProductCard`/price util, not a new price-formatting path) |

Mounted once, at the root layout (`FE/src/app/layout.tsx`) alongside the existing
`CartCountProvider`, so it's available on every page without each page wiring it in individually.

## 8. Model choice: gpt-4o-mini

Fixed per requirement, and it's actually a reasonable fit for what this task needs — worth being
precise about why, and where its ceiling is:

**Why it's enough here:** this is a narrow, closed-set task — match a stated preference against
10 known products — not open-ended reasoning. gpt-4o-mini follows a well-specified system prompt
and constrained JSON schema reliably, which is what this needs far more than deep reasoning
capability. It also natively supports structured outputs and streaming, both used above.

**Where it's weaker than a larger model:** ambiguous or multi-constraint requests ("something my
friend who likes menthol but I don't, and I want two different strengths for both of us") — a
larger model would parse that more reliably. At 10 products the blast radius of an occasional
awkward answer is small; this isn't the model to pick if the catalogue were 500+ products with
genuinely complex constraint-matching.

**Pricing:** meaningfully cheaper than gpt-4o per token (an order of magnitude, roughly) — exact
current rates should be checked at platform.openai.com/pricing before launch rather than assumed,
since OpenAI revises pricing periodically. Context per turn now includes the product catalogue,
blog excerpts, and brand facts (§4) — call it ~2-3k input tokens for a handful of blog posts,
~100-200 output tokens for a short reply. Even doubling that as the blog grows, per-conversation
cost stays a small fraction of a cent — cost is not a meaningful constraint at this store's likely
traffic volume, and won't become one until the blog is large enough to need the on-demand
full-post retrieval mentioned in §4 anyway.

## 9. Performance expectations

- **Latency:** roughly 1-3 seconds for a full reply from gpt-4o-mini at this context size —
  normal for a chat interaction (unlike the cart-mutation latency this session already fixed,
  users expect a short pause when they've just asked a question).
- **Perceived speed — use streaming.** Rendering tokens as they arrive (OpenAI's streaming API)
  makes the SAME 1-3 second response feel roughly instant, because text starts appearing within a
  few hundred ms rather than the whole reply popping in at once. This is the single highest-value
  UX lever here, for near-zero extra cost — don't ship this without it.
- **Failure mode:** if the OpenAI call errors or times out, the widget should degrade to a plain
  "Sorry, I couldn't process that — browse [E-Liquids](/collections/e-liquids) or
  [Disposables](/collections/disposable-vapes) instead" rather than a stuck spinner or silent
  failure.

## 10. Optimization checklist

- **Cache the catalogue fetch**, not just per-request — `listVapeProducts()` is already
  Next.js-cache-tagged; no extra work needed unless the catalogue changes size meaningfully later.
- **Trim conversation history** sent to the model to the last ~6 messages — keeps both latency and
  cost flat as a conversation grows, instead of resending the whole thread every turn.
- **Trim the catalogue payload** to only the fields the model needs (§4) — smaller input, faster
  first-token time, and one less place for the model to latch onto an unused field (like an `id`)
  and hallucinate with it.
- **Stream the response** (§9) — biggest perceived-speed win for the least effort.
- **Basic rate limiting** (e.g., N messages per session per minute) — cheap insurance against a
  bot or a bug turning into an OpenAI bill, independent of how cheap gpt-4o-mini is per call.

## 11. Scaling past ~30-50 items: when "send everything" stops working

The full-dump approach (§4) has one direct trade-off: **latency and cost both scale with total
catalogue+blog size**, not with how relevant any of it is to the question asked. At 10 products
and a handful of posts that's unmeasurable. At 100+ products and 100+ posts, that's a real
problem — call it 100-150 tokens per product summary and 50-100 per blog excerpt, so 100 of each
pushes the *context alone* to roughly 15-25k tokens before the model does anything, on every
single turn. That means slower time-to-first-token (a bigger prompt takes longer to process before
generation even starts) and, separately, models genuinely get less precise at picking the right
handful of items out of a long list stuffed in context, even well inside their technical context
window — a real accuracy cost, not just a speed one.

The fix isn't a bigger model or a longer timeout — it's **sending less, but the right less**,
which decouples latency from catalogue size instead of scaling it. Options, roughly in order of
"do this first":

1. **Pre-filter with what Medusa already gives you, before the LLM ever sees the catalogue.**
   Pull out obvious signals from the user's message (a flavor word, "disposable" vs "e-liquid",
   a nicotine number) and narrow the catalogue query accordingly (e.g., a `title`/`description`
   `$ilike` filter, or the existing collection-handle filtering `listVapeProducts` already
   supports) before building the prompt — send the model 10-20 plausibly-relevant products, not
   all 100+. Zero new infrastructure, reuses filtering Medusa already does for the storefront's
   own listing pages. Weakness: purely keyword-based, so it can miss a real match phrased
   differently than the catalogue text (user says "minty," product says "menthol").

2. **Semantic search via embeddings (proper retrieval), once keyword filtering isn't precise
   enough.** Generate an embedding per product/blog post (OpenAI's `text-embedding-3-small` is
   the natural pick alongside gpt-4o-mini), store them in Postgres using **`pgvector`** —
   notably, **Neon supports the pgvector extension directly**, so this doesn't mean standing up a
   separate vector database service, just enabling an extension on the database this project
   already has. On each message, embed the query and pull the top-K (e.g., 8-10) most similar
   products/posts to put in context instead of the whole catalogue. Context size then stays
   roughly constant regardless of whether the catalogue is 100 or 10,000 items — this is what
   actually decouples latency from catalogue growth, not just delays the problem.

3. **Let the model call a search function itself** (agentic retrieval) rather than always
   pre-fetching top-K before the first model call — gives the model a `search_products(query)`
   tool it invokes when it decides it needs to look something up. More precise for multi-part
   questions, at the cost of one extra round trip (which does add latency to *that* turn, even
   though the context per call stays small) — worth it once conversations get complex enough that
   a single upfront retrieval guesses wrong often.

**Recommendation for this project specifically:** don't build any of this now — it's premature at
10 products. Reach for #1 first if/when the catalogue crosses roughly 30-50 items and full-dump
starts noticeably slowing responses down; only move to #2 if keyword filtering's match quality
genuinely isn't good enough once you're there. This mirrors this project's own Railway/Neon
region fix earlier — the biggest win came from removing an actual measured bottleneck, not from
speculatively adding infrastructure before there was a real problem to point at.

## 12. How helpful this actually is

Concretely, for this specific 10-product catalogue: a shopper asking "something fruity and not
too strong" gets a direct answer citing 1-3 real products with real prices and a working link,
in about the time it'd take them to open one collection page and skim it. The value isn't
"replaces browsing" at 10 SKUs — it's a faster on-ramp for someone who doesn't want to compare
five e-liquid flavors by hand, plus a visible, working AI feature for the store. Grounding it in
the blog and brand facts too means it's also a small, honest customer-service front line: it can
correctly say "we don't have that" about a real gap (no shipping policy published, no CBD
products, whatever) instead of either making something up or going silent — which is what keeps
site-wide grounding from being "add more context and hope," and makes it an actual improvement
over a plain product-only bot. Its usefulness would scale up naturally if the catalogue or blog
grows well past what fits on one page.

## 13. Rollout / validation before launch

- [ ] Manually test ~10 representative prompts (clear product match, ambiguous request,
      off-catalogue product ask like "do you sell devices with USB-C", a real blog topic, and an
      off-topic/health question) and read every reply
- [ ] Confirm a hallucinated handle is actually dropped, not rendered (§6) — deliberately try to
      provoke one (e.g., ask for a flavor combination that doesn't exist)
- [ ] Confirm the nicotine/health-question guardrail actually declines rather than answering
- [ ] Confirm the "not on the site" guardrail (§5) actually redirects instead of inventing an
      answer — ask about something with no real answer anywhere in CONTEXT (a shipping policy,
      a product category not carried) and read the reply, don't just assume the prompt worked
- [ ] Load the widget on both the flat vape-store pages and confirm it doesn't appear on/interfere
      with the untouched `[countryCode]` tree unless deliberately added there too
- [ ] Verify streaming actually streams in production (Vercel + OpenAI streaming through a Server
      Action needs testing — don't assume local dev behavior matches deployed behavior, per this
      project's own deployment history)

## 14. Effort estimate

One server action, one prompt (the part worth iterating on), one widget component, one card
component. The prompt is genuinely the highest-effort part — expect a few iterations against the
real catalogue to get tone, brevity, and the guardrails right, more than the code itself takes.
