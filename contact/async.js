var nest = require('depnest')
var ref = require('ssb-ref')

exports.needs = nest({
  'keys.sync.id': 'first',
  'contact.obs.following': 'first',
  'sbot.async.publish': 'first',
  'sbot.async.friendsGet': 'first'
})

exports.gives = nest({
  'contact.async': ['follow', 'unfollow', 'followerOf', 'block', 'unblock']
})

exports.create = function (api) {
  return nest({
    'contact.async': {follow, unfollow, followerOf, block, unblock, merge, unmerge}
  })

  function followerOf (source, dest, cb) {
    api.sbot.async.friendsGet({source: source, dest: dest}, cb)
  }

  function merge (from, to, cb) {
    if (!ref.isFeed(from) || !ref.isFeed(to)) throw new Error('a `from` and `to` feed id must be specified')
    var author = api.keys.sync.id()
    followerOf(author, to, (err, following) => {
      if (err) { if (cb) { return cb(err) } else throw err }

      // if merging with self, make sure you follow your own identity for pub backwards compatibility
      if (author === from || to === from) following = true

      if (!following) following = undefined // don't add the key if it is empty
      api.sbot.async.publish({
        type: 'contact',
        contact: to,
        sameAs: from === author ? true : {[from]: true},
        // HACK: add the current `following` state for backwards compatibility with old pubs
        // see https://github.com/ssbc/ssb-friends/issues/8
        following
      }, cb)
    })
  }

  function unmerge (from, to, cb) {
    if (!ref.isFeed(from) || !ref.isFeed(to)) throw new Error('a `from` and `to` feed id must be specified')
    var author = api.keys.sync.id()
    followerOf(author, to, (err, following) => {
      if (err) { if (cb) { return cb(err) } else throw err }
      if (!following) following = undefined // don't add the key if it is empty (unnecessary)
      api.sbot.async.publish({
        type: 'contact',
        contact: to,
        sameAs: from === author ? false : {[from]: false},
        // HACK: add the current `following` state for backwards compatibility with old pubs
        // see https://github.com/ssbc/ssb-friends/issues/8
        following
      }, cb)
    })
  }

  function follow (id, cb) {
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')
    api.sbot.async.publish({
      type: 'contact',
      contact: id,
      following: true
    }, cb)
  }

  function unfollow (id, cb) {
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')
    api.sbot.async.publish({
      type: 'contact',
      contact: id,
      following: false
    }, cb)
  }

  function block (id, cb) {
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')
    api.sbot.async.publish({
      type: 'contact',
      contact: id,
      following: false,
      blocking: true
    }, cb)
  }

  function unblock (id, cb) {
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')
    api.sbot.async.publish({
      type: 'contact',
      contact: id,
      blocking: false
    }, cb)
  }
}
