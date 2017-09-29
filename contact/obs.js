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
      blocking: blocking,
      blockers: blockers
    },
    'sbot.hook.publish': function (msg) {
      if (!isContact(msg)) return

      // HACK: make interface more responsive when sbot is busy
      var source = msg.value.author
      var dest = msg.value.content.contact
      var tristate = ( // from ssb-friends
        msg.value.content.following ? true
      : msg.value.content.flagged || msg.value.content.blocking ? false
      : null
      )

      update(source, { [dest]: tristate })
    }
  })

  // states:
  //   true = following,
  //   null = neutral (may have unfollowed),
  //   false = blocking

  function following (key) {
    var obs = computed(get(key), state => {
      return Object.keys(state)
        .reduce((sofar, next) => {
          if (state[next] === true) return [...sofar, next]
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
          if (cache[next][key] === true) return [...sofar, next]
          else return sofar
        }, [])
    })

    obs.sync = sync
    return obs
  }

  function blocking (key) {
    var obs = computed(get(key), state => {
      return Object.keys(state)
        .reduce((sofar, next) => {
          if (state[next] === false) return [...sofar, next]
          else return sofar
        }, [])
    })

    obs.sync = sync
    return obs
  }

  function blockers (key) {
    var obs = computed(cache, cache => {
      return Object.keys(cache)
        .reduce((sofar, next) => {
          if (cache[next][key] === false) return [...sofar, next]
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
        if (!sync()) {
          // initial dump
          for (var source in item) {
            if (ref.isFeed(source)) update(source, item[source])
          }
          sync.set(true)
        } else {
          // handle realtime updates
          update(item.from, {[item.to]: item.value})
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

