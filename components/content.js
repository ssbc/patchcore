const h = require('../h')

exports.gives = {
  message_components: true
}

exports.create = function (api) {
  return {
    message_components
  }

  function message_components (msg) {
    const content = JSON.stringify(msg.value.content, null, 2)
    return h('div', {}, [
      h('pre', {}, [content])
    ])
  }
}

