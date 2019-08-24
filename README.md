# node-toogoodtogo-watcher
Node.js cli tool for monitoring your favorite TooGoodToGo businesses. Notifications are shown when the stock of any of the businesses changes. The following notification types are supported:
- Desktop notification
- Console output
- Telegram chat message

## Installation
1. Install Node.js 8.x or higher ([Windows](https://nodejs.org/en/download/current/) | [Linux](https://github.com/nodesource/distributions#debinstall) | [OSx](https://nodejs.org/en/download/current/)).
2. `npm install -g toogoodtogo-watcher`
3. `toogoodtogo-watcher config`. Fill in your TooGoodToGo account details. Optionally enable / disable certain notifications. See [Configuring Telegram notifiations](#Configuring+Telegram+notifiations) for instructions on setting up the Telegram notifications.
4. `toogoodtogo-watcher watch`

## Resetting config
`toogoodtogo-watcher config --reset`

## Displaying the notifications in the Windows notification center
By default Windows doesn't display the notifications in the notification center. You can enable this by doing the following steps.

1. Go to 'notifications & actions settings' (`Windows key`, type 'notifications', `enter`)
2. Click on the 'toast' app at the bottom of the screen.
3. Enable the 'show in action center' checkbox.

## Configuring Telegram notifiations
1. Open a Telegram chat with `BotFather`.
2. Follow the instructions to create your own bot.
3. Copy the token and enter it in the configuration via `toogoodtogo-watcher config`, and set `enabled` to `true`.
4. Start the application `toogoodtogo-watcher watch`
5. Click the `t.me/BOTNAME` link from the `BotFather` chat message.
6. Press `BEGIN`.
7. Your bot should greet you, and show a notification about your favorites.