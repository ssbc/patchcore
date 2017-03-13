var pull = require('pull-stream')
var ref = require('ssb-ref')
var Reconnect = require('pull-reconnect')
var createClient = require('ssb-client')
var createFeed = require('ssb-feed')
var nest = require('depnest')
var Value = require('mutant/value')
var ssbKeys = require('ssb-keys')

exports.needs = nest({
  'config.sync.load': 'first',
  'keys.sync.load': 'first',
  'sbot.obs.connectionStatus': 'first',
  'sbot.hook.feed': 'map'
})

exports.gives = {
  sbot: {
    sync: {
      cache: true
    },
    async: {
      get: true,
      publish: true,
      addBlob: true,
      gossipConnect: true
    },
    pull: {
      log: true,
      userFeed: true,
      query: true,
      feed: true,
      links: true,
      search: true,
      replicateProgress: true,
      queryProgress: true
    },
    obs: {
      connectionStatus: true,
      connectedPeers: true,
      localPeers: true
    }
  }
}

exports.create = function (api) {
  const config = api.config.sync.load()
  const keys = api.keys.sync.load()
  var cache = {}

  var sbot = null
  var connectionStatus = Value()
  var connectedPeers = Value([])
  var localPeers = Value([])

  setInterval(refreshPeers, 1e3)

  var rec = Reconnect(function (isConn) {
    function notify (value) {
      isConn(value); connectionStatus.set(value)
    }

    createClient(keys, config, function (err, _sbot) {
      if (err) {
        return notify(err)
      }

      sbot = _sbot
      sbot.on('closed', function () {
        sbot = null
        notify(new Error('closed'))
      })

      notify()
    })
  })

  var internal = {
    getLatest: rec.async(function (id, cb) {
      sbot.getLatest(id, cb)
    }),
    add: rec.async(function (msg, cb) {
      sbot.add(msg, cb)
    })
  }

  var feed = createFeed(internal, keys, {remote: true})

  return {
    sbot: {
      sync: {
        cache: () => cache
      },
      async: {
        get: rec.async(function (key, cb) {
          if (typeof cb !== 'function') {
            throw new Error('cb must be function')
          }
          if (cache[key]) cb(null, cache[key])
          else {
            sbot.get(key, function (err, value) {
              if (err) return cb(err)
              runHooks({key, value})
              cb(null, value)
            })
          }
        }),
        publish: rec.async((content, cb) => {
          if (content.recps) {
            content = ssbKeys.box(content, content.recps.map(e => {
              return ref.isFeed(e) ? e : e.link
            }))
          } else if (content.mentions) {
            content.mentions.forEach(mention => {
              if (ref.isBlob(mention.link)) {
                sbot.blobs.push(mention.link, err => {
                  if (err) console.error(err)
                })
              }
            })
          }

          feed.add(content, (err, msg) => {
            if (err) console.error(err)
            else if (!cb) console.log(msg)
            cb && cb(err, msg)
          })
        }),
        addBlob: rec.async((stream, cb) => {
          return pull(
            stream,
            Hash(function (err, id) {
              if (err) return cb(err)
              // completely UGLY hack to tell when the blob has been sucessfully written...
              var start = Date.now()
              var n = 5
              next()

              function next () {
                setTimeout(function () {
                  sbot.blobs.has(id, function (_, has) {
                    if (has) return cb(null, id)
                    if (n--) next()
                    else cb(new Error('write failed'))
                  })
                }, Date.now() - start)
              }
            }),
            sbot.blobs.add()
          )
        }),
        gossipConnect: rec.async(function (opts, cb) {
          sbot.gossip.connect(opts, cb)
        })
      },
      pull: {
        query: rec.source(query => {
          return sbot.query.read(query)
        }),
        userFeed: rec.source(opts => {
          return sbot.createUserStream(opts)
        }),
        feed: rec.source(function (opts) {
          return pull(
            sbot.createFeedStream(opts),
            pull.through(runHooks)
          )
        }),
        log: rec.source(opts => {
          return pull(
            sbot.createLogStream(opts),
            pull.through(runHooks)
          )
        }),
        links: rec.source(function (query) {
          return sbot.links(query)
        }),
        search: rec.source(function (opts) {
          return sbot.fulltext.search(opts)
        }),
        replicateProgress: rec.source(function (opts) {
          return sbot.replicate.changes()
        }),
        queryProgress: rec.source(function (opts) {
          return sbot.query.progress()
        })
      },
      obs: {
        connectionStatus: (listener) => connectionStatus(listener),
        connectedPeers: () => connectedPeers,
        localPeers: () => localPeers
      }
    }
  }

  // scoped

  function runHooks (msg) {
    if (!cache[msg.key]) {
      cache[msg.key] = msg.value
      api.sbot.hook.feed(msg)
    }
  }

  function refreshPeers () {
    if (sbot) {
      sbot.gossip.peers((err, peers) => {
        if (err) throw console.log(err)
        connectedPeers.set(peers.filter(x => x.state === 'connected').map(x => x.key))
        localPeers.set(peers.filter(x => x.source === 'local').map(x => x.key))
      })
    }
  }
}

function Hash (onHash) {
  var buffers = []
  return pull.through(function (data) {
    buffers.push(typeof data === 'string'
      ? new Buffer(data, 'utf8')
      : data
    )
  }, function (err) {
    if (err && !onHash) throw err
    var b = buffers.length > 1 ? Buffer.concat(buffers) : buffers[0]
    var h = '&' + ssbKeys.hash(b)
    onHash && onHash(err, h)
  })
}
