var pull = require('pull-stream')
var ref = require('ssb-ref')
var Reconnect = require('pull-reconnect')
var createClient = require('ssb-client')
var createFeed = require('ssb-feed')
var nest = require('depnest')
var Value = require('mutant/value')

var cache = CACHE = {}
var ssbKeys = require('ssb-keys')

exports.needs = nest({
  'config.sync.load': 'first',
  'keys.sync.load': 'first',
  'sbot.obs.connectionStatus': 'first'
})

exports.gives = {
  sbot: {
    async: {
      get: true,
      publish: true
    },
    pull: {
      log: true,
      userFeed: true,
      query: true,
      feed: true
    },
    obs: {
      connectionStatus: true
    }
  }
}

exports.create = function (api) {
  const config = api.config.sync.load()
  const keys = api.keys.sync.load()

  var sbot = null
  var connectionStatus = Value()

  var rec = {
    sync: () => {},
    async: () => {},
    source: () => {}
  }

  var rec = Reconnect(function (isConn) {
    function notify (value) {
      isConn(value); connectionStatus.set(value)
    }

    createClient(keys, {
      manifest: require('./manifest.json'),
      remote: config.remote,
      caps: config.caps
    }, function (err, _sbot) {
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
      async: {
        get: rec.async(function (key, cb) {
          if (typeof cb !== 'function') {
            throw new Error('cb must be function')
          }
          if (CACHE[key]) cb(null, CACHE[key])
          else {
            sbot.get(key, function (err, value) {
              if (err) return cb(err)
              cb(null, CACHE[key] = value)
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
            pull.through(function (e) {
              CACHE[e.key] = CACHE[e.key] || e.value
            })
          )
        }),
        log: rec.source(opts => {
          return pull(
            sbot.createLogStream(opts),
            pull.through(e => {
              CACHE[e.key] = CACHE[e.key] || e.value
            })
          )
        })
      },
      obs: {
        connectionStatus: (listener) => connectionStatus(listener)
      }
    }
  }
}
