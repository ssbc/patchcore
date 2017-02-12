exports.gives = {
  feeds: {
    public: true
  }
}

exports.needs = {
  sbot_log: 'first'
}

exports.create = function (api) {
  return {
    feeds: {
      public: api.sbot_log
    }
  }
}
