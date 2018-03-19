var nest = require('depnest')
var ref = require('ssb-ref')
var onceTrue = require('mutant/once-true')
var About = require('ssb-ooo-about')

exports.needs = nest({
  'contact.obs.following': 'first',
  'sbot.async.publish': 'first',
  'sbot.async.friendsGet': 'first',
  'sbot.obs.connection': 'first'
})

exports.gives = nest({
  'contact.async': ['follow', 'unfollow', 'followerOf', 'block', 'unblock']
})

exports.create = function (api) {

  return nest({
    'contact.async': {follow, unfollow, followerOf, block, unblock}
  })

  function followerOf (source, dest, cb) {
    api.sbot.async.friendsGet({source: source, dest: dest}, cb)
  }

  function follow (id, cb) {
    if (!ref.isFeed(id)) throw new Error('a feed id must be specified')

    onceTrue(api.sbot.obs.connection, sbot => {
      var aboutMessages = About(sbot, {});

      aboutMessages.async.getLatestMsgIds( id, (err, aboutMessageIds) => {

        if (err) {
          cb(err, null)
        } else {
          
          var followMsg = {
            type: 'contact',
            contact: id,
            following: true
          }

          // If the user who is following the user is aware of their assigned
          // name, description and image, we add those as a 'branch' field so
          // a client can see parts of their profile by using ssb-ooo.
          if (aboutMessageIds && aboutMessageIds.length > 0) {
            followMsg['branch'] = aboutMessageIds;
          }

          api.sbot.async.publish(followMsg, cb)
        }
      })

    })
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
