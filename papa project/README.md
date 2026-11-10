# Dar-ul-Ehsan • Hazrat Sufi Abu Anees Muhammad Barkat Ali (رحمۃ اللہ علیہ)

A web platform dedicated to the sacred life, teachings, 3D scroll wisdom, and *Makalat-e-Hikmat* aphorisms of **Hazrat Sufi Abu Anees Muhammad Barkat Ali (R.A.)** (1911–1997), founder of Dar-ul-Ehsan.

---

## 🌟 Key Features

### 1. 3D Scroll Animation Homepage (`/`)
- **Three.js Celestial WebGL Canvas**: Ambient golden particle cloud and sacred geometric armillary rings that orbit smoothly and respond to mouse movements and scroll depth.
- **3D Interactive Tome of Makalat-e-Hikmat**: A 3D book that rotates dynamically in 3D perspective (`rotateX`, `rotateY`, `translateZ`) as you scroll down the page, revealing wisdom leaves with calligraphy.
- **Hero & Pillars of Dar-ul-Ehsan**: Core foundations (Zikrullah, Free Eye Hospitals, Qur'an Kareem Distribution, Makalat-e-Hikmat).
- **Featured Wisdom & Live Stats Counter**: 30 Volumes, 10,000+ Aphorisms, 500,000+ Free Eye Surgeries.

### 2. Makalat Wisdom Feeds (`/makalat`)
- **Multi-Feed Categorisation**:
  - `All Wisdom` (Full 10,000+ archive)
  - `Makalat-e-Hikmat` (Classic Aphorisms)
  - `Zikrullah & Tazkiya` (Spiritual Purification)
  - `Khidmat-e-Khalq` (Humanitarian Compassion)
  - `Tawakkul & Sabr` (Trust in Divine Providence)
  - `Ishq-e-Rasool ﷺ` (Love for Prophet Muhammad ﷺ)
  - `My Saved Pearls` (Personal bookmarks persisted in localStorage)
- **Instant Search & Volume Filter**: Real-time filtering across Urdu Nastaliq text, English translation, volume numbers, and themes.
- **Interactive Action Toolbar on Every Quote**:
  - 📋 **Copy to Clipboard** with celebratory checkmark and confetti
  - 📤 **Web Share API** for WhatsApp/Social sharing
  - 🖼️ **Download Quote Picture Card**: Client-side HTML5 Canvas generator that exports a high-res PNG quote card with emerald-gold styling
  - 🔊 **Voice Read Aloud**: Speech synthesis narration
  - ❤️ **Favorite / Bookmark**: One-click local bookmarking

### 3. Detailed Biography & Legacy Chronicle (`/about`)
- Comprehensive historical chronicle covering Hazrat Baba Ji's blessed birth (1911 in Ludhiana), honourable military service in the Royal Indian Army Engineers, migration to Pakistan, the founding of Dar-ul-Ehsan, the Free Eye Hospitals, and holy wisaal (1997).
- Interactive Milestones Timeline (1911 to 1997).
- Free Eye Camps history (over 50,000 free cataract surgeries annually with free medicine and food).

### 4. Historical Photo Gallery & View Style Lightbox (`/gallery`)
- Categorized photo stream:
  - *Hazrat Baba Ji (Historic Portraits)*
  - *Dar-ul-Ehsan Sanctuary Grounds*
  - *Free Eye Camps & Humanitarian Relief*
  - *Sacred Manuscripts & Calligraphy*
- **Interactive View Style Lightbox Modal**:
  - Click any image to open in full view mode.
  - Controls: Zoom In (`+`), Zoom Out (`-`), Reset Zoom, Direct High-Res Download, Copy Direct URL, and Keyboard arrow navigation (`Esc`, `←`, `→`).

### 5. Backend Management System (`/admin`)
- **Direct Image URL Upload**:
  - Input any direct image URL (`https://...`).
  - **Live URL Preview**: Validates the link before submission.
  - Set title, category, year, location, and description.
- **Makalat Publishing Form**:
  - Add Urdu text (with Nastaliq preview) and English translation.
  - Assign feed category, volume, and Hikmat reference.
- **CRUD Item Management**: Delete, inspect, and filter uploaded items.
- **Backup & GitHub Sync**: Download complete database as `db.json` with one click or import backup JSON anytime.

### 6. Full Optimization
- Next.js `next/image` with WebP and AVIF formats enabled.
- Remote URL wildcard patterns configured in `next.config.ts`.
- Blazing-fast page loads, zero layout shifts, and SEO OpenGraph tags.

---

## 🚀 How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev

# 3. Open your browser
http://localhost:3000
```

---

## 📦 How to Push to GitHub and Deploy on Vercel

### Step 1: Initialize Git and Commit
In your terminal, run:
```bash
git init
git add .
git commit -m "Initial commit: Hazrat Sufi Barkat Ali Dar-ul-Ehsan website"
```

### Step 2: Push to GitHub
1. Create a new repository on [GitHub](https://github.com/new) (e.g. `dar-ul-ehsan-web`).
2. Run the following commands:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/dar-ul-ehsan-web.git
git push -u origin main
```

### Step 3: Deploy on Vercel
1. Go to [Vercel](https://vercel.com) and log in.
2. Click **"Add New..."** &rarr; **"Project"**.
3. Select your GitHub repository (`dar-ul-ehsan-web`).
4. Framework preset will automatically be detected as **Next.js**.
5. Click **"Deploy"**.
6. In ~60 seconds, your website will be live worldwide with free SSL, global CDN, and automatic image optimization!
