# WORKFLOW

## Goals

- Keep main stable and deployable.
- Use short-lived branches for every change.
- Use clear, consistent commit messages.

## Branching

Create a branch per change using a type prefix:

```
feat/booking-form
fix/login-redirect
docs/quickstart-guide
chore/deps-update
refactor/scheduling-service
```

## Sync with main

```
git switch main
git pull origin main
```

## Create a branch

```
git switch -c feat/booking-form
```

## Commit conventions

Use a type prefix in the commit subject:

```
feat: add booking form validation
fix: handle token refresh failure
docs: update quickstart guide
chore: bump frontend dependencies
refactor: extract api client
test: add auth flow coverage
perf: cache simulation results
build: update vite config
ci: add lint workflow
```

## Stage and commit

```
git status
git add .
git commit -m "feat: add booking form validation"
```

## Push your branch

```
git push -u origin feat/booking-form
```

## Open a pull request

- Target: main
- Include summary, screenshots, and testing notes
- Link related issues if applicable

## Keep your branch up to date

Option A: Rebase (preferred for clean history)

```
git fetch origin
git rebase origin/main
```

Option B: Merge (if rebase is not allowed)

```
git fetch origin
git merge origin/main
```

## After merge

```
git switch main
git pull origin main
git branch -d feat/booking-form
git push origin --delete feat/booking-form
```
