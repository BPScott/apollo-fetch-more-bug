# Apollo fetchMore bug

This Repository showcases a failure in the interaction between `@apollo/client` and `@shopify/react-testing`. This test case works in `@apollo/client` v3.5.10, but fails in v3.6.0 and above.

`@shopify/react-testing` does not resolve promises for Apollo calls immediatly, like Apollo's own `MockClient`/`MockLink`, instead it makes you call `graphql.resolveAll()`.  This gets unfortunatly somewhat clunky as calls to fetchMore require a mult-step approach - putting the fetchMore promise onto the stack, resolving it then awaiting any future results. Because of this, the code is sensitive to changes the event loop.

I suspect that some change between 3.5.10 and 3.6.0 has resulted pushing when the cache resolves its update to be out-of-band - it now completed after the `await promise` call that triggered data request, rather than the promise being resolved only when the cache is persisted.

I note that awaiting on a promise that resolves in the next event loop tick causes the test to return to its passing state.

My colleague @ryanwilsonperkin suggests:

> ```
> at QueryInfo.Object.<anonymous>.QueryInfo.setDiff (/Users/ryan/src/github.com/Shopify/quilt/node_modules/@apollo/client/core/QueryInfo.js:115:7)
>        at Object.callback (/Users/ryan/src/github.com/Shopify/quilt/node_modules/@apollo/client/core/QueryInfo.js:186:75)
>        at InMemoryCache.Object.<anonymous>.InMemoryCache.broadcastWatch (/Users/ryan/src/github.com/Shopify/quilt/node_modules/@apollo/client/cache/inmemory/inMemoryCache.js:305:12)
>        at maybeBroadcastWatch.optimism.wrap.max (/Users/ryan/src/github.com/Shopify/quilt/node_modules/@apollo/client/cache/inmemory/inMemoryCache.js:58:12)
>        at recomputeNewValue (/Users/ryan/src/github.com/Shopify/quilt/node_modules/optimism/src/entry.ts:198:31)
>        at Slot.withValue (/Users/ryan/src/github.com/Shopify/quilt/node_modules/@wry/context/lib/context.esm.js:69:29)
>        at reallyRecompute (/Users/ryan/src/github.com/Shopify/quilt/node_modules/optimism/src/entry.ts:181:19)
>        at Entry.Object.<anonymous>.Entry.recompute (/Users/ryan/src/github.com/Shopify/quilt/node_modules/optimism/src/entry.ts:91:9)
>        at InMemoryCache.optimistic [as maybeBroadcastWatch] (/Users/ryan/src/github.com/Shopify/quilt/node_modules/optimism/src/index.ts:150:25)
>        at /Users/ryan/src/github.com/Shopify/quilt/node_modules/@apollo/client/cache/inmemory/inMemoryCache.js:288:59
> ```
>
> This is the stacktrace to the point where the issue is happening. When the query gets updated, it calls out to this setDiff method which will update the diff with the newly updated query. It then invokes a “notify” method which is what will tell React that it needs to re-render. The problem lies in the way it calls notify: it does so in a setTimeout(…, 0) in order to hand it over to the next tick. This presents a race condition where in some cases that tick will be processed before the next operations in the Jest test, whereas in some cases the next Jest operations will be processed automatically


## To Test

Run `npm install` and `npm test` and see that the test case fails.

Adjust the `@apollo/client` version in package.json (both in dependencies and overrides) to use `3.5.10` and see that the test passes.
Adjust the `@apollo/client` version in package.json (both in dependencies and overrides) to use `3.6.0` and see that the test fails.

## Expected behaviour

With `@apollo/client` 3.5.10 and below the provided test worked
In `@apollo/client` 3.6.0 and above the provided test fails
