'use strict'
var ref = require('ssb-ref')
var ssbClient = require('ssb-client')
var Value = require('mutant/value')
var nest = require('depnest')

exports.needs = nest({
  'sbot.async.publish': 'first',
  'sbot.async.gossipConnect': 'first',
  'contact.async.followerOf': 'first',
  'keys.sync.id': 'first'
})

exports.gives = nest('invite.async.accept')

exports.create = function (api) {
  return nest('invite.async.accept', function (invite, cb) {
    var progress = Value('Connecting...')
    var data = ref.parseInvite(invite)
    var id = api.keys.sync.id()
    if (!data) return cb(new Error('Not a valid invite code. Please make sure you copied the entire code and try again.'))

    api.sbot.async.gossipConnect(data.remote, function (err) {
      if (err) console.log(err)
    })

    // connect to the remote pub using the invite code
    ssbClient(null, {
      remote: data.invite,
      manifest: { invite: {use: 'async'}, getAddress: 'async' }
    }, function (err, sbot) {
      if (err) return cb(err)
      progress.set('Requesting follow...')

      // ask them to follow us
      sbot.invite.use({feed: id}, function (err, msg) {
        if (err) {
          // the probably already follow us
          api.contact.async.followerOf(id, data.key, function (_, follows) {
            if (follows) {
              cb()
            } else {
              next()
            }
          })
        } else {
          next()
        }

        function next () {
          progress.set('Following...')

          var address = ref.parseAddress(data.remote)

          if (address.host) {
            api.sbot.async.publish({
              type: 'pub',
              address
            })
          }

          api.sbot.async.publish({
            type: 'contact',
            contact: data.key,
            following: true
          }, cb)
        }
      })
    })

    return progress
  })
}
