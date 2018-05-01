const nest = require('depnest')
const ref = require('ssb-ref')

exports.gives = nest('message.sync.isShare')

exports.create = function (api) {
  return nest('message.sync.isShare', function (kind, content) {
    try {
      let key = kind === 'internal' ? 'text' : 'url'

      if (content.type !== 'share') return false

      // breaking long if conditions into multiple lines dead ugly
      // but it is better than scrolling horizontally.
      if (!content.share
        || !content.share.link
        || !ref.isMsg(content.share.link)
        || !content.share.hasOwnProperty(key)
      ) {
        return false
      }

      return true
    } catch (n) {
      return false
    }
  })
}
