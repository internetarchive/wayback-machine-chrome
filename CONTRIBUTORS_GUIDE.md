# Contributor's Guide
written by @MaxReinisch


## Getting Started
1) Make sure your computer has git and node.js installed.  
2) Fork the existing project at https://github.com/internetarchive/wayback-machine-chrome/
3) Navigate to a directory in which you want to clone the project.
4) `$ git clone https://github.com/<github_account_name>/wayback-machine-chrome.git`
5) `$ cd wayback-machine-chrome`
6) `$ npm install`
7) You should now have a `node_modules` directory.  

## Demo Contribution
This section's purpose is to demonstrate the steps you should take to make a contribution.  This will use a hypothetical example.

Suppose you see an issue titled: *Please Make the Popup Background Black.*    You comment on the issue and decide you want to make the change, so:

1) You navigate to your project directory.
2) Either checkout an existing branch `git checkout ui_changes` or create a new one with the `-b` flag.
    - If you are creating a new branch, it is best to do it from an updated `master`.
    - `git pull upstream master`
3) Make the changes.
    - If it is a major change, don't forget to increment the version number in `manifest.json`
4) Add the changes and commit
    - There should be a different commit for different changes.  If you add a feature, then add tests, then lint the code, there should be at least 3 commits.  
    - Commit messages should be brief yet informative. Keep in mind that reviewers can see the changes made, we just want an idea of what was done when.
    - You can commit before you finish just to save work.  Include `(WIP)` in the commit message.
5) Push your branch: `git push origin ui_changes`
6) Go to your fork of the project on Github and make a Pull Request (PR).
    - Don't forget to review the PR title.
    - For example: "Fix 399: Popup background now Black"

## Friendly Reminders
- Please work in distinct branches for each issue.  Don't push from master.
- Each PR should do 1 thing, and all commits should be related to it.
- Don't forget to make sure all tests pass if you work on related code: `npm test`
- You can lint your code: `eslint scripts/settings.js --fix`
