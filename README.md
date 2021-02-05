# node-toogoodtogo-watcher [![GitHub license](https://img.shields.io/github/license/marklagendijk/node-toogoodtogo-watcher)](https://github.com/marklagendijk/node-toogoodtogo-watcher/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/toogoodtogo-watcher)](https://www.npmjs.com/package/toogoodtogo-watcher) [![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/marklagendijk/toogoodtogo-watcher)](https://hub.docker.com/r/marklagendijk/toogoodtogo-watcher/builds) [![Docker Pulls](https://img.shields.io/docker/pulls/marklagendijk/toogoodtogo-watcher)](https://hub.docker.com/r/marklagendijk/toogoodtogo-watcher)

Node.js cli tool for monitoring your favorite TooGoodToGo businesses. Notifications are shown when the stock of any of the businesses changes. The following notification types are supported:

- Desktop notification
- Console output
- Telegram chat message

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

Create a directory `config` and copy the [config.defaults.json](https://github.com/marklagendijk/node-toogoodtogo-watcher/blob/master/config.defaults.json) to `config/config.json`. See above for instructions on how to configure the application.

### Docker run

```
docker run \
 --name toogoodtogo-watcher \
 -e TZ=Europe/Amsterdam \
 -v /full/path/to/config:/home/node/.config/toogoodtogo-watcher-nodejs \
 marklagendijk/toogoodtogo-watcher`
```

### Docker Compose

`docker-compose.yaml`:

```yaml
version: "3"
services:
  toogoodtogo-watcher:
    image: marklagendijk/toogoodtogo-watcher
    restart: unless-stopped
    environment:
      - TZ=Europe/Amsterdam
    volumes:
      - ./config:/home/node/.config/toogoodtogo-watcher-nodejs
```

### Docker Compose on Raspberry Pi

The Docker images of the tool are automatically build via Docker Hub. Unfortunately it is currently either impossible or very hard to automatically build multi-arch Docker images via Docker Hub. Because of this the the tool is only build for the `linux/amd64` architecture.

To still be able to run the tool on a Raspberry Pi, we can use the `node` image instead, and install the tool on startup:
`docker-compose.yml`:

```yaml
version: "3"
services:
  toogoodtogo-watcher:
    image: node:lts
    restart: unless-stopped
    working_dir: /home/node
    environment:
      - NODE_ENV=production
      - TZ=Europe/Amsterdam
    volumes:
      - ./config:/home/node/.config/toogoodtogo-watcher-nodejs
    command: bash -c "npm install --no-save --no-package-lock toogoodtogo-watcher && ./node_modules/.bin/toogoodtogo-watcher watch"
```
