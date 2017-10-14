var nest = require('depnest')
var sort = require('ssb-sort')
var ref = require('ssb-ref')
var { Array: MutantArray, Value, map, concat, computed } = require('mutant')

exports.needs = nest({
  'backlinks.obs.for': 'first',
  'sbot.async.get': 'first',
  'message.sync.unbox': 'first',
  'message.sync.root': 'first',
  'message.sync.isBlocked': 'first'
})

exports.gives = nest('feed.obs.thread')

exports.create = function (api) {
  return nest('feed.obs.thread', thread)

  function thread (rootId, { branch } = {}) {
    if (!ref.isLink(rootId)) throw new Error('an id must be specified')
    var sync = Value(false)
    var { isBlocked, root } = api.message.sync

    var prepend = MutantArray()
    api.sbot.async.get(rootId, (err, value) => {
      sync.set(true)
      if (!err) {
        var msg = unboxIfNeeded({key: rootId, value})
        if (isBlocked(msg)) msg.isBlocked = true
        prepend.push(Value(msg))
      }
    })

    var backlinks = api.backlinks.obs.for(rootId)
    var replies = map(computed(backlinks, (msgs) => {
      return msgs.filter(msg => {
        const { type, branch } = msg.value.content
        return type !== 'vote' && !isBlocked(msg) && (root(msg) === rootId || matchAny(branch, rootId))
      })
    }), x => Value(x), {
      // avoid refresh of entire list when items added
      comparer: (a, b) => a === b
    })

    var messages = concat([prepend, replies])

    var result = {
      messages,
      lastId: computed(messages, (messages) => {
        var branches = sort.heads(messages)
        if (branches.length <= 1) {
          branches = branches[0]
        }
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

    result.sync = computed([backlinks.sync, sync], (a, b) => a && b, {idle: true})
    return result
  }

  function unboxIfNeeded (msg) {
    if (msg.value && typeof msg.value.content === 'string') {
      return api.message.sync.unbox(msg) || msg
    } else {
      return msg
    }
  }
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

function matchAny (valueOrArray, compare) {
  if (valueOrArray === compare) {
    return true
  } else if (Array.isArray(valueOrArray)) {
    return valueOrArray.includes(compare)
  }
}
