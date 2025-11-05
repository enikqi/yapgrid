# Udhëzues për Përdorimin e Sonnet 4.5 në GitHub

## Hapi 1: Krijoni Pull Request

1. Shkoni në: https://github.com/enikqi/yapgrid
2. Klikoni "Compare & pull request" ose "New Pull Request"
3. Zgjidhni branch: `fix/502-gateway-and-performance-improvements`
4. Klikoni "Create pull request"

## Hapi 2: Review i Parë i Site me Sonnet 4.5

### Prompt 1: Review i Plotë i Kodit

Kopjoni dhe ngjisni këtë në GitHub Copilot Chat (Sonnet 4.5):

```
Please review the entire codebase for this Next.js application. Focus on:

1. **Performance Issues**: 
   - Slow API responses (currently 5+ seconds)
   - Database query optimization needs
   - Nginx configuration improvements

2. **Code Quality**:
   - Best practices violations
   - Potential bugs or errors
   - Security concerns

3. **Architecture**:
   - Database connection handling
   - API route structure
   - Component organization

4. **Specific Areas to Check**:
   - `/app/api/posts/route.ts` - Posts API endpoint
   - `/app/page.tsx` - Homepage component
   - `/lib/db/prisma.ts` - Database connection
   - `/ecosystem.config.js` - PM2 configuration
   - Nginx proxy settings

Provide a comprehensive review with specific recommendations for improvements.
```

## Hapi 3: Problem me Homepage - Postet në Rend të Gabuar

### Problem:
- Postet shfaqen në rend të gabuar gjatë scroll-it
- Posti i dytë del i pari
- Loading është shumë i ngadaltë

### Prompt 2: Analizë e Problemit të Homepage

```
I have a critical issue with the homepage posts display:

**Problem Description:**
- Posts appear in wrong order during scrolling
- The second post appears as first during scroll
- Loading is very slow (5+ seconds)
- Posts jump around when scrolling

**Files to Review:**
- `/app/page.tsx` - Homepage component
- `/app/api/posts/route.ts` - Posts API
- `/app/api/recommendations/route.ts` - Recommendations API

**Questions:**
1. Why are posts appearing in wrong order during scroll?
2. Is there a virtual scrolling implementation issue?
3. Are API responses being cached incorrectly?
4. Is the sorting logic in the database query correct?
5. Why is loading so slow?

Please analyze the code and provide:
- Root cause analysis
- Specific fixes needed
- Code examples for the fixes
- Performance optimizations
```

## Hapi 4: Zgjidhje e Detajuar

### Prompt 3: Zgjidhje Konkrete

```
Based on the previous analysis, please provide:

1. **Fixed code** for `/app/page.tsx` that:
   - Maintains correct post order during scroll
   - Prevents posts from jumping around
   - Optimizes rendering performance

2. **Optimized code** for `/app/api/posts/route.ts` that:
   - Reduces query time from 5+ seconds to under 1 second
   - Ensures correct sorting order
   - Adds proper indexing recommendations

3. **Database optimization**:
   - Suggest indexes needed in Prisma schema
   - Query optimization strategies

4. **Step-by-step implementation guide**:
   - What files to modify
   - What code to add/remove
   - How to test the fixes

Provide complete, working code solutions.
```

## Hapi 5: Testimi dhe Verifikimi

### Prompt 4: Verifikim Final

```
After implementing the fixes, please verify:

1. Are all the performance improvements implemented?
2. Is the post order issue fixed?
3. Are there any edge cases we missed?
4. Are there any breaking changes?
5. What should we test before merging?

Provide a testing checklist.
```

## Struktura e Punës

### Workflow:
1. **Ti** → Lexo kodin aktual në GitHub
2. **Unë** → Përgatis prompt-in për Sonnet 4.5
3. **Ti** → Kopjo prompt-in në GitHub Copilot Chat (Sonnet 4.5)
4. **Sonnet 4.5** → Analizon dhe jep rekomandime
5. **Ti** → Kopjo përgjigjen e Sonnet 4.5 këtu
6. **Unë** → Zbato ndryshimet në kod
7. **Ti** → Testo dhe commit-o ndryshimet

## Proces i Detajuar

### Hapi 1: Krijoni PR
```bash
# Tashmë u bë - PR është krijuar
```

### Hapi 2: Hapni GitHub Copilot Chat
1. Shkoni në PR në GitHub
2. Klikoni "Ask Copilot" ose ikona e chat-it
3. Sigurohuni që Sonnet 4.5 është zgjedhur si model

### Hapi 3: Kopjoni Prompt-in e Parë
- Kopjoni "Prompt 1: Review i Plotë i Kodit" nga më lart
- Ngjisni në chat
- Pritni përgjigjen e Sonnet 4.5

### Hapi 4: Kopjoni Prompt-in e Dytë
- Kopjoni "Prompt 2: Analizë e Problemit të Homepage"
- Ngjisni në chat
- Sonnet 4.5 do të analizojë problemin specifik

### Hapi 5: Merrni Zgjidhjen
- Kopjoni "Prompt 3: Zgjidhje Konkrete"
- Sonnet 4.5 do të japë kodin e fixuar

### Hapi 6: Kopjoni Përgjigjen Këtu
- Kopjo përgjigjen e plotë të Sonnet 4.5
- Unë do të zbatoj ndryshimet në kod

### Hapi 7: Testo dhe Commit
```bash
cd /home/ubuntu/apps/yapgrid
# Testo ndryshimet
npm run dev
# Nëse funksionon, commit-o
git add .
git commit -m "fix: homepage posts order and loading performance"
git push
```

## Shembull i Plotë i Prompts

### Prompt për Review të Plotë:
```
Review the codebase and identify performance issues, especially:
- Slow API responses in /api/posts
- Post ordering issues on homepage
- Database query optimization
```

### Prompt për Problem Specifik:
```
Analyze /app/page.tsx and /app/api/posts/route.ts. 
Posts appear in wrong order during scroll and loading is 5+ seconds.
Find the root cause and provide fixes.
```

### Prompt për Zgjidhje:
```
Provide complete fixed code for:
1. /app/page.tsx - Fix post ordering
2. /app/api/posts/route.ts - Optimize query performance
Include explanations for each change.
```

---

**Kujdes**: Gjithmonë rishiko kodin që Sonnet 4.5 sugjeron para se ta zbatojsh!

