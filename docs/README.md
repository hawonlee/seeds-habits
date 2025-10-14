# Seeds Habits Documentation

Complete documentation for the Seeds Habits application.

## 📁 Documentation Structure

### General Setup
- [`DATABASE_SETUP.md`](./DATABASE_SETUP.md) - Database configuration and migrations
- [`DISABLE_EMAIL_CONFIRMATION.md`](./DISABLE_EMAIL_CONFIRMATION.md) - Disable email confirmation for development

### Knowledge Graph
See [`knowledge-graph/`](./knowledge-graph/) for complete Knowledge Graph documentation:
- [`README.md`](./knowledge-graph/README.md) - Overview and navigation
- [`QUICKSTART.md`](./knowledge-graph/QUICKSTART.md) - Quick start guide
- [`SETUP.md`](./knowledge-graph/SETUP.md) - Detailed setup instructions
- [`ARCHITECTURE.md`](./knowledge-graph/ARCHITECTURE.md) - Technical architecture
- [`CONTEXT.md`](./knowledge-graph/CONTEXT.md) - Deep context and design decisions
- [`MULTI_USER_ARCHITECTURE.md`](./knowledge-graph/MULTI_USER_ARCHITECTURE.md) - Multi-user design
- [`PERFORMANCE_ARCHITECTURE.md`](./knowledge-graph/PERFORMANCE_ARCHITECTURE.md) - Performance optimizations
- [`QUICK_FIX_SUMMARY.md`](./knowledge-graph/QUICK_FIX_SUMMARY.md) - Browser freeze fix

### Deployment
See [`deployment/`](./deployment/) for deployment guides:
- [`DEPLOY_EDGE_FUNCTION.md`](./deployment/DEPLOY_EDGE_FUNCTION.md) - Deploy Knowledge Graph Edge Function
- [`SUPABASE_SECRETS_SETUP.md`](./deployment/SUPABASE_SECRETS_SETUP.md) - Configure Supabase secrets

---

## Quick Links

### Getting Started
1. [Main README](../README.md) - Start here
2. [Database Setup](./DATABASE_SETUP.md) - Set up your database
3. [Knowledge Graph Quick Start](./knowledge-graph/QUICKSTART.md) - Get Knowledge Graph running

### For Developers
- [Knowledge Graph Architecture](./knowledge-graph/ARCHITECTURE.md) - Understand the system
- [Knowledge Graph Context](./knowledge-graph/CONTEXT.md) - Deep dive into design decisions
- [Performance](./knowledge-graph/PERFORMANCE_ARCHITECTURE.md) - Performance considerations

### For Deployment
- [Deploy Edge Function](./deployment/DEPLOY_EDGE_FUNCTION.md) - Deploy to production
- [Supabase Secrets](./deployment/SUPABASE_SECRETS_SETUP.md) - Configure secrets

---

## Documentation Standards

When adding new documentation:

1. **General docs** → Place in `docs/`
2. **Feature-specific docs** → Place in `docs/[feature-name]/`
3. **Deployment docs** → Place in `docs/deployment/`
4. **Keep root clean** → Only `README.md` should be in project root

### Naming Conventions
- Use `UPPERCASE_WITH_UNDERSCORES.md` for important docs
- Use `lowercase-with-dashes.md` for auxiliary docs
- Use `README.md` for directory overviews

---

## Contributing to Docs

When updating documentation:
1. Keep it current - update when code changes
2. Use clear headings and structure
3. Include code examples where helpful
4. Link related docs together
5. Delete outdated/temporary docs

---

**Last Updated**: January 2025

