const h = require('../h')

exports.needs = { 
  metas: 'map'
}

exports.gives = {
  message_components: true
}

exports.create = function (api) {
  return {
    message_components: metas
  }

  function metas (msg) {
    return h('div', api.metas(msg))
  }
}


