const h = require('mutant/h')

exports.needs = {
  obs_about_name: 'first'
}

exports.gives = {
  message_author: true
}

exports.create = function (api) {
  return {
    message_author
  }

  function message_author (msg) {
    return h('div', {}, [
      api.obs_about_name(msg.value.author)
    ])
  }
}
