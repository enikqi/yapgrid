# Udhëzues i Plotë për GitHub - Për Fillestarët

## 📚 Tabela e Përmbajtjes
1. [Çfarë është GitHub?](#çfarë-është-github)
2. [Instalimi dhe Konfigurimi](#instalimi-dhe-konfigurimi)
3. [Konceptet Bazë](#konceptet-bazë)
4. [Komandat e Rëndësishme](#komandat-e-rëndësishme)
5. [Workflow i Përditshëm](#workflow-i-përditshëm)
6. [Krijimi i Pull Request](#krijimi-i-pull-request)
7. [Review me Sonnet 4.5](#review-me-sonnet-45)

---

## Çfarë është GitHub?

GitHub është një platformë që ju ndihmon të:
- Ruani kodin tuaj në internet (cloud storage)
- Punoni me të tjerë në të njëjtin projekt
- Trackoni ndryshimet në kodin tuaj
- Ktheni prapa në versione të vjetra nëse diçka shkon keq

**Analoji e thjeshtë**: Imagjinoni GitHub si një Google Drive për programues, por me kontroll më të mirë të versioneve.

---

## Instalimi dhe Konfigurimi

### Hapi 1: Instaloni Git

**Në Linux (ku jeni tani):**
```bash
sudo apt update
sudo apt install git -y
```

**Verifikoni instalimin:**
```bash
git --version
```

### Hapi 2: Konfiguroni Git

```bash
# Vendosni emrin tuaj
git config --global user.name "Emri Juaj"

# Vendosni email-in tuaj
git config --global user.email "email@example.com"

# Verifikoni konfigurimin
git config --list
```

### Hapi 3: Krijoni një Llogari GitHub

1. Shkoni në: https://github.com
2. Klikoni "Sign up"
3. Plotësoni të dhënat dhe krijoni llogarinë

---

## Konceptet Bazë

### 1. **Repository (Repo)**
- Është një folder që përmban të gjithë kodin tuaj
- Mund të jetë në kompjuterin tuaj (local) ose në GitHub (remote)

### 2. **Commit**
- Është një "fotografi" e kodin tuaj në një moment të caktuar
- Si një "save point" në një lojë video
- Mund të shtoni një mesazh që shpjegon çfarë ndryshoi

### 3. **Branch**
- Është një version i veçantë i kodin tuaj
- `main` ose `master` është branch-i kryesor (production)
- Mund të krijoni branch-e të tjera për të testuar ndryshime

### 4. **Push**
- Dërgon ndryshimet tuaja në GitHub (local → remote)

### 5. **Pull**
- Merr ndryshimet nga GitHub (remote → local)

### 6. **Pull Request (PR)**
- Kërkesë për të bashkuar ndryshimet në branch-in kryesor
- Të tjerët mund të shikojnë dhe komentojnë ndryshimet para se t'i bashkojnë

---

## Komandat e Rëndësishme

### Komandat Bazë

```bash
# Shikoni statusin e repository
git status

# Shikoni ndryshimet që keni bërë
git diff

# Shtoni të gjitha files të ndryshuara
git add .

# Ose shtoni një file specifik
git add path/to/file.tsx

# Krijo një commit (fotografi)
git commit -m "Përshkrimi i ndryshimeve"

# Dërgo ndryshimet në GitHub
git push

# Merr ndryshimet nga GitHub
git pull

# Shikoni historinë e commit-eve
git log
```

### Komandat për Branch

```bash
# Shikoni branch-et ekzistuese
git branch

# Krijoni një branch të ri
git branch emri-i-branch-it

# Kaloni në një branch
git checkout emri-i-branch-it

# Krijoni dhe kaloni në një branch të ri (në një komandë)
git checkout -b emri-i-branch-it

# Bashkoni një branch me branch-in aktual
git merge emri-i-branch-it
```

---

## Workflow i Përditshëm

### Skenari 1: Puna e Parë në një Projekt Ekzistues

```bash
# 1. Klononi projektin nga GitHub
git clone https://github.com/enikqi/yapgrid.git

# 2. Shkoni në folder-in e projektit
cd yapgrid

# 3. Shikoni branch-et ekzistuese
git branch -a

# 4. Merrni të gjitha branch-et dhe ndryshimet
git fetch origin
```

### Skenari 2: Bërja e Ndryshimeve dhe Dërgimi i Tyre

```bash
# 1. Sigurohuni që jeni në branch-in e duhur
git checkout main  # ose branch-i që dëshironi

# 2. Merrni ndryshimet më të fundit nga GitHub
git pull origin main

# 3. Krijoni një branch të ri për ndryshimet tuaja
git checkout -b fix/homepage-posts-order

# 4. Bëni ndryshimet tuaja në kod...

# 5. Shikoni çfarë keni ndryshuar
git status

# 6. Shtoni files që dëshironi të commit-oni
git add site/app/page.tsx
git add site/components/video/video-modal.tsx

# Ose shtoni të gjitha files
git add .

# 7. Krijo një commit
git commit -m "Fix: Rregulluar renditja e posteve dhe fullscreen modal"

# 8. Dërgo branch-in e ri në GitHub
git push origin fix/homepage-posts-order
```

### Skenari 3: Përditësimi i Kodit Lokal

```bash
# 1. Kaloni në branch-in kryesor
git checkout main

# 2. Merrni ndryshimet më të fundit
git pull origin main

# 3. Krijoni një branch të ri për punën tuaj
git checkout -b feature/your-feature-name
```

---

## Krijimi i Pull Request

### Hapi 1: Dërgoni Branch-in në GitHub

```bash
# Pasi keni bërë commit-et, dërgoni branch-in
git push origin emri-i-branch-it
```

### Hapi 2: Krijoni Pull Request në GitHub

1. **Shkoni në GitHub:**
   - Hapni: https://github.com/enikqi/yapgrid
   - Do të shihni një mesazh "Compare & pull request" të verdhë

2. **Ose klikoni manualisht:**
   - Klikoni në "Pull requests" në menunë e sipërme
   - Klikoni "New pull request"

3. **Zgjidhni branch-et:**
   - **Base branch**: `main` (ose branch-i kryesor)
   - **Compare branch**: `fix/homepage-posts-order` (branch-i juaj)

4. **Plotësoni informacionin:**
   - **Title**: "Fix: Rregulluar renditja e posteve dhe fullscreen modal"
   - **Description**: 
     ```
     ## Problemet e Rregulluara
     - ✅ Renditja e posteve gjatë scroll-it
     - ✅ Paginimi në homepage
     - ✅ Fullscreen modal - postet shfaqen prapa modal
     
     ## Ndryshimet
     - Hequr virtual scrolling code që shkaktonte probleme
     - Shtuar IntersectionObserver për infinite scroll
     - Rritur z-index i modal në z-[9999]
     - Shtuar backdrop blur effect
     ```

5. **Klikoni "Create pull request"**

### Hapi 3: Review dhe Merge

- Të tjerët mund të shohin dhe komentojnë ndryshimet
- Pas review, mund të merget (bashkohet) në branch-in kryesor
- Ju mund të merget vetë nëse keni të drejta

---

## Review me Sonnet 4.5

### Hapi 1: Hapni Pull Request

1. Shkoni në GitHub: https://github.com/enikqi/yapgrid
2. Klikoni në "Pull requests"
3. Zgjidhni Pull Request-in tuaj

### Hapi 2: Hapni GitHub Copilot Chat

1. Në Pull Request, shikoni në anën e djathtë
2. Klikoni në "GitHub Copilot" ose ikona e chat
3. Ose shkoni direkt në: https://github.com/enikqi/yapgrid/pull/[NUMRI] dhe klikoni "Copilot"

### Hapi 3: Përdorni Prompt-et

**Prompt 1: Review i Plotë**

```
Please review the entire codebase for this Next.js application. Focus on:

1. **Performance Issues**: 
   - Slow API responses
   - Database query optimization needs
   - Component rendering issues

2. **Code Quality**:
   - Best practices violations
   - Potential bugs or errors
   - Security concerns

3. **Architecture**:
   - Database connection handling
   - API route structure
   - Component organization

4. **Specific Areas to Check**:
   - `/app/page.tsx` - Homepage component
   - `/app/api/posts/route.ts` - Posts API endpoint
   - `/components/video/video-modal.tsx` - Video modal

Provide a comprehensive review with specific recommendations for improvements.
```

**Prompt 2: Analizë e Problemit Specifik**

```
I have issues with the homepage:

**Problem Description:**
- Posts appear in wrong order during scrolling
- Pagination not working correctly
- Posts visible behind fullscreen modal

**Files Modified:**
- `/app/page.tsx` - Homepage component
- `/components/video/video-modal.tsx` - Video modal

**Questions:**
1. Are there any edge cases I missed?
2. Is the IntersectionObserver implementation correct?
3. Are there any performance issues with the current approach?
4. Any security concerns?

Please provide specific feedback and suggestions.
```

**Prompt 3: Test dhe Edge Cases**

```
Please review the code changes in this PR for:

1. **Edge Cases**:
   - What happens when API returns empty results?
   - What if user scrolls very fast?
   - What if modal is opened while another modal is open?

2. **Error Handling**:
   - Are all error cases handled?
   - Are there proper fallbacks?

3. **Performance**:
   - Will this cause memory leaks?
   - Are there any unnecessary re-renders?

4. **Accessibility**:
   - Is the modal accessible?
   - Are keyboard shortcuts working?

Please provide specific recommendations.
```

---

## Tips dhe Best Practices

### 1. Commit Messages të Mira

**Keq:**
```
git commit -m "fix"
git commit -m "update"
git commit -m "changes"
```

**Mirë:**
```
git commit -m "Fix: Rregulluar renditja e posteve gjatë scroll-it"
git commit -m "Fix: Modal fullscreen tani fsheh plotësisht postet prapa"
git commit -m "Feature: Shtuar IntersectionObserver për infinite scroll"
```

**Format i mirë:**
```
Type: Përshkrimi i shkurtër

- Detaj 1
- Detaj 2
- Detaj 3
```

**Types:**
- `Fix:` - Rregullim i bug-ut
- `Feature:` - Feature i ri
- `Update:` - Përditësim i kodit ekzistues
- `Refactor:` - Riorganizim i kodit
- `Docs:` - Ndryshime në dokumentacion

### 2. Branch Naming

**Keq:**
```
git checkout -b new
git checkout -b fix
git checkout -b update
```

**Mirë:**
```
git checkout -b fix/homepage-posts-order
git checkout -b feature/user-authentication
git checkout -b refactor/api-routes
```

**Format:**
```
type/brief-description
```

**Types:**
- `fix/` - Bug fixes
- `feature/` - New features
- `refactor/` - Code refactoring
- `docs/` - Documentation
- `test/` - Tests

### 3. Commit Shpesh

- Commit-oni ndryshime të vogla dhe shpesh
- Më mirë 10 commit-e të vogla se 1 commit i madh
- Çdo commit duhet të jetë "functional" (kodi duhet të funksionojë)

### 4. Pull Para Push

```bash
# Gjithmonë merrni ndryshimet më të fundit para se të push-oni
git pull origin main
git push origin your-branch
```

### 5. Testoni Para Commit

- Sigurohuni që kodi funksionon para commit
- Testoni ndryshimet lokalisht
- Shikoni për lint errors

---

## Troubleshooting

### Problemi: "Your branch is ahead of origin"

**Zgjidhja:**
```bash
git push origin branch-name
```

### Problemi: "Your branch is behind origin"

**Zgjidhja:**
```bash
git pull origin main
# Ose nëse ka conflicts:
git pull origin main --rebase
```

### Problemi: Merge Conflicts

**Kur ndodh:**
- Dy persona kanë ndryshuar të njëjtin file në të njëjtat rreshta

**Zgjidhja:**
```bash
# 1. Pull ndryshimet
git pull origin main

# 2. Git do të tregojë conflicts
# 3. Hapni file-in dhe gjeni:
#    <<<<<<< HEAD
#    kodi juaj
#    =======
#    kodi i tjetrit
#    >>>>>>> branch-name

# 4. Zgjidhni çfarë kodi duhet të mbetet
# 5. Fshini <<<<<<<, =======, >>>>>>>

# 6. Add file-in
git add path/to/file

# 7. Commit
git commit -m "Resolve merge conflicts"
```

### Problemi: "Changes not staged for commit"

**Zgjidhja:**
```bash
# Shtoni files që dëshironi
git add .
# Ose specifik
git add path/to/file
```

### Problemi: "Nothing to commit"

**Zgjidhja:**
- Nuk ka ndryshime për të commit-uar
- Ose ju nuk i keni shtuar files me `git add`

---

## Komanda të Shpejta Reference

```bash
# Status
git status                          # Shikoni statusin
git log --oneline                   # Shikoni commit-et (shkurt)
git log --graph --oneline --all     # Shikoni grafikun e branch-eve

# Working Directory
git add .                           # Shtoni të gjitha files
git add file.tsx                    # Shtoni një file
git commit -m "message"              # Commit
git push                            # Push në GitHub
git pull                            # Pull nga GitHub

# Branch
git branch                          # Listo branch-et
git branch -a                       # Listo të gjitha branch-et
git checkout branch-name            # Kaloni në branch
git checkout -b new-branch          # Krijoni dhe kaloni

# Undo
git reset --soft HEAD~1             # Hiq commit-in e fundit (mbaj ndryshimet)
git reset --hard HEAD~1             # Hiq commit-in e fundit (fshi ndryshimet)
git checkout -- file.tsx            # Hiq ndryshimet në një file
```

---

## Resources shtesë

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Guides**: https://guides.github.com
- **Git Cheat Sheet**: https://education.github.com/git-cheat-sheet-education.pdf
- **Interactive Git Tutorial**: https://learngitbranching.js.org

---

## Përmbledhje

**Workflow i thjeshtë:**

1. `git pull` - Merr ndryshimet
2. `git checkout -b feature/name` - Krijoni branch të ri
3. Bëni ndryshimet
4. `git add .` - Shtoni files
5. `git commit -m "message"` - Commit
6. `git push origin feature/name` - Push
7. Krijoni Pull Request në GitHub
8. Review me Sonnet 4.5
9. Merge pas review

**Kujto:**
- Commit shpesh, commit të vogla
- Pull para push
- Përdorni branch-e për çdo feature/fix
- Shkruani commit messages të mira
- Testoni para commit

Good luck! 🚀

