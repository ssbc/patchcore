
# About

## `about.html.image`

`(id)` - returns a dynamic rendering of an identities avatar.

## `about.html.link`

`(id)` returns a dynamic rendering of an identities name that is also a link to their id.

## `about.obs.*`

just a wrapper around [ssb-social-index](https://github.com/ssbc/ssb-social-index)

* name
* description
* image
* imageUrl
* names
* images
* color
* latestValue
* valueFrom
* socialValue
* groupedValues
* socialValues

## `about.sync.shortFeedId`

truncates the feed id to 10 chars long.

# blob

## `blob.async.addFiles (files, opts, cb)`

wraps [blobFiles(files, server, opts cb)](https://github.com/ssbc/ssb-blob-files#blobfilesfiles-server-opts-cb) method on `ssb-blob-files`

## `blob.html.input (onAdded, opts)`

returns a html file input, and calls back to `onAdded` when a file is selected by the user.

## `blob.obs.has(blob_id)`

return an observable that resolves to true when the local sbot has the `blob_id`

## `blob.sync.url(id)`

no-op, just returns the id.


# Config

## `config.sync.load`

returns config
# Contact

## `contact.async.follow`

`(id, cb)` - follow feed with key = `id`


## `contact.async.unfollow`

`(id, cb)` - unfollow feed with key = `id`


## `contact.async.followerOf`

...


## `contact.async.block`

`(id, cb)` - block feed with key = `id`

Note that blocking influences the observeable state of following, followers, blockers, blocking, 


## `contact.async.unblock`

`(id, cb)` - unblock feed with key = `id`


## `contact.obs.following`

`(id)` returns an observeable which resolves to an array of feeds that `id` is following


## `contact.obs.followers`

`(id)` returns an observeable which resolves to an array of feeds that follow `id`


## `contact.obs.blocking`

`(id)` returns an observeable which resolves to an array of feeds that `id` is blocking


## `contact.obs.blockers`

`(id)` returns an observeable which resolves to an array of feeds that block `id`


# Emoji

## `emoji.sync.names`

returns the list of [emoji-named-characters](http://npm.im/emoji-named-characters)

## `emoji.sync.url`

returns the url for the image for a specific emoji name.

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

# Invite

## `invite.async.accept(invite, cb)`

accept an invite code.

## `invite.async.autofollow(invite, cb)

check wether you are already following the pub in the invite, and if not accept the invite.

# keys

## `keys.sync.load()`

return the keys to the main identity.

## `keys.sync.id`

return the main identity
# Message

## `message.async.name(id, cb)`

read the message from the database an cb a short teaser (say, the first 40 chars in the post)
that can be used as the message name (in the worst case, the id is truncated to 10 chars)

## `message.async.publish(content, cb)`

publishes a message. wraps `sbot.async.publish`

## `message.obs.author(id)`

returns an observable that resolves to the id of the auther, once the message has been retrived.

## `message.obs.backlinks(id)`

returns an observable that resolves to an array of metadata about messages that link to `id` (except if they are type `vote` or `about`)

each item has the following fields

* dest
* id
* timestamp
* type
* root
* branch
* author

## `message.obs.get(key, hint)`

returns an observable that wraps `sbot.async.get`. if a message isn't available,
it resolves to a message like object with `{value: {missing: true, author: possibleAuthor}}`

## `message.obs.likes(id)`

returns an observable that resolves to a map of `{<author_id>: [timestamp, vote, expression]}`

## `message.obs.name(id)`

an observable version of `message.async.name`

## `message.html.markdown(content | text)`

returns a HtmlElement `div` with `Markdown` classname, that has the markdown rendered
inside of it. Because of some legacy quirks of patchwork@2, and historic messages
that should still be displayed correctly, the markdown method takes the `content`
of the ssb message - i.e `{text: <markdown_string>, mentions: [{name: <string>, link: <@id>}]}`
this will mean all markdown mentions are rendered into links correctly.

## `message.html.timestamp(msg)`

renders a link to a message, shown as a relative time passed since that message was written,
for example "1 week ago"

## `message.html.meta(msg)`

a when loaded as a [depject map](https://github.com/depject/depject#map---get-each-modules-opinion-about-a-thing)
will return an array of rendered metadatas about a message. Patchcore only provides the channel,
patchbay adds several other things. patchwork does not use this, instead it hardcodes all the
message metadata.

## `message.html.*`

* `message.html.action` returnns a button that applies an action to a message. (such as like or reply)
* `message.html.blacklinks` returns an html element for `message.obs.backlinks`
* `message.html.layout(msg, opts={content})` returns an html wrapper for a message, an html element, content must be provided.

... and a bunch more

# Router

## Adding routes

Patchcore collects _routes_ from `router.sync.routes` as a reduce. It expects the final routes collection to be an array of arrays of the form:

```
  [ routeValidator, routeFunction ]
```

Where `routeValidator` is a function that returns true / false when given a `location` object.

Here's a simple example of extending the routes

```js
exports.create = (api) => {
  return { router: { sync: { routes } } }

  function routes (sofar = []) {
    const moreRoutes = [
      [ (location) => location.page === 'home',  api.app.page.home ],
      [ (location) => location.type === 'group', api.app.page.group ],
      [ ()         => true,                      api.app.page.notFound ]
    ]

    return [...moreRoutes, ...sofar]
    // Note order matters here
  }
}
```


## Using the router

The router is accessible at `app.sync.router`, and can be used like :

```js
const location = { page: 'inbox', theme: 'dark' }
const newView = api.app.sync.router(location)
```

The router finds the first route which matches the location it is passed, then automatically calls the associated `routeFunction` with the `location` object as an argument.

In our example the route is generating a view, which we might insert / append to the DOM, but this doesn't have to be the case.



# Sbot

just wraps everything on the sbot api, except renames things to the art-hack naming style.

## `sbot.sync.cache()`

returns the message cache. I don't think anything uses this.

## `sbot.async.get(id|opts, cb)`

calls [`sbot.get(id|opts, cb)`](https://github.com/ssbc/ssb-db/#sbotget-id--seq--opts-cb)

## `sbot.async.publish(content, cb)`

calls [`sbot.publish(content, cb)`](https://github.com/ssbc/ssb-db/#sbotpublishcontent-cb)

## `sbot.async.addBlob(buffer, cb)`

calls `sbot.blobs.add()` except as an async function instead of a stream.
[ssb-blobs](https://github.com/ssbc/ssb-blobs)

## `sbot.async.gossipConnect(opts, cb)`

calls [`sbot.gossip.connect(opts, cb)`](https://github.com/ssbc/ssb-gossip/blob/master/api.md#connect-async)

## `sbot.friendsGet(opts, cb)`

calls [sbot.friends.get(opts, cb)](https://github.com/ssbc/ssb-friends#get-source-dest-cb)

## `sbot.pull.backlinks(query)`

calls `sbot.backlinks.read(query)` [ssb-backlinks](https://github.com/ssbc/ssb-backlinks)

## `sbot.pull.userFeed(opts)`

calls [`sbot.createUserStream(opts)`](https://github.com/ssbc/ssb-db/#sbotcreateuserstream-id-feed_id-ltltegtgte-sequence-reverseoldliveraw-boolean-limit-number)

## `sbot.pull.feed(opts)`

calls [`sbot.createFeedStream(opts)`](https://github.com/ssbc/ssb-db/#sbotcreatefeedstream-ltltegtgte-timestamp-reverseoldliveraw-boolean-limit-number)

## `sbot.pull.messagesByType(opts)`

calls [`sbot.messagesByType(opts)`](https://github.com/ssbc/ssb-db/#ssbdbmessagesbytype-type-string-liveoldreverse-bool-gtgteltlte-timestamp-limit-number----pullsource)

## `sbot.pull.feed(opts)`

calls [`sbot.createFeedStream(opts)`](https://github.com/ssbc/ssb-db/#sbotcreatefeedstream-ltltegtgte-timestamp-reverseoldliveraw-boolean-limit-number)

## `sbot.pull.log(opts)`

calls [sbot.createLogStream(opts)](https://github.com/ssbc/ssb-db/#ssbdbcreatelogstreamltltegtgte-timestamp-reverseoldliveraw-boolean-limit-number--pullsource)

## `sbot.pull.links(opts)`

calls [sbot.links(opts)](https://github.com/ssbc/ssb-db/#ssbdblinks-source-feedid-dest-feedidmsgidblobid-rel-string-meta-true-keys-true-values-false-livefalse-reverse-false---pullsource)

## `sbot.pull.stream(createStream(sbot))`

takes a function that returns a stream, that will be called once the backend is connected.
the createStream function will be passed an _ordinary_ instance of muxrpc, it is _not_ renamed
to arthack style.

## `sbot.obs.connectionStatus(listener)

assigns a listener to observable of connection status.

## `sbot.obs.connection(listener)`

assigns a listener to observable of connection status.

## `sbot.obs.connectedPeers()`

returns the `connectedPeers` observable.

## `sbot.obs.localPeers()`

returns the `localPeers` observable.

