var nest = require('depnest')
var { Value, Dict, computed } = require('mutant')
var pull = require('pull-stream')
var ref = require('ssb-ref')

exports.needs = nest({
  'sbot.pull.stream': 'first'
})

exports.gives = nest({
  'contact.obs': ['following', 'followers', 'blocking', 'blockers'],
  'sbot.hook.publish': true
})

exports.create = function (api) {
  var cacheLoading = false
  var cache = Dict()
  var sync = Value(false)

  return nest({
    'contact.obs': {
      following: following,
      followers: followers, 
      // blocking: (id) => values(get(id), 'blocking', true),
      // blockers: (id) => values(get(id), 'blockers', true),
    },
    'sbot.hook.publish': function (msg) {
      // TODO ???
      // if (isContact(msg)) {
      //   // HACK: make interface more responsive when sbot is busy
      //   var source = msg.value.author
      //   var dest = msg.value.content.contact

      //   if (typeof msg.value.content.following === 'boolean') {
      //     update(source, {
      //       following: {
      //         [dest]: [msg.value.content]
      //       }
      //     })
      //     update(dest, {
      //       followers: {
      //         [source]: [msg.value.content]
      //       }
      //     })
      //   }
      //   if (typeof msg.value.content.blocking === 'boolean') {
      //     update(source, {
      //       blocking: {
      //         [dest]: [msg.value.content]
      //       }
      //     })
      //     update(dest, {
      //       blockers: {
      //         [source]: [msg.value.content]
      //       }
      //     })
      //   }
      // }
    }
  })

  function following (key) {
    var obs = computed(get(key), state => {
      return Object.keys(state)
        .reduce((sofar, next) => {
          if (state[next]) return [...sofar, next]
          else return sofar
        }, [])
    })

    obs.sync = sync
    return obs
  }

  function followers (key) {
    var obs = computed(cache, cache => {
      return Object.keys(cache)
        .reduce((sofar, next) => {
          if (cache[next][key]) return [...sofar, next]
          else return sofar
        }, [])
    })

    obs.sync = sync
    return obs
  }

  function loadCache () {
    pull(
      api.sbot.pull.stream(sbot => sbot.friends.stream({live: true})),
      pull.drain(item => {
        for (var source in item) {
          if (ref.isFeed(source)) update(source, item[source])
        }

        if (!sync()) {
          sync.set(true)
        }
      })
    )
  }

  function update (sourceId, values) {
    // ssb-friends: values = {
    //   keyA: true|null|false (friend, neutral, block)
    //   keyB: true|null|false (friend, neutral, block)
    // }
    var state = get(sourceId)
    var lastState = state()
    var changed = false
    for (var targetId in values) {
      if (values[targetId] != lastState[targetId]) {
        lastState[targetId] = values[targetId]
        changed = true
      }
    }

    if (changed) {
      state.set(lastState)
    }
  }

  function get (id) {
    if (!ref.isFeed(id)) throw new Error('Contact state requires an id!')
    if (!cacheLoading) {
      cacheLoading = true
      loadCache()
    }
    if (!cache.has(id)) {
      cache.put(id, Value({}))
    }
    return cache.get(id)
  }
}

function isContact (msg) {
  return msg.value && msg.value.content && msg.value.content.type === 'contact'
}

