# node-toogoodtogo-watcher [![GitHub license](https://img.shields.io/github/license/marklagendijk/node-toogoodtogo-watcher)](https://github.com/marklagendijk/node-toogoodtogo-watcher/blob/master/LICENSE) [![npm](https://img.shields.io/npm/v/toogoodtogo-watcher)](https://www.npmjs.com/package/toogoodtogo-watcher) [![Docker Pulls](https://img.shields.io/docker/pulls/marklagendijk/toogoodtogo-watcher)](https://hub.docker.com/r/marklagendijk/toogoodtogo-watcher)

Node.js cli tool for monitoring your favorite TooGoodToGo businesses. Notifications are shown when the stock of any of
the businesses changes. The following notification types are supported:

- Desktop notification
- Console output
- Telegram chat message
- All the notification services that [Apprise](https://github.com/caronc/apprise) supports (WIP).

See [below for Docker usage](#docker).

## Installation

1. Install Node.js 18.x or higher ([Windows](https://nodejs.org/en/download/current/)
   | [Linux](https://github.com/nodesource/distributions#debinstall) | [OSx](https://nodejs.org/en/download/current/)).
2. `npm install -g toogoodtogo-watcher`
3. `toogoodtogo-watcher config`. Optionally enable / disable certain notifications. See [Configuring Telegram notifications](#configuring-telegram-notifications) for instructions on
   setting up the Telegram notifications.
4. `toogoodtogo-watcher login --email mail@example.com`. Click the link in the login email (on PC, not on phone).
5. `toogoodtogo-watcher watch`

## CLI documentation

```
Usage: toogoodtogo-watcher <command>

Commands:
  config        Edit the config file.
  config-reset  Reset the config to the default values.
  config-path   Show the path of the config file.
  login         Interactively login via a login email.
  watch         Watch your favourite busininesses for changes.

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

## Displaying the notifications in the Windows notification center

By default Windows doesn't display the notifications in the notification center. You can enable this by doing the
following steps.

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
7. Your bot should greet you, and show a notification about your favorites. Note: the bot will show the favorites which
   you configured. Multiple people can connect to the bot to get updates about these favorites.

## Docker

Note: the Docker image is a multiarch image. So it will also work on Raspberry Pi's.

### Docker run

1. Create a directory to store the config file and copy
   the [config.defaults.json](https://github.com/marklagendijk/node-toogoodtogo-watcher/blob/master/config.defaults.json)
   into `YOUR_FOLDER/config.json`. See above for instructions on how to configure the application. Make sure that the
   folder has the correct permissions, e.g. run chmod -R o+rwx config/ or you might get access denied errors on the file
   system. The app needs read/write access on the configuration file, e.g. to store token received in it.
2. Run the following command to login, using the configured email address. Example: a user `john` who stored the config
   in `~/toogoodtogo-watcher/config.json`:

```
docker run \
 -i \
 --name toogoodtogo-watcher \
 --rm \
 -v /home/john/toogoodtogo-watcher:/home/node/.config/toogoodtogo-watcher-nodejs \
 marklagendijk/toogoodtogo-watcher login --email email@example.com
```

3. Run the following command to start watching.

```
docker run \
 --name toogoodtogo-watcher \
 --rm \
 -e TZ=Europe/Amsterdam \
 -v /home/john/toogoodtogo-watcher:/home/node/.config/toogoodtogo-watcher-nodejs \
 marklagendijk/toogoodtogo-watcher watch
```

### Docker Compose

1. Create the following directory structure.
   ```
   my-docker-compose-stuff
   │   docker-compose.yaml
   │
   └───toogoodtogo-watcher
       │   config.json
   ```
2. Copy
   the [config.defaults.json](https://github.com/marklagendijk/node-toogoodtogo-watcher/blob/master/config.defaults.json)
   to `toogoodtogo-watcher/config.json`. See above for instructions on how to configure the application.
3. Use the command as explained under 'Docker run' above to login using the configured email address.
4. Create a file `docker-compose.yaml`
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
