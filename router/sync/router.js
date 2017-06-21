const nest = require('depnest')
const sheetRouter = require('sheet-router')

exports.gives = nest('router.sync.router')

exports.needs = nest('router.sync.routes', 'reduce')

exports.create = (api) => {
  var _router = null
  return nest('router.sync.router', router)

  function router (path) {
    if (_router) return _router(path)

    _router = sheetRouter(
      {default: '/'},
      api.router.sync.routes()
    )
    return _router(path)
  }
}

