-- Persist the sizes customers can select for each catalog product.
alter table public.products
  add column if not exists sizes jsonb not null default '["XS","S","M","L","XL","XXL","XXXL"]'::jsonb;

-- Existing image galleries already use JSONB. The application stores an optional
-- `color` text value beside each image's `src` so a selected color maps to a photo.
