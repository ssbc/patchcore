const Value = require('mutant/value')
const computed = require('mutant/computed')
const nest = require('depnest')
const human = require('human-time')

exports.gives = nest('obs.timeAgo')

exports.create = function (api) {
  return nest('obs.timeAgo', timeAgo)
    
  function timeAgo (timestamp) {
    var timer
    var value = Value(Time(timestamp))
    return computed([value], (a) => a, {
      onListen: () => {
        timer = setInterval(refresh, 5e3)
        refresh()
      },
      onUnlisten: () => {
        clearInterval(timer)
      }
    })

    function refresh () {
      value.set(Time(timestamp))
    }
  }
}

function Time (timestamp) {
  return human(new Date(timestamp))
    .replace(/minute/, 'min')
    .replace(/second/, 'sec')
}
