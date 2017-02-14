const Path = require('path')
const Keys = require('ssb-keys')
const nest = require('depnest')

exports.needs = nest('config.sync.load', 'first')
exports.gives = nest('keys.sync.load')
exports.create = (api) => {
  return nest('keys.sync.load', () => {
    var keys
    if (!keys) {
      const config = api.config.sync.load()
      const keyPath = Path.join(config.path, 'secret')
      keys = Keys.loadOrCreateSync(keyPath)
    }
    return keys
  })
}
