# patchcore

a shared library to build [ssb](https://scuttlebot.io) apps

or _the shared assumptions of all (or most) ssb related applications_


## required sbot plugins

- [ssb-private](https://github.com/ssbc/ssb-private)
- [ssb-backlinks](https://github.com/ssbc/ssb-backlinks)
- [ssb-about](https://github.com/ssbc/ssb-about)

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

[The MIT License (MIT)](https://mit-license.org/)

Copyright © 2017 Secure Scuttlebutt Consortium

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
