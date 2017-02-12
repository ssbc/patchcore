const Config = require('ssb-config/inject')

module.exports = {
  gives: 'config',
  create: () => {
    var config
    return () => {
      if (!config) {
        config = Config(process.env.ssb_appname)
      }
      return config
    }
  }
}
