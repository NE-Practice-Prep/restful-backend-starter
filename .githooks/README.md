# Git Hooks

Install the repository hooks with:

```sh
pnpm run hooks:install
```

The `post-commit` hook pushes the current branch after each successful commit.
Set `AUTO_PUSH=0` before committing to skip one automatic push.
