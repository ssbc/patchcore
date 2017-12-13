
module.exports = {
  patchcore: {
    config: require('./config'),
    emoji: require('./emoji'),
    invite: require('./invite'),
    keys: require('./keys'),
    sbot: require('./sbot'),
    about: {
      obs: require('./about/obs'),
      sync: require('./about/sync'),
      html: {
        image: require('./about/html/image'),
        link: require('./about/html/link'),
      },
    },
    backlinks: {
      obs: require('./backlinks/obs')
    },
    blob: {
      html: {
        input: require('./blob/html/input'),
      },
      obs: {
        has: require('./blob/obs/has'),
      },
      sync: {
        url: require('./blob/sync/url'),
      },
    },
    channel: {
      obs: {
        recent: require('./channel/obs/recent'),
        subscribed: require('./channel/obs/subscribed'),
      },
      sync: {
        normalize: require('./channel/sync/normalize'),
      }
    },
    contact: {
      async: require('./contact/async'),
      obs: require('./contact/obs'),
    },
    feed: {
      html: require('./feed/html'),
      obs: {
        recent: require('./feed/obs/recent'),
        thread: require('./feed/obs/thread'),
      },
      pull: {
        channel: require('./feed/pull/channel'),
        mentions: require('./feed/pull/mentions'),
        private: require('./feed/pull/private'),
        profile: require('./feed/pull/profile'),
        public: require('./feed/pull/public'),
        rollup: require('./feed/pull/rollup'),
        type: require('./feed/pull/type'),
        unique: require('./feed/pull/unique'),
        withReplies: require('./feed/pull/with-replies'),
      }
    },
    lib: {
      pullLookup: require('./lib/pullLookup'),
      timeAgo: require('./lib/timeAgo'),
    },
    message: {
      async: {
          name: require('./message/async/name'),
          publish: require('./message/async/publish'),
        },
      html: {
          action: {
            like: require('./message/html/action/like'),
            reply: require('./message/html/action/reply'),
          },
          author: require('./message/html/author'),
          backlinks: require('./message/html/backlinks'),
          decorate: {
            dataId: require('./message/html/decorate/data-id'),
          },
          layout: {
            "default": require('./message/html/layout/default'),
            mini: require('./message/html/layout/mini'),
          },
          link: require('./message/html/link'),
          markdown: require('./message/html/markdown'),
          meta: {
            channel: require('./message/html/meta/channel'),
          },
          render: {
            channel: require('./message/html/render/channel'),
            issue: require('./message/html/render/issue'),
            post: require('./message/html/render/post'),
            vote: require('./message/html/render/vote'),
            zzzFallback: require('./message/html/render/zzz-fallback'),
          },
          timestamp: require('./message/html/timestamp')
        },
      obs: {
        author: require('./message/obs/author'),
        backlinks: require('./message/obs/backlinks'),
        likes: require('./message/obs/likes'),
        name: require('./message/obs/name'),
      },
      sync: {
        isBlocked: require('./message/sync/is-blocked'),
        root: require('./message/sync/root'),
        unbox: require('./message/sync/unbox'),
      }
    },
    router: {
      sync: {
        normalise: require('./router/sync/normalise'),
        router: require('./router/sync/router'),
        routes: require('./router/sync/routes'),
      }
    }
  }
}

