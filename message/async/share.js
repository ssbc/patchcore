const nest = require('depnest')
const ref = require('ssb-ref')


exports.gives = nest('message.async.share')

exports.needs = nest({
  'sbot.async.publish': 'first'
})

exports.create = function (api) {
  return nest('message.async.share', function (kind, msg, captionOrUrl, cb) {
    try {
      let key = kind === 'internal' ? 'text' : 'url'
      let share = {
        type: 'share',
        share: { link: msg.key, content: msg.value.content.type, [key]: captionOrUrl }
      }
      if (msg.value.content.recps) {
        share.recps = msg.value.content.recps.map(function (e) {
          return e && typeof e !== 'string' ? e.link : e
        })
        share.private = true
      }
      api.sbot.async.publish(share, cb)
    } catch (n) {
      cb({ error: "exception", msg: n.message }, null)
    }
  })
}

