# Lighthouse audit — 5 November 2026

Audited the production build served at `http://127.0.0.1:4173`, using the real public Supabase catalog. These are local lab measurements, not deployed-site or field measurements. Mobile results use Lighthouse's default throttling; desktop uses the desktop preset. Performance varies with local CPU and network load.

| Page                             | Performance | Accessibility | Best Practices | SEO | Layout shift |
| -------------------------------- | ----------: | ------------: | -------------: | --: | -----------: |
| Homepage, mobile baseline        |          39 |            96 |            100 |  92 |        0.107 |
| Homepage, mobile final           |          72 |           100 |            100 | 100 |            0 |
| Homepage, desktop final          |          96 |           100 |            100 | 100 |            0 |
| Shop, mobile final               |          76 |           100 |            100 | 100 |            0 |
| Blue Blossom Shirt, mobile final |          76 |           100 |            100 | 100 |            0 |

## Changes

- Load admin and secondary pages only when needed; load Cashfree only at checkout, with retry handling.
- Serve local fonts and a small favicon. Prioritize the hero-image preload.
- Generate responsive WebP images. Remote image aliases were included only after verifying their bytes against local originals, so admin-uploaded replacements continue to use their own URLs.
- Remove two obsolete storage-list requests from catalog loading.
- Reserve space during category, shop, and product loading. Resolve shared products alongside catalog data to avoid a temporary unavailable-product screen.
- Improve text contrast, quantity-button labels, header button names, and product-card button semantics.
- Add a valid robots.txt.

## Validation and limits

Production build, catalog checks, formatting, and all 17 Node tests passed. Tests include navigation, inventory, sharing, PDF labels, and payment-SDK loading/retry. No real payment or destructive admin action was performed. Private/admin pages were not Lighthouse-audited.

Mobile performance still has room to improve: the homepage's final simulated largest-contentful paint was 6.9 seconds; rendering depends on downloading and running the client application. Eliminating this startup delay further would benefit from server-rendered or prerendered routes. A Lighthouse 100 does not establish complete accessibility or SEO compliance.

The generated HTML/JSON reports and preview screenshot were removed during cleanup on 7 November 2026. The historical results above are retained for comparison; rerun Lighthouse for current measurements. Generated reports are ignored by Git.

To regenerate image variants after local asset changes, run `python scripts/prepare-responsive-images.py` (requires Pillow). New remote uploads fall back to their original URL unless a matching optimized alias has been verified.
