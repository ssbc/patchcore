exports.gives = {
  streams: {
    public: true
  }
}

exports.needs = {
  sbot_log: 'first'
}

exports.create = function (api) {
  return {
    streams: {
      public: api.sbot_log
    }
  }
}
