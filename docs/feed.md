
# Feed

## `feed.html.render(createStream) => HtmlElement`

takes a `createStream` function (that returns a stream of raw messages)
and it passes each one to `message.html.render` returning a html element with the
dynamic output of that stream.

## `feed.obs.recent(limit=50)`

returns an observable of the most recent `limit` (defaults to 50) messages.

## `feed.obs.thread (root_id)`

returns an object containing observables about every aspect of a thread.

* messages
* lastId
* rootId
* branchId
* previousKey
* isPrivate
* channel
* recps
* sync - resolves to true once all the observables are loaded.

## `feed.pull.channel(channel_id)`

returns a source stream of a channel

## `feed.pull.public(opts)`

returns a source stream of public messages, filtering out messages by blocked users.

## `feed.pull.private(opts)`

similar to `feed.pull.public` but for private messages. does not filter blocked users though.

acceps ssb-query style [`map-filter-reduce`](https://github.com/dominictarr/map-filter-reduce) queries.

## `feed.pull.profile(opts={id:user_id})`

returns a stream of messages by a particular user. an `id` option must be provided.

## `feed.pull.type(type) => function (opts)`

returns a _function_ that takes options and returns a stream of messages with the type property.

## `feed.pull.unique(filter)`

returns a through stream that takes messages or ids and filters out items that have already been through the stream.

## `feed.pull.withReplies()`

returns a through stream that filters messages that have replies


## `feed.pull.mentions(message_id)`

returns a _function_ that takes options and returns a stream of messages that mention `message_id`

## `feed.pull.rollup(root_filter)`

returns a through stream that filters root messages (via user-provided `root_filter` function) and adds repiles.
messages from blocked users are removed.
