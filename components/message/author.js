const h = require('mutant/h')

exports.gives = {
  message_author: true
}

exports.create = function (api) {
  return {
    message_author
  }

  function message_author (msg) {
    return h('div', {}, [msg.value.author.slice(0, 10)])
  }
}
