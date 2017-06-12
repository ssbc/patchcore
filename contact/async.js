var nest = require('depnest')
var onceTrue = require('mutant/once-true')
var resolve = require('mutant/resolve')
var ref = require('ssb-ref')

exports.needs = nest({
  'contact.obs.following': 'first',
  'sbot.async.publish': 'first'
})

exports.gives = nest({
  'contact.async': ['follow', 'unfollow', 'followerOf']
})

exports.create = function (api) {
  return nest({
    'contact.async': {follow, unfollow, followerOf}
  })

  function followerOf (source, dest, cb) {
    var following = api.contact.obs.following(source)
    onceTrue(following.sync, () => {
      var value = resolve(following)
      cb(null, value && value.has(dest))
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
}
