var h = require('mutant/h')

exports.needs = {
  message_decorate: 'reduce',
  message_layout: 'first',
  message_link: 'first',
  markdown: 'first'
}

exports.gives = {
  message_render: true
}

exports.create = function (api) {
  return {
    message_render
  }

  function message_render (msg) {
    if (msg.value.content.type !== 'post') return
    var element = api.message_layout(msg, {
      title: message_title(msg),
      content: message_content(msg),
      layout: 'default'
    })

    return api.message_decorate(element, { msg })
  }

  function message_content (data) {
    if (!data.value.content || !data.value.content.text) return
    return h('div', {}, api.markdown(data.value.content))
  }

  function message_title (data) {
    var root = data.value.content && data.value.content.root
    return !root ? null : h('span', ['re: ', api.message_link(root)])
  }
}
