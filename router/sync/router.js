const nest = require('depnest')
const { isBlob, isFeed, isMsg } = require('ssb-ref')

exports.gives = nest('router.sync.router')

exports.needs = nest('router.sync.routes', 'reduce')

exports.create = (api) => {
  var _router = null

  return nest('router.sync.router', (location) => {
    if (!_router) {
      const routes = api.router.sync.routes()
      _router = buildRouter(routes)
    }

    const locationObject = normalise(location)
    return _router(locationObject)
  })
}

function normalise(location) {
  if (typeof location === 'object') return location

  if (isBlob(location)) return { blob: location }
  if (isChannel(location)) return { channel: location }
  if (isFeed(location)) return { feed: location }
  if (isMsg(location)) return { msg: location }
}

function isChannel (str) {
  return typeof str === 'string' && str[0] === '#' && str.length > 1
}

function buildRouter (routes) {
  return (location) => {
    const route = routes.find(([validator]) => validator(location))
    // signature of a route is [ routeValidator, routeFunction ]

    if (route) return route[1](location)
  }
}

