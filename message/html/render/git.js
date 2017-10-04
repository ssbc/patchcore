const { h, Value } = require('mutant')
var nest = require('depnest')
var extend = require('xtend')

exports.needs = nest({
  'about.obs.name': 'first',
  'sbot.async.get': 'first',
  'message.html': {
    decorate: 'reduce',
    layout: 'first',
    markdown: 'first'
  }
})

exports.gives = nest('message.html.render')

exports.create = function (api) {
  return nest('message.html.render', channel)

  function channel (msg, opts) {
    if (msg.value.content.type == 'git-update')
    {
      const element = api.message.html.layout(msg, extend({
        title: updateTitle(msg),
        content: renderUpdateContent(msg),
        layout: 'default'
      }, opts))

      return api.message.html.decorate(element, { msg })
    }
    else if (msg.value.content.type == 'git-repo')
    {
      const element = api.message.html.layout(msg, extend({
        content: renderCreateContent(msg),
        layout: 'mini'
      }, opts))

      return api.message.html.decorate(element, { msg })
    }
    if (msg.value.content.type == 'pull-request')
    {
      const element = api.message.html.layout(msg, extend({
        title: pullRequestTitle(msg),
        content: renderPullRequestContent(msg),
        layout: 'default'
      }, opts))

      return api.message.html.decorate(element, { msg })
    }
  }

  function getRepoName(repo) {
    if (repo && repo[0] == '%') {
      const assignedName = api.about.obs.name(repo)
      if (assignedName() == repo.slice(1, 10))
      {
        const name = Value(assignedName())
        api.sbot.async.get(repo, (err, msg) => {
          name.set(msg.content.name)
        })
        return name
      }
      else
        return assignedName
    }
    else if (repo && repo[0] == '#')
      return repo
  }
  
  function pullRequestTitle(msg) {
    return ['Created a pull request in git repo ', h('a', { 'href': 'http://localhost:7718/' + msg.key }, getRepoName(msg.value.content.repo))]
  }

  function renderPullRequestContent (msg) {
    const { content } = msg.value
    return ['Merge branch ', content.head_branch, " into ", content.branch, h("div", api.message.html.markdown(content.text))]
  }

  function renderCreateContent(msg) {
    return ['Created git repo ', h('a', { 'href': 'http://localhost:7718/' + msg.key }, msg.value.content.name)]
  }

  function updateTitle(msg) {
    return ['Updated git repo ', h('a', { 'href': 'http://localhost:7718/' + msg.key }, getRepoName(msg.value.content.repo))]
  }
  
  function renderUpdateContent (msg) {
    if (msg.value.content.commits)
      return h('ul',
               msg.value.content.commits.map(com => { return h('li', com.title); }))
  }
}
