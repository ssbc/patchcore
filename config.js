const Config = require('ssb-config/inject')
const nest = require('depnest')

exports.gives = nest('config.sync.load')
exports.create = (api) => {
  var config
  return nest('config.sync.load', () => {
    if (!config) {
      config = Config(process.env.ssb_appname)
    }
    return config
  })
}
