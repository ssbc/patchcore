var nest = require('depnest')
var pull = require('pull-stream')

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
 * A 'sync' observable property is also added to the returned observable
 * which is 'true' when all previously seen messages are caught up with.
 *
 * Note: Unlike backlinks.obs.for this does not cache the observable for
 * callers that supply the same arguments.
 */
exports.create = function (api) {

  var backlinksCache = api.backlinks.obs.cache();

  function pullFilterReduceObs (id, opts) {
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

    // If a filter function is supplied in the options, we use it to filter
    // the links stream, otherwise we use all the messages from the stream
    var filterFunction = opts && opts.filter ? opts.filter : () => true

    var filteredBacklinks = pull(
      msgBacklinks,
      // We need to allow 'msg.sync' even if the supplied filter function does not
      // match it to allow mutant-pull-reduce to handle it for us and set the
      // 'sync' observable to indicate that the list is up to date with the messages
      // received so far.
      pull.filter(msg => msg.sync || filterFunction(msg))
    )

    return backlinksCache.cachedBacklinks(id, filteredBacklinks)
  }

  return nest({
    'backlinks.obs.filter': (id, opts) => pullFilterReduceObs(id, opts)
  })
}
