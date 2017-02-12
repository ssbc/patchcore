const h = require('../h')

exports.needs = {
  page: 'first',
}

exports.gives = {
  app: true
}

exports.create = function (api) {
  return {
    app
  }

  function app () {
    const page = h('div', {
      classList: 'App'
    }, [
      api.page()
    ])

    document.body.appendChild(page)
  }
}

