var h = require('mutant/h')
var nest = require('depnest')

exports.needs = nest({
  'message.html': {
    decorate: 'reduce',
    layout: 'first'
  }
})

exports.gives = nest('message.html.render')

exports.create = function (api) {
  return nest('message.html.render', renderMessage)

  function renderMessage (msg) {
    var element = api.message.html.layout(msg, {
      content: message_content(msg),
      layout: 'mini'
    })

    return api.message.html.decorate(element, { msg })
  }

  function message_content (msg) {
    if (typeof msg.value.content === 'string') {
      return h('code', {}, 'PRIVATE')
    } else {
      return h('code', {}, msg.value.content.type)
    }
  }
}
