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

## depject

to use this you must understand [depject](https://github.com/depject/depject)

## directory structure

the `patchcore` files are organized in the following hierarchy:

> ${topic} / ${type} / ${module}.js

or when module name is different from file name (this only happens within message/html):

> ${topic} / ${type} / ${module} / ${file}.js

some cases, the module is skipped (in topics: about, contact, backlinks, feed)

> ${topic} / ${type}.js

and, (only in backlinks/obs topic/type) the type and module are part of the same name.

> {$topic=backlinks} / ${type=obs}-$name}

finally, the config, emoji, keys, and sbot topics types. it's just a single javascript.

> ${topic}.js

### topics

- lib (junk that isn't part of any topic and should really be published as a reusable module, but too lazy)
- [about](./docs/index.md#about) - functions relating to `about` messages, for setting avatars and names.
- [blob](./docs/index.md#blob) - related to images and files
- [config](./docs/index.md#config) - `config.sync.load` method that loads config.
- [contact](./docs/index.md#contact) - related to contact messages, for following and blocking.
- [emoji](./docs/index.md#emoji) - :dancer: :tada: :joy_cat: :haircut_woman:
- [feed](./docs/index.md#feed - stuff related to feeds - aka streams of messages by one or more user
- [invite](./docs/index.md#invite) - using invite codes
- [keys](./docs/index.md#keys) - load the main identity
- [message](./docs/index.md#message) - relating to messages generically, i.e. publishing messages or rendering things that are the same for multiple different message types.
- [router](./docs/index.md#router)
- [sbot](./sbot/index.md#sbot)

### types

- `sync` a function that returns an ordinary javascript value, such as a string or number. Usually a simple utility function.
- `async` a function that takes a callback, and does IO. It may query the database or publish a message.
- `pull` returns [pull-stream](https://github.com/pull-stream/pull-stream) [source](https://github.com/pull-stream/pull-stream#source-readable-stream-that-produces-values), [sink](https://github.com/pull-stream/pull-stream#sink-reader-or-writable-stream-that-consumes-values), or [through](https://github.com/pull-stream/pull-stream#through). Sometimes pull type returns a function that then creates a pull stream.
- `obs` return a [mutant observable](https://github.com/mmckegg/mutant#readme) this is generally for things that change in real time or may load slowly, and you usually want to display them as a single thing (i.e. number of likes, or an avatar name). sometimes obs really just wrap async methods, but obs play more nicely with mutant than async functions do.
- `html` returns an HtmlElement this may have dynamic behaviour.

## license

[The MIT License (MIT)](https://mit-license.org/)

Copyright © 2017 Secure Scuttlebutt Consortium

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
