# Share Page UI Changes

## Overview

This document summarizes the public share page UI changes made for `https://.../shares/:id` in `packages/server`.

The work focused on two goals:

1. Add a light/dark theme toggle to the public share page.
2. Improve the mobile navbar layout so the theme button stays on the same row as the logo.

The implementation was intentionally kept local to the share page and avoided changing share permissions, routing behavior, linked note handling, or resource download behavior.

## Share Page Rendering Path

The public share page is rendered by the server package through the following path:

1. Route entry: `packages/server/src/routes/index/shares.ts`
2. Shared note rendering: `packages/server/src/utils/joplinUtils.ts`
3. Share page template: `packages/server/src/views/index/items/note.mustache`
4. Share page CSS: `packages/server/public/css/items/note.css`
5. Share page JS: `packages/server/public/js/items/note.js`

The route does not use a dedicated `shares.mustache` page. Instead, note shares go through the existing note rendering pipeline and are wrapped with the `index/items/note` template.

## Problem Statement

Originally the public share page only rendered the light theme. The note HTML was produced with:

`packages/server/src/utils/joplinUtils.ts`

```ts
markupToHtml.render(note.markup_language, note.body, themeStyle(Setting.THEME_LIGHT), renderOptions)
```

Because the rendered note includes theme-specific HTML and CSS from the renderer, simply toggling a page-level dark class would not correctly theme the note body. Elements such as code blocks, tables, links, and other renderer output would remain light-themed or become inconsistent.

## Final Approach

The implemented solution uses two separately rendered versions of the note body:

1. A light-rendered note HTML block
2. A dark-rendered note HTML block

The page then switches between them using CSS and a small client-side theme toggle script.

This approach was selected because it is the lowest-risk change for this codebase. It avoids rewriting renderer output CSS and leaves the existing share rendering behavior intact.

## Files Changed

### 1. `packages/server/src/utils/joplinUtils.ts`

Purpose:

1. Render the shared note twice, once with `Setting.THEME_LIGHT` and once with `Setting.THEME_DARK`
2. Pass both rendered results to the share page template

Key changes:

1. Added a local helper `renderNoteBody(themeId)` inside `renderNote(...)`
2. Rendered:
   - `lightResult`
   - `darkResult`
3. Replaced the old single `bodyHtml` template field with:
   - `bodyHtmlLight`
   - `bodyHtmlDark`
4. Continued to pass plugin asset bootstrap data through `assetsJs`

Relevant section:

```ts
const lightResult = await renderNoteBody(Setting.THEME_LIGHT);
const darkResult = await renderNoteBody(Setting.THEME_DARK);
```

And:

```ts
note: {
	...note,
	bodyHtmlLight: lightResult.html,
	bodyHtmlDark: darkResult.html,
	updatedDateTime: formatDateTime(note.user_updated_time),
}
```

### 2. `packages/server/src/views/index/items/note.mustache`

Purpose:

1. Add the theme toggle button to the share page navbar
2. Render separate light and dark note containers

Key changes:

1. Added a button with ID `theme-toggle-button`
2. Replaced the single rendered note block with:
   - `.note-theme.note-theme-light`
   - `.note-theme.note-theme-dark`

Current structure:

```mustache
<div class="navbar-actions">
	<button id="theme-toggle-button" class="theme-toggle-button" type="button" aria-pressed="false"></button>
</div>
```

And:

```mustache
<div class="note-theme note-theme-light">{{{note.bodyHtmlLight}}}</div>
<div class="note-theme note-theme-dark">{{{note.bodyHtmlDark}}}</div>
```

### 3. `packages/server/public/css/items/note.css`

Purpose:

1. Add page-level light/dark theme styling
2. Style the theme toggle button
3. Control which note body is visible
4. Adjust the mobile navbar layout

Key changes:

1. Added `html[data-theme="dark"]` page theme rules
2. Added `.theme-toggle-button` styling
3. Added `.note-theme-light` / `.note-theme-dark` visibility rules
4. Added dark-mode navbar, button, and text adjustments
5. Added a mobile rule set that keeps the button inline with the logo
6. Added `white-space: nowrap` to the button so the label does not wrap

Important mobile behavior:

The first mobile iteration used a column layout and pushed the button to a second row. This was revised. The final mobile CSS keeps the navbar inline and instead reduces spacing and button size:

```css
@media (max-width: 640px) {
	.page-note .navbar-brand {
		gap: 0.5rem;
	}

	.page-note .theme-toggle-button {
		padding: 0.4rem 0.75rem;
		font-size: 0.85rem;
	}

	.page-note .logo-text {
		font-size: 1.8em;
	}
}
```

### 4. `packages/server/public/js/items/note.js`

Purpose:

1. Apply the selected theme to the share page
2. Toggle between light and dark mode
3. Persist the user choice in `localStorage`
4. Use the system preference on first load

Key changes:

1. Added `themeStorageKey = 'joplin.share.theme'`
2. Added `systemTheme()`
3. Added `buttonLabel(theme)`
4. Added `applyTheme(theme)`
5. Added `loadTheme()`
6. Added button click handling

Final button labels:

1. `Dark mode`
2. `Light mode`

This replaced the longer earlier labels:

1. `Switch to dark mode`
2. `Switch to light mode`

Current label logic:

```js
function buttonLabel(theme) {
	return theme === 'dark' ? 'Light mode' : 'Dark mode';
}
```

### 5. `packages/server/src/routes/index/shares.link.test.ts`

Purpose:

1. Add a small regression check that the share page contains the new UI elements

Key changes:

Added expectations in the basic note rendering test:

```ts
expect(bodyHtml).toContain('theme-toggle-button');
expect(bodyHtml).toContain('note-theme-dark');
```

## What Was Not Changed

The following share behavior was deliberately left unchanged:

1. Share route and permission logic in `packages/server/src/routes/index/shares.ts`
2. Linked note redirect and access checks
3. Shared resource URL generation
4. Plugin asset loading behavior
5. Share resource download behavior
6. Markdown renderer configuration besides rendering two themed copies

## Why This Approach Was Chosen

Two implementation approaches were considered:

1. One note DOM plus two CSS theme layers
2. Two pre-rendered note DOM blocks, one light and one dark

The second approach was chosen because it avoids trying to re-scope or override complex renderer output. The note renderer emits theme-sensitive HTML and CSS, so rendering two separate copies was the simplest and most reliable way to support a toggle without broader regressions.

## Validation Performed

Validation completed during the work:

1. Inspected the share route, rendering pipeline, template, CSS, and JS paths
2. Confirmed the share page uses the note rendering pipeline rather than a dedicated page template
3. Added a targeted test assertion in `shares.link.test.ts`
4. Ran `node --check "packages/server/public/js/items/note.js"` successfully after the JS changes
5. Reviewed the resulting diffs to confirm changes stayed localized to the share page implementation

## Validation Limitations Encountered

The local workspace had dependency/environment issues that prevented executing the targeted Yarn workspace test from the current machine state. The problem observed was related to Yarn install state rather than a syntax error in the share page changes.

In addition, historical Docker build logs in the repository root showed unrelated `packages/server` TypeScript configuration errors involving `Config` and `EnvVariables`. Those log failures did not reference the share page files changed in this work.

## Manual Verification Checklist

Recommended manual checks for the public share page:

1. Open a real `/shares/:id` URL on desktop
2. Confirm the theme button appears in the navbar
3. Confirm default theme follows system preference on first load
4. Toggle between light and dark mode
5. Refresh the page and confirm the chosen theme persists
6. Verify note title and updated timestamp remain readable in both themes
7. Verify code blocks, tables, links, images, and Mermaid blocks render correctly in both themes
8. Verify the button remains on the same row as the logo in mobile viewport widths

## Final Changed Files List

1. `packages/server/src/utils/joplinUtils.ts`
2. `packages/server/src/views/index/items/note.mustache`
3. `packages/server/public/css/items/note.css`
4. `packages/server/public/js/items/note.js`
5. `packages/server/src/routes/index/shares.link.test.ts`

## Summary

The public share page now supports:

1. Light mode
2. Dark mode
3. Theme persistence with `localStorage`
4. System-theme default on first load
5. A mobile-friendly navbar where the theme button stays inline with the logo

The implementation remains local to the share page rendering flow and does not change core sharing behavior.
