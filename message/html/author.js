const h = require('mutant/h')
const nest = require('depnest')

exports.needs = nest('about.obs.name', 'first')

exports.gives = nest('message.html.author')

exports.create = function (api) {
  return nest('message.html.author', message_author)

  function message_author (msg) {
    return h('div', {title: msg.value.author}, [
      '@', api.about.obs.name(msg.value.author)
    ])
  }
}
