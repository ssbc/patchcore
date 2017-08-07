# Router

## Adding routes

Patchcore collects _routes_ from `router.sync.routes`. It expects arrays of the form:

```
  [ routeValidator, routeFunction ]
```

Where `routeValidator` is a function that returns true / false when given a `location` object.


## Using the router

The router is accessible at `app.sync.router`, and can be used like :

```js
const location = { page: 'inbox', theme: 'dark' }
const newView = api.app.sync.router(location)
```

The router finds the first route which matches the location it is passed, then automatically calls the associated `routeFunction` with the `location` object as an argument.

In our example the route is generating a view, which we might insert / append to the DOM, but this doesn't have to be the case.


