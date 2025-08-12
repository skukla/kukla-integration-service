Finish standardizing the recs field mappings so that either action gets the same data.

Plan mode:

Once both actions are working, we should add a way to toggle the cache on and off on the frontend. Make sure that you investigate our design system at web-src/src/styles/design-system. Make the control a minimal part of the interface. The cache: true|false in config.js should be used to toggle the entire cache functionality on or off. This means that if the cache is set to false, caching will not be used by the actions AND the toggle will not be shown on the frontend.

Plan mode:

Help me understand the implications of cache being enabled or disabled. The goal of this integration with Adobe Target is to always pull up-to-date data out of the Commerce platform to populate our csv file. Target will be updated once every 24 hours.  With this is mind, is caching a good strategy for this application?

If you want fully-real-time, don't cache.

Plan mode:

During our implementation of the caching strategy, we implemented some very useful reorganization and data standardization that I think would be useful on the Master branch. We also fixed things in our deployment script. Before we begin to refactor and simplify the caching implementation, I'm wondering if we should come up with a plan that will take all of those updates that are not specifically cache-related and bring them into master safely? Or should we continue making the caching functionality production-ready via the technical debt documentation, even if we may not use the caching functionality?

Plan mode:

We need to understand the implications of cache being enabled or disabled. The assumption has been that using the API mesh for this functionality would be more performant than not. I want to understand whether that is true or not. If not, then perhaps we should not use the API mesh at all.

Plan mode:

Right now, the csv storage process updates the same csv file but generates a new pre-signed url each time. We need to implement functionality which preserves the url for as long as it is within its ttl. If the url is expired, we need to generate a new url and somehow let the user know. We also need to give the user the ability to "force" the generation of a new url if desired.

Currently we only show the presigned urls via the test action script.  Questions would be:

Should we stick to this and only show the URL and its status (and allow for the force generation of a new url) via the test script?

Or, should we implement something more on the frontend to visually indicate that a url is expired and that a new one must be generated?
