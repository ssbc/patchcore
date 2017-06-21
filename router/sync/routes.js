const nest = require('depnest')

exports.gives = nest('router.sync.routes')

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => sofar)
}

