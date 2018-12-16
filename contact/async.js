var nest = require('depnest')
var ref = require('ssb-ref')

const isString = (s) => typeof s === 'string'

const handleInput = (input) => {
  if (isString(input)) {
    return { id: input }
  } else {
    return input
  }
}

exports.needs = nest({
  'contact.obs.following': 'first',
  'sbot.async.publish': 'first',
  'sbot.async.friendsGet': 'first',
  'keys.sync.id': 'first',
})

exports.gives = nest({
  'contact.async': ['follow', 'unfollow', 'followerOf', 'block', 'unblock']
})

exports.create = function (api) {
  return nest({
    'contact.async': { follow, unfollow, followerOf, block, unblock }
  })

  function publishContact (msg, opts, cb) {
    const { id, private } = opts

    if (private === true) {
      msg.recps = [ api.keys.sync.id() ]
    }

    const fullMessage = Object.assign({}, {
      type: 'contact',
      contact: id,
    }, msg)

    api.sbot.async.publish(fullMessage, cb)
  }

  function followerOf (source, dest, cb) {
    api.sbot.async.friendsGet({ source: source, dest: dest }, cb)
  }

  function follow (opts, cb) {
    opts = handleInput(opts)
    const { id } = opts

    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')
    publishContact({ following: true }, cb)
  }

  function unfollow (opts, cb) {
    opts = handleInput(opts)
    const { id } = opts
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')

    publishContact({ following: false }, opts, cb)
  }

  function block (opts, cb) {
    opts = handleInput(opts)
    const { id } = opts
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')

    publishContact({ blocking: true }, opts, cb) }

  function unblock (opts, cb) {
    opts = handleInput(opts)
    const { id } = opts
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')

    publishContact({ blocking: false }, opts, cb) }
}
