var h = require('mutant/h')

exports.needs = {
  message_layout: 'first'
}

exports.gives = {
  message_render: true
}

exports.create = function (api) {
  return {
    message_render
  }

  function message_render (msg) {
    return api.message_layout(msg, {
      content: message_content(msg),
      layout: 'mini'
    })
  }

  function message_content (msg) {
    if (typeof msg.value.content === 'string') {
      return h('code', {}, 'PRIVATE')
    } else {
      return h('code', {}, msg.value.content.type)
    }
  }
}
