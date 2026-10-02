# columns-promo

Custom **columns** block. Purpose: split promo panel.

## Authoring (Document Authoring)

Model: `standalone`

Single block table. Content: eyebrow? + heading + paragraph? + CTA? | image (image side follows cell order).

## Supported variations

Block option classes (panel background):

- `stone` (default) — stone panel (`--color-stone`).
- `purple-light` — light purple panel (`--color-purple-light`).

When no option is authored, the block picks the colour from the image position:
image-left panels get `purple-light`, image-right panels get `stone`.

A text cell that holds only a heading (e.g. an award callout) renders the heading
bold in midnight blue; otherwise headings are regular weight in the neutral text colour.

## Universal Editor fields

- `classes` (select): Panel color — Auto / Stone / Light purple.
- Content fields derived from the block's decorate contract.
