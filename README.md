# The Hand Craft Atelier

A React storefront for handmade embroidery, with customer accounts, an admin dashboard, and Cashfree checkout. Vite builds the frontend; the `api/` directory contains the server endpoints used by Vercel.

## Local development

```sh
npm install
npm run dev
```

Copy `.env.example` to `.env` and supply the credentials needed for the features you are working on. Keep `.env` out of Git. The local product catalog remains available when Supabase is not configured. Vite serves the frontend; server endpoints need a Vercel-compatible environment.

## Source layout

- `src/main.jsx` mounts the application and loads the shared styles.
- `src/App.jsx` coordinates navigation, authentication, product loading, the shopping bag, and payment returns.
- `src/components/` contains shared storefront UI: header, footer, product cards, shopping bag, and sign-in screen.
- `src/pages/` contains the home, shop, product, wishlist, account, and checkout screens.
- `src/OurStory.jsx`, `src/ContactUs.jsx`, and `src/DesignGallery.jsx` contain the brand pages and embroidery gallery.
- `src/data/` holds shared contact details, local catalog data, sizes, locations, and application constants.
- `src/AdminPanel.jsx` contains admin workflows; `src/admin/` holds reusable admin UI and data helpers.
- `src/lib/` contains currency formatting and Supabase/Cashfree integration helpers. `cashfree-server.js` is for server endpoints only.
- `api/` handles customer orders, reviews, admin actions, and payment requests.
- `public/images/` and `public/products/` hold static images; `public/policies/` holds policy pages.
- `supabase/` contains database setup and migrations.

## Everyday changes

Update contact details in `src/data/storefront.js`. The Contact Us page, footer social links, and floating social links use the same values. Contact Us is linked only from the footer; Our Story is linked from both the header and footer.

The contact form opens a prepared email in the visitor's email app. It does not send email from the server.

The local catalog is a fallback. Product changes from Supabase are loaded by the application, so changing local fallback prices does not change the shared catalog.

## Formatting and validation

```sh
npm run format
npm run format:check
npm run build
```

Formatting covers application code, API handlers, styles, and static HTML. Generated `dist/` output and installed dependencies are excluded. Keep CSS overrides in their existing order unless you have checked the affected desktop and mobile layouts.

The production build goes to `dist/`. `npm run preview` serves that build locally; it does not run the server endpoints.

## Updated image and product collection

The November collection contains 20 products. `src/data/products.json` groups the original files into product galleries; `src/data/catalog.js` resolves their display images. Placeholder prices are ₹1,999 for clothing, ₹1,499 for kids’ pieces, and ₹299 for hair clips. Prices, descriptions, sizes, and stock can be edited in admin. The shared database remains the source of truth after it loads.

`src/data/designs.js` contains the 33 embroidery designs displayed in full on Our Story. That page also uses the founder and styling photos, close-up embroidery photographs, and the blue embroidery reel. Product videos appear in their product galleries with playback controls.

`public/media/` contains resized WebP display copies; original uploads are retained. To regenerate the copies and manifest, run `python scripts/prepare-media.py` with Pillow installed. Then run `npm run check:catalog` to check all image coverage, gallery membership, and rendered asset paths.

`npm run catalog:sync` uploads product media and inserts missing collection records in Supabase using server credentials from `.env`. It preserves existing product edits and retires only the old built-in records with removed image paths. It does not delete historical product rows. Run it only when intentionally synchronizing the shared catalog. The November collection has already been synchronized.
