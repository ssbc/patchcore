var nest = require('depnest')
var pull = require('pull-stream')
var Value = require('mutant/value')
var computed = require('mutant/computed')
var Abortable = require('pull-abortable')
var onceIdle = require('mutant/once-idle')
var resolve = require('mutant/resolve')

exports.needs = nest({
  'sbot.pull.backlinks': 'first',
  'backlinks.obs.cache': 'first'
})

exports.gives = nest('backlinks.obs.filter', true)

/**
 * sbot.obs.filter returns an observable list of messages that link
 * back to the message with the given message ID (@id). Only messages that
 * pass the filter are added to the list.
 *
 * When a message arrives, if a filter function is given in the options (opts.filter)
 * and passing it to the filter function does not result in it returning
 * 'true' the message is not added to the observable list.
 *
 * An optional backlinks cache (which should be constructed from backlinks.obs.cache) can be
 * supplied with opts.cache. A caller constructed cache is required because different
 * pull stream filters might be used for the same thread ID. If no cache is supplied,
 * the backlinks observables will not be cached.
 *
 * A 'sync' observable property is also added to the returned observable
 * which is 'true' when all previously seen messages are caught up with.
 *
 */
exports.create = function (api) {
  function pullFilterReduceObs (id, filterFunction, backlinksCache) {
    if (!id || typeof (id) !== 'string') {
      throw new Error('id must be a string.')
    }

    var sbotFilter = {
      $filter: {
        dest: id
      }
    }

    var msgBacklinks = api.sbot.pull.backlinks({
      query: [sbotFilter],
      index: 'DTA', // use asserted timestamps
      live: true
    })

    var filteredBacklinks = pull(
      msgBacklinks,
      // We need to allow 'msg.sync' even if the supplied filter function does not
      // match it to allow mutant-pull-reduce to handle it for us and set the
      // 'sync' observable to indicate that the list is up to date with the messages
      // received so far.
      pull.filter(msg => msg.sync || filterFunction(msg))
    )

    if (backlinksCache) {
      return backlinksCache.cachedBacklinks(id, filteredBacklinks)
    } else {
      return backlinksObs(id, filteredBacklinks)
    }
  }

  function backlinksObs (id, backlinksPullStream) {
    var sync = Value(false)
    var aborter = Abortable()
    var collection = Value([])

    var obs = computed([collection], x => x, {
      onListen: () => {
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
      },
      onUnlisten: () => aborter.abort
    })

    obs.sync = sync

    return obs
  }

  return nest({
    'backlinks.obs.filter': (id, opts) => {
      // If a filter function is supplied in the options, we use it to filter
      // the links stream, otherwise we use all the messages from the stream
      var filterFunction = opts && opts.filter ? opts.filter : () => true
      var cache = opts ? opts.cache : null

      return pullFilterReduceObs(id, filterFunction, cache)
    }
  })
}
