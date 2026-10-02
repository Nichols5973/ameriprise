# Ameriprise Homepage Migration Plan

## Overview
Migrate the Ameriprise homepage (https://www.ameriprise.com/) to AEM Edge Delivery Services. The project is set up for **AEM authoring with Universal Editor**, so content lands under `/content/ameriprise` and assets under `/content/dam/ameriprise`.

**Scope (confirmed):**
- **Page:** Homepage only
- **Includes:** page content and blocks, design styling, header/navigation, footer

> You picked "Content + blocks only" along with the three extras, so I'm reading that as: do everything. Let me know if you meant something narrower.

## Approach
1. **Analyze the page:** capture the original homepage, find its sections, and decide which parts are regular content and which need blocks (hero, cards, columns, carousel, accordion, etc.).
2. **Map to blocks:** reuse the project's existing blocks where they fit (accordion, cards, carousel, columns, and others). Create new block variants only where the design needs them.
3. **Build import tooling:** create parsers for each block variant and page transformers for cleanup and sections. Then bundle them into an import script.
4. **Import content:** run the import to generate the homepage content and check that it works with the Universal Editor content models.
5. **Design styling:** pull colors, fonts and spacing from ameriprise.com into the global styles, then style each block to match the original.
6. **Header/navigation:** migrate the header and menu, including any mega-menu and mobile behavior, and validate on desktop and mobile.
7. **Footer:** migrate the footer sections, links and legal/disclosure text, and validate on desktop and mobile.
8. **Visual QA:** compare the migrated page with the original section by section and fix any differences.

## Checklist
- [ ] Confirm project setup (Universal Editor authoring, content and asset paths)
- [ ] Capture and analyze the Ameriprise homepage (sections, content, screenshots)
- [ ] Identify block variants and map them to existing blocks or new variants
- [ ] Add block selectors to the page template
- [ ] Generate or update the block code (JS/CSS) and Universal Editor models for any new variants
- [ ] Generate import parsers for each block variant
- [ ] Generate page transformers (cleanup, sections, media)
- [ ] Bundle and run the import script for the homepage
- [ ] Check the imported homepage in the preview (blocks render, images load, no missing content)
- [ ] Extract design tokens (colors, typography, spacing) and apply them to global styles
- [ ] Style each block to match the original site
- [ ] Migrate the header/navigation (desktop, mobile, mega-menu) and validate it
- [ ] Migrate the footer (desktop and mobile) and validate it
- [ ] Run a full-page visual comparison against the original and fix differences
- [ ] Summarize results and any remaining gaps

## Notes
- The original page is a financial-services marketing page. It may include disclosures, advisor-search forms or personalized content. Forms will be migrated as static content unless you want full form conversion. That needs an optional forms add-on, which I can turn on if you'd like.
- Images will reference the original source URLs during migration.
- Nothing is pushed or published to AEM unless you ask.
- **Execution requires Execute mode.** Switch to it when you're ready and I'll start with step 1.
