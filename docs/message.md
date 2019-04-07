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

