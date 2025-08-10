# 📚 Documentation Versioning Manual

This document explains how to manage versioned documentation for the Uptimer project.

## 🏗️ Current Structure

```
content/
├── _index.md                    # Root redirect to default version
├── v1.0.0/                      # Latest version (default)
│   ├── _index.md
│   ├── requirements/
│   ├── quick-start/
│   └── configuration/
└── v0.2.0/                      # Previous version
    ├── _index.md
    ├── requirements/
    ├── quick-start/
    └── configuration/
```

## 🚀 Adding a New Version

### Step 1: Create Version Directory

```bash
# Create the new version directory
mkdir -p content/v2.0.0
```

### Step 2: Copy Content from Previous Version

```bash
# Copy content from the latest version as a starting point
cp -r content/v1.0.0/* content/v2.0.0/
```

### Step 3: Update Hugo Configuration

Edit `hugo.toml` to add the new version:

```toml
[params.versions]
# The default version that will be shown when no version is specified
default = "2.0.0"  # Update to new version
# Available versions in order (newest first)
available = ["2.0.0", "1.0.0", "0.2.0"]  # Add new version first
# Latest version (for redirects and canonical URLs)
latest = "2.0.0"  # Update to new version
```

### Step 4: Update Root Redirect

Edit `content/_index.md` to redirect to the new default version:

```markdown
---
title: "Uptimer Documentation"
layout: "redirect"
url: "/v2.0.0/"
---
```

### Step 5: Update Version-Specific Content

1. **Update version numbers** in all documentation files
2. **Update feature descriptions** to reflect new capabilities
3. **Update configuration examples** for new features
4. **Update screenshots** if UI has changed
5. **Update code examples** for new APIs or configurations

**Note**: Use version-specific links within each version (e.g., `/v2.0.0/configuration/` not `/configuration/`)

### Step 6: Test the Versioning

```bash
# Start Hugo server
hugo server

# Test the following URLs:
# - http://localhost:1313/ (should redirect to /v2.0.0/)
# - http://localhost:1313/v2.0.0/ (new version)
# - http://localhost:1313/v1.0.0/ (previous version)
# - Version selector should show all versions
```

## 📋 Version Management Checklist

### Before Creating a New Version

- [ ] All documentation is up to date for the current version
- [ ] Screenshots and examples are current
- [ ] Configuration examples work with the current version
- [ ] All links are working and point to correct versions

### When Creating a New Version

- [ ] Create version directory
- [ ] Copy content from previous version
- [ ] Update Hugo configuration
- [ ] Update root redirect
- [ ] Update all version references in content
- [ ] Update feature descriptions
- [ ] Update configuration examples
- [ ] Update screenshots if needed
- [ ] Test all version URLs
- [ ] Test version selector functionality

### After Creating a New Version

- [ ] Verify all internal links work
- [ ] Test search functionality across versions
- [ ] Verify version selector shows correct current version
- [ ] Check that old version links still work
- [ ] Update any external references to documentation

## 🔧 Configuration Reference

### Hugo Configuration (`hugo.toml`)

```toml
[params.versions]
# The default version that will be shown when no version is specified
default = "2.0.0"
# Available versions in order (newest first)
available = ["2.0.0", "1.0.0", "0.2.0"]
# Latest version (for redirects and canonical URLs)
latest = "2.0.0"
```

### Version Selector

The version selector automatically appears in the header of all pages when versioning is configured. It allows users to switch between different documentation versions.

### URL Structure

- `/` → Redirects to default version
- `/v2.0.0/` → Latest version
- `/v1.0.0/` → Previous version
- `/v0.2.0/` → Older version

## 📝 Content Guidelines

### Version-Specific Content

1. **Always specify the version** in page titles and descriptions
2. **Use version-specific URLs** in internal links
3. **Update examples** to reflect the current version's capabilities
4. **Mark deprecated features** clearly
5. **Include migration guides** when breaking changes occur

### Cross-Version Links

When linking between versions, use absolute URLs:

```markdown
# Good - absolute URL
[See v1.0.0 configuration](/v1.0.0/configuration/)

# Bad - relative URL (will break)
[See v1.0.0 configuration](../v1.0.0/configuration/)
```

### Internal Links

Within each version, use version-specific links:

```markdown
# Good - version-specific link within same version
[Configuration](/v1.0.0/configuration/)
[Authentication](/v1.0.0/configuration/authentication/)

# Bad - relative link (will break versioning)
[Configuration](/configuration/)
```

### Version Indicators

Always include version information in page headers:

```markdown
---
title: "Configuration - v2.0.0"
weight: 1
---

# Configuration

This documentation is for Uptimer v2.0.0.
```

## 🐛 Troubleshooting

### Common Issues

1. **Version selector not showing**: Check that `[params.versions]` is configured in `hugo.toml`
2. **Redirect not working**: Verify `content/_index.md` has the correct `url` parameter
3. **Links broken**: Ensure all internal links use version-specific URLs
4. **Search not working**: Check that `BookSearch = true` is set in `hugo.toml`

### Debug Commands

```bash
# Check Hugo configuration
hugo config

# Build site and check for errors
hugo --gc --minify

# Start server with verbose output
hugo server --verbose
```

## 📚 Best Practices

1. **Keep versions in sync**: Update all versions when making global changes
2. **Test thoroughly**: Always test version switching and navigation
3. **Document changes**: Keep a changelog of what changed between versions
4. **Maintain consistency**: Use consistent formatting and structure across versions
5. **Archive old versions**: Remove very old versions to reduce maintenance burden

## 🔄 Migration Between Versions

When creating a new version, consider:

1. **Breaking changes**: Document what changed and how to migrate
2. **New features**: Highlight new capabilities
3. **Deprecated features**: Mark what's being removed
4. **Configuration changes**: Update all configuration examples
5. **API changes**: Update all API documentation

## 📞 Support

For issues with documentation versioning:

1. Check this manual first
2. Review the Hugo Book theme documentation
3. Test with a minimal configuration
4. Check Hugo and theme versions are compatible 