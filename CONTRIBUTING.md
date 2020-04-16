# Startin'blox contributions guidelines

Nice to see you here!

There are several ways to contribute to the Startin'blox project. The best way is the one that inspires you :)

If you have any question, come to meet us on [community.startinblox.com](community.startinblox.com)


## Feel welcome to open issue

If needed, you can be inspired by those models to report a bug or to propose your suggestions efficiently.

#### How to report a bug

*  **Summary** : *What's the problem?*
*  **Step to reproduce** : *How can we reproduce your bug ?*
*  **Expected results** : *What did you expect to get ?*
*  **Actual results** : *What do we have so far ?*
*  **More info** : *Describe all the elements of your configuration that seem to you relevent sush as your OS, your browser, your size screen..*

#### How to make a suggestion 

*  **Description** : *What are the reasons of your suggestion ? No not hesitate to add image support.*
*  **Proposal** : *Explain your suggestion. Explain what you were expecting ? In your dream, which behavior did you expect ? No not hesitate to add image support.*
*  **Additional links** : *Do you have examples or references for your suggestion ?*

#### For Specification change proposal

Before making any change to a software that requires a specification update, please open an issue explaining why there is a need to do so. If possible, provide an example use case. If you think of a solution, you can provide it with a code example.

This issue *should* be shared with all the other contributors so that every one can discuss it, until a decision is made. Then new issues should be created to describe the technical details of implementation.

#### Good First Issue

If you see an issue which seems to you really easy and not urgent, you can let it to the new timers add a label "good first issue".

## Create your own branch
For each modification you add to a component, you must create a new branch. Each branch must be related to one issue only. 

If you need to fix a bug, which will be added to the current version of the component, create your branch from `master`.

If you need to add a new feature, which will be released in the next version of the component, create your branch from `dev`.

Include the number of the issue your are working on in the branch name (ie: `12-fix-error`).

## Take care of your commit messages

Please prefix your commit message with the level of modification which can be : 

* **`feature`** for modification that add a significant new behavior to the software
* **`update`** for any modification of the behavior of the software that requires a specification update
* **`bugfix`** for any modification making the software comply with the specification
* **`ui`** for any modification of the software that affect its appearance but not its behavior
* **`syntax`** for any modification that do not affect the user, like a refactoring

Examples : 
```
bugfix: set lookup field on @id
update: configurable fields (fix #6)
feature: representation of foreign keys as objects (fix #5)
feature: Federation model (fix #7)
```
These prefix are essential as they will trigger an automatic release for the component.

You can also add the id of the related issue, to link it automatically to the commit. (for the issue 12, add `#12` in your commit message).

## Propose your merge request

When your modifications are ready, create a merge request to `master` or `dev`, depending from which branch your created your own one.

The merge request should include:

- The id of the related issue (ie: `Fix error #12`)
- A simple example to test your modifications
- Every comment useful to understand your modifications

Assign it to someone which will review, test and approve the merge request.

## Documentation is everything 

We all know how much documenting our work is important. If you find that you can add an improvement, the community is grateful to you!

#### Document your component

As we are smart and lazy, you can use [our documentation model for component](./Documentation Component Model) to be efficient.

#### Experimental features
Every non experimental features *should* be documented in the repository README.md.

Experimental features *can* be documented, but their documentation should mention clearly that the feature is experimental and is not guaranteed to continue to work in the future.

## Make beautiful release note

When releasing a new version of the software, add a tag on the repository. Name it with the version number of the release and add a release note. The release notes should have 3 sections: **New features**, **Other changes** and **bug fixes**. You should check the list of all commit messages since last release to make those release notes.

## We do experimental work

All new features should be marked in the release notes as *experimental*, and marked as such until their specification is validated.

An experimental feature is not guaranteed to work fully as expected, nor is it guaranteed to be maintained in future releases. Its specification can be changed at any moment in any commit.




**Thank you very much for your contribution !**

