# Fruit Cart

A single-page, vanilla JavaScript fruit shop. Browse seasonal produce, add items to a client-side cart, check out with a simulated UPI/QR payment flow, leave reviews, track orders and browse three recipes. All state is stored in `localStorage` — there is no build step, no server and no database. To run it, just open `frontend/src/index.html` in a browser.

## What's inside

| Path | Role |
| --- | --- |
| `frontend/src/index.html` | Home page: hero, trust strip, product catalog, how it works, deals, recipes, sustainability, FAQ, contact and footer. |
| `frontend/src/products.js` | Product catalog — 50 fruits across 8 categories (Berries, Citrus, Stone Fruits, Tropical, Melons, Grapes, Apples & Pears, Dried & Exotic), each with price, unit, tags and Unsplash photos. |
| `frontend/src/recipes.js` | Recipe library — three full recipes (Mango Lassi, Berry Smoothie Bowl, Citrus & Herb Salad) with ingredients, steps and tips. |
| `frontend/src/script.js` | All behaviour: product listing, search, sort, view toggle, cart, reviews, checkout, orders, login, newsletter, theme and scrollspy. |
| `frontend/src/style.css` | The entire visual design: dark/light themes, hero, product cards, cart drawer, checkout, order tracker, modals, responsive layout and scrollbars. |
| `frontend/src/recipe.html` | Recipe detail page rendered by `?recipe=<id>` (see the `RECIPES` ids in `recipes.js`). |
| `frontend/assets/*` | Background images for the hero orb and the about cut-open fruit. |

## Features

- **Shop** — filter by category, search by name, sort by featured/price/rating, switch between grid and list views, and load more products in batches.
- **Ripeness picker** — choose "Ready now" or "Ripe in 2 days" per item before adding it to the cart.
- **Cart** — a persistent drawer that tracks line items (with ripeness), shows a free-delivery progress bar (threshold ₹999), supports quantity steps and removal, and syncs to `localStorage`.
- **Product detail** — tap any card to open a modal with a description, quantity stepper, ripeness selector, review list, and the ability to post or edit reviews.
- **Checkout** — simulated full checkout with UPI QR, Google Pay, Paytm, card and cash-on-delivery methods; mock order history with an auto-advancing tracking timeline.
- **Reviews** — user reviews are stored in `localStorage`; every product also gets seeded deterministic reviews.
- **Recipes** — three static recipes rendered from `recipes.js`; open the full recipe page with a shareable `?recipe=` link.
- **Order history** — orders are persisted to `localStorage` with a staged tracking UI (placed → packed → out for delivery → delivered), auto-advancing by elapsed time.
- **Auth** — a lightweight demo login that stores a mock user in `localStorage`; the orders panel shows up only when signed in.
- **Newsletter** — footer signup that shows a confirmation message without sending email anywhere.
- **Light/dark theme** — persisted to `localStorage`; falls back to the OS preference on first visit.

## Structure

- `index.html` — the storefront, all sections in one page.
- `recipe.html` — full recipe view.
- `products.js` — the `PRODUCTS` array (50 items).
- `recipes.js` — the `RECIPES` array (3 items) plus a per-page dark-mode toggle shared with the main page.
- `script.js` — the application logic (DOMContentLoaded entry point).
- `style.css` — all CSS.

## Running locally

This is a static site, so there is no build or install step. Either:

1. Open `frontend/src/index.html` directly in a browser (double-click it, or drag it into a tab), **or**
2. Serve the `frontend/src` folder with any static server, for example:

   ```bash
   npx serve frontend/src
   # or
   python3 -m http.server 8000 -d frontend/src
   # then visit http://localhost:8000
   ```

The bundled Unsplash images load from third-party URLs, so the site needs an internet connection to show photos. Everything else — cart, reviews, orders, theme and newsletter — works fully offline.

## Key implementation notes

- There is no backend. Payment is simulated via UPI deep links to the store's own VPA (`jumailyousuf@gmail.com`); the QR is rendered from the same link. Placing an order just creates a mock order record.
- Product prices are stored per unit (per kg or per 100 g); per-100 g premium picks show an inline tooltip.
- The per-100 g tooltip and all show-toast/toast container targets must exist in the DOM for the corresponding features to work. The pages reference these elements via `document.getElementById`; missing elements are guarded with optional chaining / null checks.
- The `?recipe=` query param drives recipe rendering on `recipe.html`; missing recipes show a "Recipe not found" state.
- Reviews, cart and orders are all plain `localStorage` keys: `fruitcart_reviews`, `fruitcart_cart`, `fruitcart_orders`, `fruitcart_user` and `fruit-theme`.

## Files to keep in sync

- Adding a new product? Add one object to the `PRODUCTS` array in `products.js`, with a category matching a `data-category` rule in `style.css` (else the card header band gets the default colour).
- Adding a new recipe? Add a `RECIPES` entry with a unique `id` (used by `?recipe=<id>`) and make sure `recipe.html` shows the card on the homepage.
- Adding a new category? It will automatically appear as a chip and a nav dropdown option because `script.js` derives categories from `PRODUCTS` at runtime.
