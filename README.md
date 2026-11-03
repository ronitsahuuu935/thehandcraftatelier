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
- `public/media/images/` and `public/media/products/` hold all website images and videos; `public/policies/` holds policy pages.
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

The November collection contains 20 products. `src/data/products.json` groups the media assets into product galleries; `src/data/catalog.js` resolves their display images. Placeholder prices are ₹1,999 for clothing, ₹1,499 for kids’ pieces, and ₹299 for hair clips. Prices, descriptions, sizes, and stock can be edited in admin. The shared database remains the source of truth after it loads.

`src/data/designs.js` contains the 33 embroidery designs displayed in full on Our Story. That page also uses the founder and styling photos, close-up embroidery photographs. Product videos appear in their product galleries with playback controls.

`public/media/` is the complete runtime asset folder, including optimized WebP images and all videos. The old `public/images/` and `public/products/` folders are no longer required and can be deleted. Keep `public/media/` and commit its contents before deploying. `src/data/media.json` retains legacy URL mappings for saved references; it does not require the original files.

To import a future batch from an external directory containing `images/` and `products/`, run `python scripts/prepare-media.py --source "path/to/asset-batch"` with Pillow installed. This retains the existing media manifest. Update the relevant catalog/design entries, then run `npm run check:catalog` to check coverage and asset paths.

`npm run catalog:sync` uploads product media and inserts missing collection records in Supabase using server credentials from `.env`. It preserves existing product edits and retires only the old built-in records with removed image paths. It does not delete historical product rows. Run it only when intentionally synchronizing the shared catalog. The November collection has already been synchronized.

## Shipping labels

Paid orders have a **Label** action next to **View** in the admin Orders table. It re-reads the saved delivery details and payment status using the signed-in Supabase session, then downloads a PDF directly. Pending and failed payments do not show this action. The label includes the full delivery address, prepaid status, order total and ID, and the atelier return address. Missing recipient names, street addresses, or PIN codes block generation.

Labels use a printable 4×6-inch layout and extend vertically for exceptionally long addresses rather than truncating them. The bundled Noto font supports English, Hindi, and the rupee symbol; its OFL license is included in `public/media/fonts/`. PDFs are generated locally in the admin browser. No courier service or tracking number is created. Run `npm run test:labels` for payment eligibility, PDF layout, long-address, and download checks.
