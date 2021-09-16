# node-toogoodtogo-watcher [![GitHub license](https://img.shields.io/github/license/marklagendijk/node-toogoodtogo-watcher)](https://github.com/marklagendijk/node-toogoodtogo-watcher/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/toogoodtogo-watcher)](https://www.npmjs.com/package/toogoodtogo-watcher) [![Docker Pulls](https://img.shields.io/docker/pulls/marklagendijk/toogoodtogo-watcher)](https://hub.docker.com/r/marklagendijk/toogoodtogo-watcher)

Node.js cli tool for monitoring your favorite TooGoodToGo businesses. Notifications are shown when the stock of any of the businesses changes. The following notification types are supported:

- Desktop notification
- Console output
- Telegram chat message
- Push message via Gotify

See [below for Docker usage](#docker).

## Installation

1. Install Node.js 8.x or higher ([Windows](https://nodejs.org/en/download/current/) | [Linux](https://github.com/nodesource/distributions#debinstall) | [OSx](https://nodejs.org/en/download/current/)).
2. `npm install -g toogoodtogo-watcher`
3. `toogoodtogo-watcher config`. Fill in your TooGoodToGo account details. Optionally enable / disable certain notifications. See [Configuring Telegram notifiations](#configuring-telegram-notifiations) for instructions on setting up the Telegram notifications.
4. `toogoodtogo-watcher watch`

## CLI documentation

```
Usage: toogoodtogo-watcher <command>

Commands:
  config        Edit the config file.
  config-reset  Reset the config to the default values.
  config-path   Show the path of the config file.
  watch         Watch your favourite busininesses for changes.

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

## Displaying the notifications in the Windows notification center

By default Windows doesn't display the notifications in the notification center. You can enable this by doing the following steps.

1. Go to 'notifications & actions settings' (`Windows key`, type 'notifications', `enter`)
2. Click on the 'toast' app at the bottom of the screen.
3. Enable the 'show in action center' checkbox.

## Configuring Telegram notifications

1. Open a Telegram chat with `BotFather`.
2. Follow the instructions to create your own bot.
3. Copy the token and enter it in the configuration via `toogoodtogo-watcher config`, and set `enabled` to `true`.
4. Start the application `toogoodtogo-watcher watch`
5. Click the `t.me/BOTNAME` link from the `BotFather` chat message.
6. Press `BEGIN`.
7. Your bot should greet you, and show a notification about your favorites. Note: the bot will show the favorites which you configured. Multiple people can connect to the bot to get updates about these favorites.

It's possible to setup the bot in restricted mode so only the allowed telegram chat ids will be able to use the bot to subscribe for notifications.

## Configure IFTTT integration

1. Go to [https://ifttt.com/create/](https://ifttt.com/create/).
2. Click on `this` and select **Webhooks**.
3. Fill in an **Event Name** (e.g. `too_good_to_go_updated`).
4. Click on `that`.
5. Select anything you'd like to integrate with (e.g. Philips Hue).
6. Finish setting it up. Note: `value1` contains a plain text message, `value2` contains an HTML message.
7. Update the `ifttt` configuration via `toogoodtogo-watcher config`:
   - set `enabled` to `true`
   - set `webhookKey` to the token found at [Web Hook settings](https://ifttt.com/services/maker_webhooks/settings) (last part of the URL)
   - add the **Event Name** selected in step 3 to the `webhookEvents` array

Note: You can add multiple events to `webhookEvents`

## Docker

Note: the Docker image is a multiarch image. So it will also work on Raspberry Pi's.

### Docker run

1. Create a directory to store the config file and copy the [config.defaults.json](https://github.com/marklagendijk/node-toogoodtogo-watcher/blob/master/config.defaults.json) into `YOUR_FOLDER/config.json`. See above for instructions on how to configure the application. Make sure that the folder has the correct permissions, e.g. run chmod -R o+rwx config/ or you might get access denied errors on the file system. The app needs read/write access on the configuration file, e.g. to store token received in it.
2. Run the following command. Example: a user `john` who stored the config in `~/docker/toogoodtogo-watcher/config.json`:

```
docker run \
 --name toogoodtogo-watcher \
 -e TZ=Europe/Amsterdam \
 -v /home/john/docker/toogoodtogo-watcher:/home/node/.config/toogoodtogo-watcher-nodejs \
 marklagendijk/toogoodtogo-watcher
```

Note: When using Gotify as notification, make sure to put them on the same network in docker if hosted on the same docker host, e.g.
docker network create gotify
and use "--network=gotify" on both containers
You can then use "http://gotify" on this container if --name gotify is used for the gotify container

### Docker Compose

1. Create a directory to contain all your Docker Compose things.
2. Create a directory `toogoodtogo-watcher` inside the created directory, and copy the [config.defaults.json](https://github.com/marklagendijk/node-toogoodtogo-watcher/blob/master/config.defaults.json) to `toogoodtogo-watcher/config.json`. See above for instructions on how to configure the application.
3. Create a file `docker-compose.yaml`:

```yaml
version: "3"
services:
  toogoodtogo-watcher:
    image: marklagendijk/toogoodtogo-watcher
    restart: unless-stopped
    environment:
      - TZ=Europe/Amsterdam
    volumes:
      - ./toogoodtogo-watcher:/home/node/.config/toogoodtogo-watcher-nodejs
```

## Running with Heroku

1. Install the Heroku CLI and login.
2. From your terminal, run `heroku config:set TOOGOODTOGO_CONFIG=content`, replacing content with the content of your config.json file.
