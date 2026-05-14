# Styles ownership

Phase K3 keeps the app visually unchanged while making style ownership explicit.

## Current state

- The deployed app still uses the consolidated legacy style block.
- No feature CSS has been physically moved yet.
- `style-controller.js` owns global style metadata, token lists, safe-area references, and the targeted polish backlog.
- `feature-style-registry.js` owns the feature-to-style-boundary map that later K phases can use for CSS co-location.

## Rule

Do not add one-off CSS patch blocks. When a visual issue is fixed, fix it through the owning feature/style area listed in the registry.

## Cancelled path

Attached song PDF workflows remain cancelled and have no active style owner. App-generated PDF export remains separate.
