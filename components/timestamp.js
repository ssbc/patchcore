const h = require('../h')

exports.gives = {
  message_components: true
}

exports.create = function (api) {
  return {
    message_components
  }

  function message_components (msg) {
    return h('div', new Date(msg.value.timestamp).toString())
  }
}

