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

The final implementation uses:

1. Two separately rendered versions of the note body
2. One active renderer style tag whose CSS text is replaced when the theme changes

This matters because the renderer emits global selectors for tables, code blocks, inline code, and related content. Simply keeping two hidden `<style>` blocks in the DOM would not isolate the theme styles. The final implementation avoids that issue by ensuring only one renderer theme CSS payload is active at a time.

## Files Changed

### 1. `packages/server/src/utils/joplinUtils.ts`

Purpose:

1. Render the shared note twice, once with `Setting.THEME_LIGHT` and once with `Setting.THEME_DARK`
2. Split each rendered result into themed CSS text and themed body HTML
3. Pass the themed CSS payloads, themed body payloads, and theme-specific plugin assets to the template and front-end script

Key changes:

1. Added `ThemedRenderedNote`
2. Added `splitRenderedNote(...)` to extract:
   - `styleCss`
   - `bodyHtml`
3. Rendered:
   - `lightResult`
   - `darkResult`
4. Replaced the old single `bodyHtml` template field with:
   - `bodyHtmlLight`
   - `bodyHtmlDark`
5. Added themed renderer CSS payloads:
   - `bodyStyleCssLight`
   - `bodyStyleCssDark`
6. Added a theme-specific code highlight theme selection:
   - `atom-one-light.css`
   - `atom-one-dark-reasonable.css`
7. Exposed the final theme CSS payloads to the client through `assetsJs` as:
   - `renderedNoteStyles.light`
   - `renderedNoteStyles.dark`
8. Exposed theme-specific plugin asset sets to the client through `assetsJs` as:
   - `themePluginAssets.light`
   - `themePluginAssets.dark`

Relevant section:

```ts
const lightResult = await renderNoteBody(Setting.THEME_LIGHT);
const darkResult = await renderNoteBody(Setting.THEME_DARK);
```

And:

```ts
note: {
	...note,
	bodyHtmlLight: lightResult.bodyHtml,
	bodyHtmlDark: darkResult.bodyHtml,
	bodyStyleCssLight: lightResult.styleCss,
	bodyStyleCssDark: darkResult.styleCss,
	updatedDateTime: formatDateTime(note.user_updated_time),
}
```

### 2. `packages/server/src/views/index/items/note.mustache`

Purpose:

1. Add the theme toggle button to the share page navbar
2. Render separate light and dark note containers
3. Provide a single active renderer theme style tag

Key changes:

1. Added a button with ID `theme-toggle-button`
2. Added a single active style element:
   - `#note-renderer-theme-style`
3. Replaced the single rendered note block with:
   - `.note-theme.note-theme-light`
   - `.note-theme.note-theme-dark`

Current structure:

```mustache
<style id="note-renderer-theme-style">{{{note.bodyStyleCssLight}}}</style>
```

And:

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
5. Improve mobile readability for code blocks, tables, title spacing, and footer metadata

Key changes:

1. Added `html[data-theme="dark"]` page theme rules
2. Added `.theme-toggle-button` styling
3. Added `.note-theme-light` / `.note-theme-dark` visibility rules
4. Added dark-mode navbar, button, and text adjustments
5. Added active-state styling for the theme toggle button using `aria-pressed`
6. Added a mobile rule set that keeps the button inline with the logo
7. Added `white-space: nowrap` to the button so the label does not wrap
8. Moved the timestamp to the bottom of the page and styled it as footer metadata
9. Added mobile-specific code block wrapping and tighter spacing
10. Added mobile-specific table sizing, border, and radius styling

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
3. Replace the active renderer theme CSS when the theme changes
4. Replace theme-dependent plugin CSS assets when the theme changes
5. Persist the user choice in `localStorage`
6. Use the system preference on first load

Key changes:

1. Added `themeStorageKey = 'joplin.share.theme'`
2. Added `systemTheme()`
3. Added `buttonLabel(theme)`
4. Added `applyRenderedNoteStyle(theme)`
5. Added `applyThemePluginAssets(theme)`
6. Added `applyTheme(theme)`
7. Added `loadTheme()`
8. Added button click handling

The final implementation also switches the syntax highlighting CSS for code blocks so that dark mode no longer keeps the default light highlight background.

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
expect(bodyHtml).toContain('note-renderer-theme-style');
```

## What Was Not Changed

The following share behavior was deliberately left unchanged:

1. Share route and permission logic in `packages/server/src/routes/index/shares.ts`
2. Linked note redirect and access checks
3. Shared resource URL generation
4. Plugin asset loading behavior outside the theme-dependent highlight CSS switching for the share page
5. Share resource download behavior
6. Markdown renderer configuration besides rendering two themed copies and switching the active CSS payload

## Why This Approach Was Chosen

Two implementation approaches were considered:

1. One note DOM plus two CSS theme layers
2. Two pre-rendered note DOM blocks with separately controlled themed CSS

The final implementation stays closest to the second approach but avoids leaving two renderer style blocks active in the document at once. That extra refinement was necessary because the renderer emits global selectors for elements such as tables, code blocks, and inline code.

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
7. Verify code blocks, including syntax highlighting background, inline code, tables, links, images, and Mermaid blocks render correctly in both themes
8. Verify the button remains on the same row as the logo in mobile viewport widths
9. Verify the bottom timestamp appears visually separated from the main content

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
