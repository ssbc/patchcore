const combine = require('depject')

const modules = require('./')

const sockets = combine(modules)

// TODO depject.entry(sockets, {
//  app: 'first'
// })()
sockets.app[0]()
