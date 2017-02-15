var Value = require('mutant/value')
var Dict = require('mutant/dict')
var computed = require('mutant/computed')
var pullPause = require('pull-pause')
var nest = require('depnest')
var pull = require('pull-stream')

exports.gives = nest('lib.obs.pullLookup')

exports.create = function (api) {
  return nest('lib.obs.pullLookup', MutantPullLookup)
}

function MutantPullLookup (stream, lookupOrKey) {
  var pauser = pullPause((paused) => {})
  pauser.pause()

  var result = Dict({}, {
    onListen: pauser.resume,
    onUnlisten: pauser.pause,
    fixedIndexing: true
  })

  var sync = Value(false)
  result.sync = computed([sync, result], (v) => v)

  pull(
    stream,
    pauser,
    pull.drain((item) => {
      if (item.sync) {
        sync.set(true)
      } else {
        var key = typeof lookupOrKey === 'function' ? lookupOrKey(item) : item[lookupOrKey]
        result.put(key, item)
      }
    }, () => {
      sync.set(true)
    })
  )

  return result
}
