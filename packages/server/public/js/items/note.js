/* global joplinNoteViewer */

const themeStorageKey = 'joplin.share.theme';

function addPluginAssets(appBaseUrl, assets) {
	if (!assets) return;

	const pluginAssetsContainer = document.getElementById('joplin-container-pluginAssetsContainer');

	for (let i = 0; i < assets.length; i++) {
		const asset = assets[i];

		if (asset.mime === 'application/javascript') {
			const script = document.createElement('script');
			script.src = `${appBaseUrl}/js/${asset.path}`;
			pluginAssetsContainer.appendChild(script);
		} else if (asset.mime === 'text/css') {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = `${appBaseUrl}/css/${asset.path}`;
			pluginAssetsContainer.appendChild(link);
		}
	}
}

function docReady(fn) {
	if (document.readyState === 'complete' || document.readyState === 'interactive') {
		setTimeout(fn, 1);
	} else {
		document.addEventListener('DOMContentLoaded', fn);
	}
}

function systemTheme() {
	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function buttonLabel(theme) {
	return theme === 'dark' ? 'Light mode' : 'Dark mode';
}

function applyTheme(theme) {
	document.documentElement.setAttribute('data-theme', theme);

	const button = document.getElementById('theme-toggle-button');
	if (!button) return;

	button.textContent = buttonLabel(theme);
	button.setAttribute('aria-label', buttonLabel(theme));
	button.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
}

function loadTheme() {
	const storedTheme = window.localStorage.getItem(themeStorageKey);
	return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : systemTheme();
}

docReady(() => {
	addPluginAssets(joplinNoteViewer.appBaseUrl, joplinNoteViewer.pluginAssets);
	applyTheme(loadTheme());

	const button = document.getElementById('theme-toggle-button');
	if (button) {
		button.addEventListener('click', () => {
			const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
			window.localStorage.setItem(themeStorageKey, nextTheme);
			applyTheme(nextTheme);
		});
	}

	// document.addEventListener('click', event => {
	// 	const element = event.target;

	// 	// Detects if it's a note link and, if so, display a message
	// 	if (element && element.getAttribute('href') === '#' && element.getAttribute('data-resource-id')) {
	// 		event.preventDefault();
	// 		alert('This note has not been shared');
	// 	}
	// });
});
