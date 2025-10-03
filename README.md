# Contributing Guidelines for Interns 🚀

Welcome to our project!  
This document explains **how interns should contribute code** without having direct write access to the main repository.  
Please **follow these steps carefully** whenever you work on a task.

---

## 🔹 1. Fork the Repository
- Go to the main repo: `https://github.com/adithya1107/development`
- Click **Fork** (top-right corner).
- This creates your personal copy of the repo (e.g., `https://github.com/[your-username]/development`).

---

## 🔹 2. Clone Your Fork
Clone your forked repository to your local machine:
```bash
git clone https://github.com/[your-username]/development.git
cd startup-repo
```

---

## 🔹 3. Add Upstream Remote
Set the **main repo** as the `upstream` so you can pull updates:
```bash
git remote add upstream https://github.com/adithya1107/development.git
```

Check remotes:
```bash
git remote -v
```
You should see:
- `origin` → your fork  
- `upstream` → main repo  

---

## 🔹 4. Sync with Main Repo
Before starting any new work, always update your local `main`:
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## 🔹 5. Create a Branch for Your Task
Each task should be done in its **own branch**:
```bash
git checkout -b [task-name]
```
Example:
```bash
git checkout -b login-ui
```

---

## 🔹 6. Make Changes & Commit
Work on your assigned task, then commit:
```bash
git add .
git commit -m "Added login UI feature"
```

---

## 🔹 7. Push Branch to Your Fork
```bash
git push origin task-name
```

---

## 🔹 8. Open a Pull Request (PR)
1. Go to your fork on GitHub.  
2. You’ll see a **“Compare & pull request”** button – click it.  
3. Make sure:
   - **Base repository**: `adithya1107/development`
   - **Base branch**: `main`
   - **Head repository**: `[your-username]/development`
   - **Compare branch**: your task branch (e.g., `login-ui`)  
4. Add a clear title & description of your work.  
5. Submit the Pull Request.

---

## 🔹 9. Code Review & Merge
- Your PR will be reviewed.  
- You may be asked to make changes → update your branch and push again.  
- Once approved, it will be merged into the main repo. 🎉  

---

## ✅ Rules
- **Never push directly** to the `main` branch.  
- **One task = one branch = one PR.**  
- Keep your fork updated with `upstream/main` before starting new tasks.  

---

Thank you for contributing 🙌  
This workflow ensures safe collaboration while maintaining code quality.
