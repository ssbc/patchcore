var h = require('mutant/h')
var nest = require('depnest')

exports.needs = nest({
  'message.html': {
    decorate: 'reduce',
    layout: 'first',
    link: 'first',
    markdown: 'first'
  }
})

exports.gives = nest('message.html.render')

exports.create = function (api) {
  return nest('message.html.render', function renderMessage (msg) {
    if (msg.value.content.type !== 'post') return
    var element = api.message.html.layout(msg, {
      title: messageTitle(msg),
      content: messageContent(msg),
      layout: 'default'
    })

    return api.message.html.decorate(element, { msg })
  })

  function messageContent (data) {
    if (!data.value.content || !data.value.content.text) return
    return h('div', {}, api.message.html.markdown(data.value.content))
  }

  function messageTitle (data) {
    var root = data.value.content && data.value.content.root
    return !root ? null : h('span', ['re: ', api.message.html.link(root)])
  }
}
