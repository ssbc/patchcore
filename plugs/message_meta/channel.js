const h = require('mutant/h')

exports.gives = 'message_meta'

exports.create = function (api) {
  return function channel (msg) {
    const { channel } = msg.value.content
    if (channel) return h('span', {}, ['#' + channel])
  }
}
