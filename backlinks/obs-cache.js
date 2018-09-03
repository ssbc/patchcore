var Value = require('mutant/value')
var computed = require('mutant/computed')
var Abortable = require('pull-abortable')
var resolve = require('mutant/resolve')
var pull = require('pull-stream')
var onceIdle = require('mutant/once-idle')
var nest = require('depnest')

exports.gives = nest('backlinks.obs.cache', true)

exports.create = function (api) {

  return nest({
    'backlinks.obs.cache': (cacheForMilliSeconds) => createCache(cacheForMilliSeconds)
  })
}

/**
 * Creates a cache for backlinks observables by thread ID. The cache entry is an obserable
 * list of messages built from a backlinks stream. The cache is evicted if there are no
 * listeners for the given backlinks observable for the configured amount of time,
 * or a default of 5 seconds
 */
function createCache(cacheForMilliSeconds) {

  var cache = {}

  var newRemove = new Set()
  var oldRemove = new Set()

  function use (id) {
    newRemove.delete(id)
    oldRemove.delete(id)
  }

  function release (id) {
    newRemove.add(id)
  }

  var timer = setInterval(() => {
    oldRemove.forEach(id => {
      if (cache[id]) {
        cache[id].destroy()
        delete cache[id]
      }
    })
    oldRemove.clear()

    // cycle
    var hold = oldRemove
    oldRemove = newRemove
    newRemove = hold
  }, cacheForMilliSeconds || 5e3)

  if (timer.unref) timer.unref()

  /**
   * Takes a thread ID (for the cache ID) and a pull stream to populate the
   * backlinks observable with. After the backlinks obserable is unsubscribed
   * from it is cached for the configured amount of time before the pull stream
   * is aborted unless there is a new incoming listener
   */
  function cachedBacklinks (id, backlinksPullStream) {

    if (!cache[id]) {
      var sync = Value(false)
      var aborter = Abortable()
      var collection = Value([])

      // try not to saturate the thread
      onceIdle(() => {
        pull(
          backlinksPullStream,
          aborter,
          pull.drain((msg) => {
            if (msg.sync) {
              sync.set(true)
            } else {
              var value = resolve(collection)
              value.push(msg)
              collection.set(value)
            }
          })
        )
      })

      cache[id] = computed([collection], x => x, {
        onListen: () => use(id),
        onUnlisten: () => release(id)
      })

      cache[id].destroy = aborter.abort
      cache[id].sync = sync
    }
    return cache[id]
  }

  return {
    cachedBacklinks: cachedBacklinks
  }
}
