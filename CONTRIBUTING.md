# Contributing to AI Institute Website

Thanks for your interest in contributing! This guide will help you get started with our development workflow.

## Getting Started

1. **Fork the repository** and clone your fork locally
2. Follow the setup instructions in [SETUP.md](./SETUP.md)
3. Create a new branch for your work
4. Make your changes and test thoroughly
5. Submit a pull request

## Task Management

We use GitHub Issues and Projects to track work:
- **Bug reports** - Create an issue with the `bug` label
- **Feature requests** - Create an issue with the `enhancement` label
- **Tasks** - Check the Projects board for available tasks

Before starting work on a feature, check if an issue exists or create one to discuss your approach.

**Be advised:** tasks that involve changes to the Strapi schema may require data migration on the production server. 
Please coordinate with maintainers before making such changes. 

## Git Workflow

### Branching Strategy

We follow a simplified Git Flow model:

- **`master`** - Production-ready code
- **`develop`** - Integration branch for ongoing work (maybe will implement in future, if multiple people join)
- **Feature branches** - For new features or changes
- **Bugfix branches** - For bug fixes

### Branch Naming Convention

Use descriptive names that indicate the type and purpose:

```
feat/<short-description>    # New features
fix/<issue-or-description>      # Bug fixes
docs/<what-documentation>       # Documentation updates
refactor/<what-refactoring>     # Code refactoring
```

**Examples:**
- `feature/add-seminar-filtering`
- `fix/navbar-mobile-overflow`
- `docs/update-docker-instructions`
- `refactor/strapi-api-client`

### Creating a Branch

```bash
# Make sure you're on the latest master
git checkout master
git pull origin master

# Create your feature branch
git checkout -b feature/your-feature-name
```

### Committing Changes

Write clear, concise commit messages:

```
<type>: <short summary>

<optional detailed description>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style/formatting (no logic changes)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks, dependencies

**Examples:**
```bash
git commit -m "feat: add filtering to seminars page"
git commit -m "fix: resolve navbar overflow on mobile devices"
git commit -m "docs: update contribution guidelines"
```

### Submitting a Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub:
   - Use a clear, descriptive title
   - Reference any related issues (e.g., "Closes #42")
   - Describe what changes you made and why
   - Add screenshots for UI changes

3. **Respond to feedback:**
   - Address review comments promptly
   - Make requested changes in new commits
   - Push updates to your branch

4. **Merge:**
   - Once approved, a maintainer will merge your PR
   - Delete your feature branch after merging

## Code Standards

### General Guidelines

- Write clear, self-documenting code
- Keep functions small and focused
- Comment complex logic, but prefer readable code over comments
- Remove console.logs before committing

### JavaScript/React

- Use functional components with hooks
- Follow existing code style (maybe we'll use Prettier in the future, not yet implemented)
- Use meaningful variable and function names
- Keep components modular and reusable

### CSS/Tailwind

- Use Tailwind utility classes when possible
- Group related utilities logically
- Extract repeated patterns into components
- Maintain responsive design principles

### Strapi Content Types

- Use clear, descriptive names for content types and fields
- Document relationships and field purposes in comments
- Test changes locally before pushing
- Remember: schema changes require rebuilding Docker containers

### Docker Conventions

Keep container files predictable so builds behave the same on Linux (case-sensitive) and macOS/Windows (case-insensitive).

**Dockerfiles**

- `Dockerfile` — the default/production image for a service directory.
- `Dockerfile.dev` — the development variant. Always reference it explicitly with `dockerfile: Dockerfile.dev`.
- Always capitalize the **D** in `Dockerfile`. A lowercase `dockerfile` may work on macOS/Windows but fails on Linux and in CI with `lstat .../Dockerfile: no such file or directory`.

**Compose files**

| File | Purpose |
|---|---|
| `compose.yaml` | Default local stack (production-like build). `docker compose up` picks it up automatically. |
| `compose.dev.yaml` | Development stack with watch/hot-reload. Run with `docker compose -f compose.dev.yaml watch`. |
| `compose.prod.yaml` | Production server stack (prebuilt images). Run with `docker compose -f compose.prod.yaml ...`. |

- Use the modern `compose.*.yaml` names, not the legacy `docker-compose.*.yml` prefix.
- Always set `dockerfile:` explicitly when a service directory contains more than one Dockerfile.
- Every build context must have a `.dockerignore` covering dependencies, build output, env files, and mounted runtime data.
- Do not add a Docker Hub base image. Use `public.ecr.aws/docker/library/...` or a GHCR mirror. If an image is only published to Docker Hub, add it to `.github/workflows/_mirror-images.yml` and reference the GHCR copy.
- Expose a mirrored base image as an `ARG` with the ECR default (`ARG NODE_IMAGE=public.ecr.aws/docker/library/node:22-alpine`), then `FROM ${NODE_IMAGE}`. CI overrides these args to the GHCR mirror, so local builds need no registry login.
- ECR Public has its own anonymous limit (500 GB/month, 1 pull/second), so CI must not pull from it even though it avoids Docker Hub.

**CI**

- `deploy.yml` rebuilds only the services whose directories changed. Docs, compose files, and tooling changes do not trigger a build.
- A manual run rebuilds every image.
- Changes to `deploy.yml` or `_build-image.yml` trigger a full rebuild so the pipeline is exercised. Mirror-workflow changes only run the mirror job.
- Pass build arguments to `_build-image.yml` as separate single-line inputs. Do not add a multiline `build-args` input: GitHub passes reusable-workflow inputs with CRLF line endings, and mixing those with the LF lines in the build step makes `docker/build-push-action` merge the last arguments.

## Testing Your Changes

### Before Committing

1. **Test locally:**
   - Run the development server
   - Test affected features in the browser
   - Check responsive behavior on different screen sizes
   - Verify no console errors

2. **Test with Docker:**
   ```bash
   docker compose down
   docker compose up --build
   ```

3. **Check for issues:**
   - Broken links
   - Missing images
   - API errors
   - Performance problems

### Strapi Changes

If you modified content types or schemas:
1. Test with the Strapi admin panel
2. Verify API responses
3. Ensure frontend displays data correctly
4. Test with both draft and published content

## Review Process

1. **Automated checks** - Ensure any CI checks pass (not yet implemented, soon...)
2. **Code review** - At least one maintainer will review
3. **Testing** - Reviewer will test your changes
4. **Approval** - Once approved, your PR will be merged

## Questions or Problems?

- **Stuck on something?** - Create a discussion or ask in existing issues
- **Found a bug?** - Open an issue with steps to reproduce
- **Need clarification?** - Reach out to maintainers

## Code of Conduct

- Be respectful and constructive
- Welcome newcomers and help them learn
- Focus on what's best for the project
- Accept constructive criticism gracefully

Thank you for contributing to the AI Institute website!
