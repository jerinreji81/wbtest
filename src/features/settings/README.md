# Settings feature owner

Phase J2 introduces `settings-controller.js` as the Settings ownership boundary.

Current scope:

- settings normalisation
- deprecated `addToSetBehavior` normalisation to `ask`
- setting label/subtitle helpers
- picker option models
- text-size scale helpers
- theme/accent token calculations
- document-level settings application helper

The legacy shell still renders the Settings screen for compatibility. Future phases can move the Settings DOM renderer into this feature folder without changing the settings contract.
