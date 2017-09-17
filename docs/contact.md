# Contact

## `contact.async.follow`

`(id, cb)` - follow feed with key = `id`


## `contact.async.unfollow`

`(id, cb)` - unfollow feed with key = `id`


## `contact.async.followerOf`

...


## `contact.async.block`

`(id, cb)` - block feed with key = `id`

Note that blocking influences the observeable state of following, followers, blockers, blocking, 


## `contact.async.unblock`

`(id, cb)` - unblock feed with key = `id`


## `contact.obs.following`

`(id)` returns an observeable which resolves to an array of feeds that `id` is following


## `contact.obs.followers`

`(id)` returns an observeable which resolves to an array of feeds that follow `id`


## `contact.obs.blocking`

`(id)` returns an observeable which resolves to an array of feeds that `id` is blocking


## `contact.obs.blockers`

`(id)` returns an observeable which resolves to an array of feeds that block `id`


