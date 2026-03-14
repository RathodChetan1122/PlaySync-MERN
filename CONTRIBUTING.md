# 🤝 Contributing to PlaySync

Thank you for contributing! Please follow this guide to keep the codebase clean and collaborative.

---

## 🌿 Branch Strategy

```
main          ← Production. Only merge from develop via PR.
develop       ← Integration. All feature PRs target this branch.
feature/*     ← Individual features (e.g. feature/auth, feature/games)
fix/*         ← Bug fixes (e.g. fix/chat-disconnect)
hotfix/*      ← Urgent production patches
```

## 🔄 Workflow

```bash
# 1. Always start from develop
git checkout develop
git pull origin develop

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Make changes, then commit with clear message
git add .
git commit -m "feat: add word scramble timer"

# 4. Push your branch
git push origin feature/your-feature-name

# 5. Open a Pull Request → develop on GitHub
```

---

## 📝 Commit Message Format

Use these prefixes:

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `style:` | CSS/UI only changes |
| `refactor:` | Code restructure, no feature change |
| `docs:` | Documentation only |
| `chore:` | Config, deps, tooling |
| `test:` | Tests |

Examples:
```
feat: add chess resign button
fix: socket disconnect on room leave
style: update navbar active state color
docs: add API reference to README
```

---

## 🧪 Before Submitting a PR

- [ ] App runs without errors (`npm run dev`)
- [ ] No `console.error` in browser
- [ ] Feature works end-to-end in browser
- [ ] Code is readable and commented where complex
- [ ] No `.env` secrets committed

---

## 📁 Where to add things

| What | Where |
|------|-------|
| New page | `client/src/pages/` |
| New component | `client/src/components/<Category>/` |
| New API route | `server/routes/` + `server/controllers/` |
| New game | `server/socket/games/` + `client/src/components/Games/` |
| New socket event | `server/socket/index.js` |
| Reusable hook | `client/src/hooks/` |
| Utility function | `client/src/utils/` |
