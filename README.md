# About this repo

This is to demonstrate a bug in the JupyterLab bundler. It consists of 3
packages in a monorepo setup:

 - [`@testtest/foo-package`](./packages/foo): A top-level JupyterLab extension
 - [`@testtest/bar-package`](./packages/bar): A dependency of foo
 - [`@testtest/batman-leaf`](./packages/batman): A grandchild dependency of foo

None of these packages are on NPM.

# Setup

Link each package:

```bash
jupyter labextension link ./packages/batman --no-build
jupyter labextension link ./packages/bar --no-build
jupyter labextension install ./package/foo  --no-build # can also use link
```

Now attempt a build:

```bash
jupyter lab build
```

It will fail when attempting to build `bar-package`:

```
Couldn't find package "@testtest/batman-leaf@0.0.1" required by "@testtest/bar-package@file:linked_packages/testtest-bar-package-0.0.1-26a01b6e57a23185b090ca63cdbb71fc934dec47.tgz" on the "npm" registry.
```

# Cause

What's happening is that when `foo-package` is loaded, the dependency on
`bar-package` is correctly transformed to point to the link. However, this
process is not recursive: `bar-package` has a dependency on `batman-leaf`, but
that dependency is not transformed by the build toolchain.

The practical effect of this is nil *IFF* `batman-leaf` is already published on
NPM: Yarn will either see that the linked version is newer (by versioning) or it
will flatten the tree to point to the linked version. However, if `batman-leaf`
is not on a registry, the build fails.

You can prove this by setting up a private repository. In another console:

```bash
yarn global add verdaccio
verdaccio
```

This will print a URL to your console, typically on localhost. You can verify
the registry is up by navigating to it in a browser window.

Publish the dependent packages to this private repo:

```bash
# enter literally anything for the username and password at the prompts, the
# credentials aren't checked
npm login

# publish the leaf packages
npm publish ./packages/batman --registry http://url-for-your-private-repo
npm publish ./packages/bar --registry http://url-for-your-private-repo
```

Then, add the following to your `.yarnrc`:

```yarnrc
"@testtest:registry" "http://url-for-your-private-repo"
```

Run the build again with `jupyter lab build`, and this time it will succeed.

You can verify it loaded by opening JupyterLab and looking for the following
console output in Dev Tools:

```
Loaded the @testtest/foo-package package!
NaNNaNNaNNaNNaNNaNNaN Batman
```

You can verify that the local packages are being used by running
`jupyter lab --watch` and making some trivial change.
