# Udhëzues: Auto Push në GitHub

Ky udhëzues shpjegon si të konfiguroni automatik push në GitHub për serverin tuaj.

## 📋 Çfarë është krijuar

### 1. **auto-push-to-github.sh**
Script që:
- Kontrollon për ndryshime
- Bën pull për të shmangur konfliktet
- Bën commit automatikisht
- Push-on në GitHub

### 2. **watch-and-auto-push.sh**
Script që:
- Kontrollon për ndryshime çdo 5 minuta
- Push-on automatikisht kur ka ndryshime

### 3. **post-commit hook**
Git hook që:
- Push-on automatikisht pas çdo commit
- Funksionon vetëm kur ju bëni commit manualisht

### 4. **GitHub Actions Workflow**
Workflow që:
- Deploy automatikisht në server kur ka push në GitHub
- Kërkon konfigurim të secrets në GitHub

---

## 🚀 Përdorimi

### Metoda 1: Auto Push Manual (Rekomanduar)

**Kur bëni ndryshime në server:**

```bash
cd /home/ubuntu/apps/yapgrid
./auto-push-to-github.sh
```

**Ose me mesazh personalizuar:**

```bash
./auto-push-to-github.sh "Fix: Rregulluar homepage issues"
```

### Metoda 2: Auto Push Pas Çdo Commit

**Kur bëni commit manualisht:**

```bash
git add .
git commit -m "Your message"
# Automatikisht push-on në GitHub! 🎉
```

Hook-i `post-commit` do të push-on automatikisht.

### Metoda 3: Watch Mode (Background)

**Për të kontrolluar automatikisht për ndryshime:**

```bash
# Në background
nohup ./watch-and-auto-push.sh > /tmp/auto-push.log 2>&1 &

# Ose në terminal
./watch-and-auto-push.sh
```

**Për të ndaluar:**
```bash
pkill -f watch-and-auto-push.sh
```

### Metoda 4: Cron Job (Komplet Automatik)

**Për të kontrolluar çdo orë automatikisht:**

```bash
# Hapni crontab
crontab -e

# Shtoni këtë linjë (kontrollon çdo orë)
0 * * * * /home/ubuntu/apps/yapgrid/auto-push-to-github.sh >> /tmp/git-auto-push.log 2>&1

# Ose çdo 30 minuta
*/30 * * * * /home/ubuntu/apps/yapgrid/auto-push-to-github.sh >> /tmp/git-auto-push.log 2>&1
```

---

## ⚙️ Konfigurimi i GitHub Actions

### Hapi 1: Krijoni Secrets në GitHub

1. Shkoni në: https://github.com/enikqi/yapgrid/settings/secrets/actions
2. Klikoni "New repository secret"
3. Shtoni këto secrets:

**SERVER_HOST:**
- Name: `SERVER_HOST`
- Value: IP ose hostname i serverit tuaj (p.sh. `yapgrid.com` ose `123.456.789.0`)

**SERVER_USER:**
- Name: `SERVER_USER`
- Value: `ubuntu` (ose username-i juaj)

**SERVER_SSH_KEY:**
- Name: `SERVER_SSH_KEY`
- Value: Private SSH key për serverin tuaj

**Si të merrni SSH key:**

```bash
# Në server, shkoni në ~/.ssh
cat ~/.ssh/id_rsa

# Ose nëse nuk ekziston, krijojeni:
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Kopjoni private key dhe vendoseni në GitHub secret
cat ~/.ssh/id_rsa
```

**Ose përdorni public key authentication:**

```bash
# Kopjoni public key në authorized_keys
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
```

### Hapi 2: Testoni Workflow

1. Bëni një push në GitHub:
   ```bash
   git push origin main
   ```

2. Shkoni në: https://github.com/enikqi/yapgrid/actions
3. Do të shihni workflow-in që ekzekutohet
4. Shikoni logs për të parë nëse ka gabime

---

## 🔒 Siguria

### Rekomandime:

1. **Mos përdorni auto-push për production code** pa review
2. **Përdorni branch-e për test** para se të merge-oni
3. **Review-i manual** është gjithmonë më i sigurt
4. **Backup-i** para auto-deploy

### Best Practices:

```bash
# 1. Krijo branch për çdo ndryshim
git checkout -b feature/your-feature

# 2. Testoni ndryshimet
npm test
npm run build

# 3. Commit
git add .
git commit -m "Descriptive message"

# 4. Push (automatically me hook)
# Hook do të push-on automatikisht

# 5. Krijoni Pull Request në GitHub për review
```

---

## 🐛 Troubleshooting

### Problemi: "Permission denied (publickey)"

**Zgjidhja:**
```bash
# Testoni SSH connection
ssh -T git@github.com

# Nëse nuk funksionon, shtoni SSH key në GitHub:
# 1. Shkoni në: https://github.com/settings/keys
# 2. Klikoni "New SSH key"
# 3. Kopjoni public key:
cat ~/.ssh/id_rsa.pub
```

### Problemi: "Failed to push"

**Zgjidhja:**
```bash
# Pull para push
git pull origin main

# Push manualisht
git push origin main

# Ose nëse ka conflicts
git pull origin main --rebase
git push origin main
```

### Problemi: "Hook nuk push-on"

**Zgjidhja:**
```bash
# Sigurohuni që hook është executable
chmod +x .git/hooks/post-commit

# Testoni hook manualisht
./.git/hooks/post-commit
```

### Problemi: "GitHub Actions nuk funksionon"

**Zgjidhja:**
1. Kontrolloni që secrets janë të vendosura saktë
2. Shikoni logs në GitHub Actions
3. Testoni SSH connection manualisht:
   ```bash
   ssh ubuntu@your-server-ip
   ```

---

## 📊 Monitoring

### Shikoni logs:

```bash
# Auto-push logs
tail -f /tmp/git-auto-push.log

# Watch script logs
tail -f /tmp/auto-push.log

# GitHub Actions logs
# Shkoni në: https://github.com/enikqi/yapgrid/actions
```

### Check status:

```bash
# Git status
git status

# Branch info
git branch -vv

# Recent commits
git log --oneline -10
```

---

## 🎯 Përmbledhje

**Për përdorim të thjeshtë:**

1. **Bëni ndryshimet në kod**
2. **Run script:**
   ```bash
   ./auto-push-to-github.sh
   ```
3. **Done!** ✅

**Për automatik push pas commit:**

1. **Bëni commit:**
   ```bash
   git add .
   git commit -m "Your message"
   ```
2. **Hook push-on automatikisht!** ✅

**Për watch mode:**

1. **Start watch:**
   ```bash
   nohup ./watch-and-auto-push.sh > /tmp/auto-push.log 2>&1 &
   ```
2. **Bëni ndryshime në kod**
3. **Script push-on automatikisht pas 5 minuta!** ✅

---

## 💡 Tips

1. **Përdorni descriptive commit messages** - edhe nëse janë auto-commits
2. **Review-i manual** për ndryshime të rëndësishme
3. **Testoni lokalisht** para se të push-oni
4. **Backup-i** para deployment
5. **Monitoroni logs** për të parë çfarë ndodh

---

## 📞 Support

Nëse keni probleme:
1. Shikoni logs: `/tmp/git-auto-push.log`
2. Testoni manualisht: `git push origin main`
3. Kontrolloni SSH connection: `ssh -T git@github.com`
4. Shikoni GitHub Actions: https://github.com/enikqi/yapgrid/actions

Happy coding! 🚀

