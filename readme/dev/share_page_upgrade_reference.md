# Share Page Upgrade Reference

This file lists the project files changed for the public share page UI so they can be reviewed and re-applied if needed during a future upgrade.

## Scope

Target page:

1. `https://.../shares/:id`

Only the public share page implementation is covered here.

## Modified Files

1. `packages/server/src/utils/joplinUtils.ts`
Purpose:
Controls share page note rendering.
Changes:
Renders separate light/dark note output, switches renderer CSS by theme, and applies theme-specific code highlight themes and plugin assets.

2. `packages/server/src/views/index/items/note.mustache`
Purpose:
Share page HTML template.
Changes:
Adds the theme toggle button, uses a single active renderer theme style tag, keeps separate light/dark body containers, moves the updated timestamp to the bottom, and changes the share page logo link to `https://www.suntao.fr`.

3. `packages/server/public/css/items/note.css`
Purpose:
Share page styling.
Changes:
Adds light/dark page styling, theme toggle button styling, footer timestamp styling, mobile layout improvements, mobile code block wrapping, mobile table readability improvements, and stronger visual feedback for the active theme state.

4. `packages/server/public/js/items/note.js`
Purpose:
Share page client-side behavior.
Changes:
Adds theme persistence, theme toggle behavior, renderer CSS switching, and theme-dependent plugin CSS switching for syntax highlighting.

5. `packages/server/src/routes/index/shares.link.test.ts`
Purpose:
Share page regression coverage.
Changes:
Adds assertions for the share page theme toggle and renderer theme style element.

6. `readme/dev/share_page_ui_changes.md`
Purpose:
Detailed implementation notes.
Changes:
Tracks the full rationale and final implementation details for the share page modifications.

## Functional Summary

The share page was customized to support:

1. Light and dark theme toggle
2. Theme persistence with `localStorage`
3. Theme-specific syntax highlighting for code blocks
4. Light/dark-safe rendering for tables, inline code, and code blocks
5. Share-page-only logo link override to `https://www.suntao.fr`
6. Footer-style updated timestamp at the bottom of the page
7. Mobile improvements for navbar layout, code blocks, and tables

## Most Important Files To Check During Upgrade

If the share page breaks after an upgrade, review these first:

1. `packages/server/src/utils/joplinUtils.ts`
2. `packages/server/src/views/index/items/note.mustache`
3. `packages/server/public/css/items/note.css`
4. `packages/server/public/js/items/note.js`

## Notes

This reference is intentionally brief.
For the detailed design and implementation history, see:

1. `readme/dev/share_page_ui_changes.md`
