Before continuing with phase 2 of the mesh refactor, we need to do an audit on mesh build and deployment steps. I am consistently seeing that commands like npm run deploy:mesh fail because either the resolver or the mesh.json configuration has not been regenerated as expected. Is this happening because you're using the wrong build flow? Or is it happening because our build and deploy scripts are not as thorough in their handling of things?  Or is it happening because we have too many avenues to the same expected result? Before we continue with the mesh refactor, we need to be sure that when we deploy our changes, we can rely on everything being regenerated as expected.

In our deployment pipeline, I see that we separate the regeneration of the mesh resolver and the mesh.json configuration.  Should we think about combining these -- either doing both as part of the build phase or both as part of updating the mesh?

Post Phase 2 (architectural fixes):
Consolidate mesh commands
Remove conditional logic from regular deployments
