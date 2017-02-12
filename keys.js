const Path = require('path')
const Keys = require('ssb-keys')

module.exports = {
  needs: { config: 'first' },
  gives: 'keys',
  create: (api) => {
    var keys
    return () => {
      if (!keys) {
        const config = api.config()
        const keyPath = Path.join(config.path, 'secret')
        keys = Keys.loadOrCreateSync(keyPath)
      }
      return keys
    }
  }
}
