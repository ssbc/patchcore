var Value = require('mutant/value')
var ref = require('ssb-ref')
var nest = require('depnest')

exports.needs = nest('message.async.name', 'first')

exports.gives = nest('message.obs.name')

exports.create = function (api) {
  return nest('message.obs.name', function (id) {
    if (typeof id !== 'string') { throw new Error('link must be to message id') }
    var value = Value(id.substring(0, 10) + '...')

    if (ref.isMsg(id)) {
      api.message.async.name(id, function (err, name) {
        if (err) console.error(err)
        else value.set(name)
      })
    }

    return value
  })
}
