# `template-web-library`

Provides a boilerplate for new web libraries.

## Included

- Bundling (via [Rollup](https://rollupjs.org/guide/en/))
- TypeScript support
- Prettier configuration
- Gitlab CI integration (via [deal/cicd-tools](https://github.com/deal/cicd-tools/blob/master/templates/MinimalWebLibrary.Common.gitlab-ci.yml))
- Semantic versioning (via [semantic-release](https://semantic-release.gitbook.io/semantic-release/))
- Commit validation (via [commitlint](https://github.com/conventional-changelog/commitlint))
- Local publishing (via [yalc](https://github.com/whitecolor/yalc))
- Dependabot configuration

## Getting Started

To get started, select the green "Use this template" button at the top. 

- Naming convention wise we typically give the repo name a "-js" suffix, but not the package name. 

There are a couple holes in the template you need to fill in before doing anything else:

1.  Open `package.json` and edit the `name`, `description`, `repository.url`, `bugs.url`, and `homepage` fields
2.  Delete or update this `README.md`

Next, you'll want to create a mirror for your repository in Gitlab:

1.  Select "Run CI/CD for external repository" from the [New Project](https://gitlab.com/projects/new?nav_source=navbar) page
2.  Connect the repo from Github.
    - Be sure to connect it under the `dealdotcom` group. 
    - If you are prompted for a personal access token on this page, retrieve the DealInfra one from 1Password in the special field under the 'Github' entry.  
3.  Once it's connected, go to "Settings > CI/CD" for the new project, and add the `BUILD_WEB_LIBRARY_ROLE_ID` variable. 
    - Under the "Variables" section, select "Expand", then select "Add Variable".
    - Enter `BUILD_WEB_LIBRARY_ROLE_ID` as the key.
    - You can copy the role ID from another library.
    - Make sure "Mask variable" is checked and "Protect variable" is unchecked
4. Got to "Settings > Repository", expand the "Protected branches" section, and change "Allowed to push" to "Maintainers" for the `master` branch. This allows the mirror to push code from GitHub to Gitlab on the `master` branch.

   <img src="https://user-images.githubusercontent.com/47223963/210448526-1832a3ce-b12e-44e9-8c56-5e80ac854921.png" alt="CleanShot 2023-01-03 at 14 00 06@2x" width="600"/>

By convention, we prefer squash commits over merge commits. Head to the "Settings" tab of this repo on GitHub and uncheck "Allow merge commits".

Depending on your package's needs, you will want to add some more functionality. Here's how to handle some of the more common scenarios:

#### Packaging For The Browser

If your package uses DOM APIs, you can update the `tsconfig.json` to add the `"dom"` libraries:

```diff
- "lib": ["es5", "es6", "es7"],
+ "lib": ["es5", "es6", "es7", "dom"],
```

#### Packaging For Node

If your package targets Node, you will most likely want to exclude the builtin Node core modules from being bundled by Rollup. This does not happen out of the box. The `builtin-modules` package provides a list of these modules, making it easy to add them to the list of external packages in `rollup.config.js`.

```sh
yarn add -D builtin-modules
```

In `rollup.config.js`:

```diff
+ import builtins from 'builtin-modules'

...

- external: Object.keys(pkg.dependencies),
+ external: Object.keys(pkg.dependencies).concat(builtins),
```

## Slack Announcements

We use the [GitHub Slack app](https://github.com/integrations/slack#configuration) to announce new releases and deployments for our libraries.

To add the newly created library, go into Slack, got to the `#frontend` channel, and subscribe the Slack app to the repo:

```
/github subscribe deal/<repo-name>
```

This will subscribe the app to all updates to the repo. We don't need announcements for all updates, so we can individually unsubscribe from specific types of changes. Run the following to unsubscribe to the unnessecary changes:

```
/github unsubscribe deal/<repo-name> issues pulls commits
```

This should print out a confirmation like the following:
"This channel will receive notifications from deal/<repo-name> for:
`releases`, `deployments`"
