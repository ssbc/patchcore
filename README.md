# patchcore

a shared library to build [ssb](https://scuttlebot.io) apps

or _the shared assumptions of all (or most) ssb related applications_


## required sbot plugins

- [ssb-private](https://github.com/ssbc/ssb-private)
- [ssb-backlinks](https://github.com/ssbc/ssb-backlinks)
- [ssb-about](https://github.com/ssbc/ssb-about) (NOTE: requires `ssb-about@2`)

## apps

here's a list of apps in the wild using `patchcore`:

- [`patchwork`](https://github.com/ssbc/patchwork)
- [`patchbay`](https://github.com/ssbc/patchbay)
- [`patchlite`](https://github.com/ssbc/patchlite)
- [(add yours here)](https://github.com/ssbc/patchcore/edit/master/README.md)

## plugins

here's a list of plugins that build on top of `patchcore`:

- [`patch-gatherings`](https://github.com/pietgeursen/patch-gatherings)
- [`patch-intl`](https://github.com/ssbc/patch-intl)
- [(add yours here)](https://github.com/ssbc/patchcore/edit/master/README.md)

## directory structure

the `patchcore` files are organized in the following hierarchy:

> ${topic} / ${type} / ${module}.js

or when module name is different from file name:

> ${topic} / ${type} / ${module} / ${file}.js

### topics

- lib (junk that isn't part of any topic and should really be published as a reusable module, but too lazy)
- about
- blob
- config
- [contact](./docs/contact.md)
- emoji
- feed
- invite
- keys
- message
- [router](./docs/router.md)
- sbot

### types

- sync
- async
- pull
- obs
- html

## license

AGPL-3.0
