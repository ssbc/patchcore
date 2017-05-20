var nest = require('depnest')
var pull = require('pull-stream')
var pullCat = require('pull-cat')
var sort = require('ssb-sort')
var ref = require('ssb-ref')
var { map, computed } = require('mutant')

exports.needs = nest({
  'sbot.pull.links': 'first',
  'sbot.async.get': 'first',
  'lib.obs.pullLookup': 'first',
  'message.sync.unbox': 'first'
})

exports.gives = nest('feed.obs.thread')

exports.create = function (api) {
  return nest('feed.obs.thread', thread)

  function thread (rootId, { branch } = {}) {
    if (!ref.isLink(rootId)) throw new Error('an id must be specified')

    var rootMessageStream = pull(
      pull.values([rootId]),
      pull.asyncMap((key, cb) => {
        return api.sbot.async.get(key, (err, value) => cb(err, {key, value}))
      })
    )

    var messageLookup = api.lib.obs.pullLookup(pull(
      pullCat([
        rootMessageStream,
        api.sbot.pull.links({ rel: branch ? 'branch' : 'root', dest: rootId, keys: true, values: true, live: true })
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

    var result = {
      messages,
      lastId: computed(messages, (messages) => {
        var branches = sort.heads(messages)
        if(branches.length <= 1) branches = branches[0]
        return branches
      }),
      rootId: computed(messages, (messages) => {
        if (branch && messages.length) {
          return messages[0].value.content.root
        } else {
          return rootId
        }
      }),
      branchId: computed(messages, (messages) => {
        if (branch) return rootId
      }),
      previousKey: function (msg) {
        return PreviousKey(result.messages, msg)
      },
      isPrivate: computed(messages, msgs => {
        if (!msgs[0]) return false

        return msgs[0].value.private || false
      }),
      channel: computed(messages, msgs => {
        if (!msgs[0]) return undefined

        return msgs[0].value.content.channel
      }),
      recps: computed(messages, msgs => {
        if (!msgs[0]) return undefined

        return msgs[0].value.content.recps
      })
    }

    result.sync = messageLookup.sync

    return result
  }

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
