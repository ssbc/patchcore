const h = require('../h')

exports.gives = {
  metas: true
}

exports.create = function (api) {
  return {
    metas: channel
  }

  function channel (msg) {
    const { channel } = msg.value.content
    if (channel) return h('span', {}, ['#'+channel])
  }
}

