let nest = require('depnest')
let ref = require('ssb-ref')
let MutantArray = require('mutant/array')
let concat = require('mutant/concat')

let { computed } = require('mutant')

exports.needs = nest({
  'message.sync.unbox': 'first',
  'backlinks.obs.for': 'first',
  'message.sync.isShare': 'first'
})

exports.gives = nest({
  'sbot.hook.publish': true,
  'message.obs.webshares': true
})

exports.create = function (api) {
  let activeShares = new Set()
  let isShare = api.message.sync.isShare
  return nest({
    'sbot.hook.publish': (msg) => {
      if (!(msg && msg.value && msg.value.content)) return
      if (typeof msg.value.content === 'string') {
        msg = api.message.sync.unbox(msg)
        if (!msg) return
      }

      let c = msg.value.content

      if (!isShare('external', c)) return

      activeShares.forEach((shares) => {
        if (shares.id === c.share.link) {
          shares.push(msg)
        }
      })
    },
    'message.obs.webshares': (id) => {
      if (!ref.isLink(id)) throw new Error('an id must be specified')
      let obs = get(id)
      obs.id = id
      let result = computed(obs, getShares, {
        // allow manual append for simulated realtime
        onListen: () => activeShares.add(obs),
        onUnlisten: () => activeShares.delete(obs)
      })
      result.sync = obs.sync
      return result
    }
  })

  function get(id) {
    let backlinks = api.backlinks.obs.for(id)
    let merge = MutantArray()

    let shares = computed([backlinks.sync, concat([backlinks, merge])], (sync, backlinks) => {
      if (sync) {
        return backlinks.reduce((result, msg) => {
          let c = msg.value.content
          if (isShare('external', c) && c.share.link === id) {
            let value = result[msg.value.author]
            if (!value || value[0] < msg.value.timestamp) {
              result[msg.value.author] = [msg.value.timestamp, c.share.url]
            }
          }
          return result
        }, {})
      } else {
        return {}
      }
    })

    shares.push = merge.push
    shares.sync = backlinks.sync
    return shares
  }
}

function getShares(shares) {
  return Object.keys(shares).reduce((result, id) => {
    if (shares[id].length >= 1) {
      result.push(id)
    }
    return result
  }, [])
}