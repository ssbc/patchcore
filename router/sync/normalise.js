const nest = require('depnest')
const { isBlob, isFeed, isMsg } = require('ssb-ref')

exports.gives = nest('router.sync.normalise')

exports.create = (api) => nest('router.sync.normalise', normalise)

function normalise (location) {
  if (typeof location === 'object') return location

  if (isBlob(location)) return { blob: location }
  if (isChannel(location)) return { channel: location }
  if (isFeed(location)) return { feed: location }
  if (isMsg(location)) return { key: location }
  if (isPage(location)) return { page: location.substring(1) }
}

function isChannel (str) {
  return typeof str === 'string' && str[0] === '#' && str.length > 1
}

function isPage (str) {
  return typeof str === 'string' && str[0] === '/' && str.length > 1
}
