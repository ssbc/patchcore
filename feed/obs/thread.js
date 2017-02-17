var nest = require('depnest')
var pull = require('pull-stream')
var pullCat = require('pull-cat')
var sort = require('ssb-sort')
var { dictToCollection, map, computed, Struct } = require('mutant')

exports.needs = nest({
  'sbot.pull.links': 'first',
  'sbot.async.get': 'first',
  'lib.obs.pullLookup': 'first',
  'message.sync.unbox': 'first'
})

exports.gives = nest('feed.obs.thread')

exports.create = function (api) {
  return nest('feed.obs.thread', function (rootId) {
    var rootMessageStream = pull(
      pull.values([rootId]),
      pull.asyncMap((key, cb) => {
        return api.sbot.async.get(key, (err, value) => cb(err, {key, value}))
      })
    )

    var messageLookup = api.lib.obs.pullLookup(pull(
      pullCat([
        rootMessageStream,
        api.sbot.pull.links({ rel: 'root', dest: rootId, keys: true, values: true, live: true })
      ]),
      unboxIfNeeded()
    ), 'key')

    var orderedIds = computed(messageLookup, (lookup) => {
      var msgs = Object.keys(lookup).map(k => lookup[k])
      return sort(msgs).map(getKey)
    })

    var messages = map(orderedIds, (id) => {
      return messageLookup.get(id)
    })

    var result = Struct({
      rootId, messages
    })

    result.previousKey = function (msg) {
      return PreviousKey(result.messages, msg)
    }

    result.sync = messageLookup.sync

    return result
  })

  function unboxIfNeeded () {
    return pull.map(function (msg) {
      if (msg.sync || (msg.value && typeof msg.value.content === 'object')) {
        return msg
      } else {
        return api.message.sync.unbox(msg)
      }
    })
  }
}

function getKey (msg) {
  return msg.key
}

function PreviousKey (collection, item) {
  return computed(collection, (c) => {
    var index = collection.indexOf(item)
    if (~index) {
      var previous = c[index - 1]
      if (previous) {
        return previous.key
      }
    }
  })
}
