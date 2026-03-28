# Branch Protection Setup for `main`

## Steps

1. Go to your GitHub repo > **Settings** > **Branches**
2. Click **Add branch protection rule** (or **Add classic branch protection rule**)
3. Set **Branch name pattern** to: `main`
4. Enable **Require a pull request before merging**
5. Enable **Require status checks to pass before merging**
6. Check **Require branches to be up to date before merging**
7. In the search box, add these required status checks:
   - `Engine Tests`
   - `Web Checks`
8. Click **Save changes**

## Note

The status checks (`Engine Tests` and `Web Checks`) will only appear in the search
after the CI workflow has run at least once. Create a test PR first to trigger the
workflow, then configure the branch protection rules.
