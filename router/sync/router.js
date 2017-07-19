const nest = require('depnest')

exports.gives = nest('router.sync.router')

exports.needs = nest({
  'router.sync.routes': 'reduce',
  'router.sync.normalise': 'first',
})

exports.create = (api) => {
  var _router = null
  const { routes, normalise } = api.router.sync

  return nest('router.sync.router', (location) => {
    if (!_router) {
      _router = buildRouter(routes())
    }

    const locationObject = normalise(location)
    return _router(locationObject)
  })
}

function buildRouter (routes) {
  return (location) => {
    const route = routes.find(([validator]) => validator(location))
    // signature of a route is [ routeValidator, routeFunction ]

    if (route) return route[1](location)
  }
}

