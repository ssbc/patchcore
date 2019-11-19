var computed = require('mutant/computed')
var h = require('mutant/h')
var nest = require('depnest')

exports.needs = nest({
  'about.obs.name': 'first'
})

exports.gives = nest('about.html.link')

function toHoverText(id, displayNameObs) {
  return computed([displayNameObs], displayName => `${displayName} (${id})`)
}

exports.create = function (api) {
  return nest('about.html.link', function (id, text = null) {
    var displayName = api.about.obs.name(id)
    var displayNameAndId = toHoverText(id, displayName)
    return h('a', { href: id, title: displayNameAndId, alt: displayName }, text || displayName)
  })
}
