# Backup feature owner

Current extracted backup owners:

- `backup-ui-controller.js` — backup action labels, visible async feedback, Drive action-state helpers.
- `restore-review-controller.js` — restore review comparison/selection model helpers.
- `backup-restore-controller.js` — backup payload/history, restore plan/selection/snapshot, Backup Centre render/action models.

Still temporary host responsibilities:

- final app state assignment after restore
- local persistence calls
- file input creation/reading
- Google Drive runtime callbacks
- top-level modal lifecycle until the main shell is retired
