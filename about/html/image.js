var h = require('mutant/h')
var nest = require('depnest')

exports.needs = nest({
  'about.obs.imageUrl': 'first'
})

exports.gives = nest('about.html.image')

exports.create = function (api) {
  return nest('about.html.image', function (id) {
    return h('img', {
      src: api.about.obs.imageUrl(id)
    })
  })
}
