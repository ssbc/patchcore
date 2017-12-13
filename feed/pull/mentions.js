const nest = require('depnest')
const extend = require('xtend')
const pull = require('pull-stream')
const pullSortedMerge = require('pull-sorted-merge')
const pullMany = require('pull-many')
const pullCat = require('pull-cat')

exports.needs = nest({
  'sbot.pull.backlinks': 'first',
  'message.sync.isBlocked': 'first',
  'lib.nextStepper': 'first'
})

exports.gives = nest('feed.pull.mentions')

exports.create = function (api) {
  // get a stream of messages mentioning any specified ref via ssb-backlinks
  return nest('feed.pull.mentions', function (refs) {
    refs = Array.isArray(refs) ? refs : [refs]
    return function ({old = true, live = false, reverse = false}) {
      // combine multiple mention streams together
      var streamResult = []

      if (old) {
        var streamsToCombine = refs.map(id => getStream(id, {reverse}))
        streamResult.push(pullSortedMerge(streamsToCombine, (a, b) => {
          if (reverse) {
            return b.timestamp - a.timestamp
          } else {
            return a.timestamp - b.timestamp
          }
        }))
      }

      if (live || !old) {
        streamResult.push(pullMany(refs.map(getLiveStream)))
      }

      return pullCat(streamResult)
    }
  })

  function getLiveStream (id) {
    return api.sbot.pull.backlinks({
      old: false,
      index: 'DTS', // recieved timestamp ordering
      query: [
        {$filter: {
          dest: id
        }}
      ]
    })
  }

  function getStream (id, {reverse}) {
    return pull(
      // pull from sbot in batches to make scroll streamin more efficient
      api.lib.nextStepper((opts) => {
        // handle last item passed in as lt
        var lt = (opts.lt && opts.lt.value)
          ? opts.lt.timestamp
          : opts.lt

        opts = extend(opts, {
          lt: undefined,
          index: 'DTS', // recieved timestamp ordering
          query: [
            {$filter: {
              dest: id,
              timestamp: typeof lt === 'number' ? {$lt: lt, $gt: 0} : {$gt: 0}
            }}
          ]
        })

        return api.sbot.pull.backlinks(opts)
      }, {
        reverse, limit: 50
      }),
      pull.filter(msg => !api.message.sync.isBlocked(msg))
    )
  }
}
