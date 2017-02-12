const h = require('mutant/h')

exports.gives = {
  message_meta: true
}

exports.create = function (api) {
  return {
    message_meta: channel
  }

  function channel (msg) {
    const { channel } = msg.value.content
    if (channel) return h('span', {}, ['#' + channel])
  }
}
