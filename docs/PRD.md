# Real-Life Quest Tracker MVP PRD

## Product Summary
Web app untuk mengelola aktivitas dunia nyata dengan pola UI dan progres ala panel event game. User tidak hanya mencentang tugas, tetapi melakukan `check-in` berulang terhadap aktivitas yang punya target periodik seperti `daily`, `weekly`, `monthly`, dan `yearly`.

Contoh:
- `Makan`: daily `3`
- `Mandi`: daily `2`
- `Gym`: daily `1`, weekly `5`, daily cap `1`
- `Liburan`: weekly `1`, monthly `2`
- `Cek Lab`: monthly `1`, yearly `2`

## Problem
To-do list biasa terlalu datar untuk aktivitas yang sifatnya berulang dan bertarget. Habit tracker biasa juga sering gagal menangani kasus seperti:
- target mingguan yang harus dicicil harian
- aktivitas dengan lebih dari satu target sekaligus
- progres yang terasa hidup dan memotivasi

## Goal
Membuat MVP single-user yang:
- memudahkan user membuat aktivitas periodik
- mendukung check-in berulang dengan aturan cap
- menampilkan progres yang jelas dan interaktif
- memberi rasa progression lewat poin dan milestone

## Non-Goals
- multi-user, social, leaderboard
- notification push
- AI recommendation
- integration ke health apps, calendar eksternal, atau wearable
- reward economy kompleks seperti shop, avatar, item

## Primary User
Individu yang ingin mengelola rutinitas, self-care, health, dan life admin dengan pengalaman yang lebih engaging daripada checklist biasa.

## Core User Stories
1. Sebagai user, saya bisa membuat aktivitas dengan target periodik seperti `daily 3` atau `weekly 5`.
2. Sebagai user, saya bisa menambahkan batas seperti `daily cap 1` agar target mingguan tidak bisa dihabiskan dalam satu hari.
3. Sebagai user, saya bisa menekan tombol `+1` untuk mencatat aktivitas yang saya lakukan.
4. Sebagai user, saya bisa melihat status aktivitas hari ini: belum mulai, sedang berjalan, selesai, atau sudah mentok untuk hari ini.
5. Sebagai user, saya bisa membuka kalender mingguan untuk melihat distribusi aktivitas dan event rutin.
6. Sebagai user, saya bisa melihat reward progress berdasarkan poin mingguan.
7. Sebagai user, saya bisa meng-undo check-in terakhir bila salah input.

## MVP Scope
Ada 3 halaman utama:

### 1. Today / Event
Menampilkan semua aktivitas aktif dalam bentuk card.

Setiap card menampilkan:
- nama aktivitas
- kategori
- counter period aktif, misalnya `daily 1/3`, `weekly 2/5`
- badge status: `Not started`, `In progress`, `Complete`, `Capped for today`
- tombol `+1`
- tombol undo terakhir jika tersedia

Di bagian bawah halaman:
- progress bar poin periode aktif
- milestone reward `20 / 40 / 60 / 80 / 100`

### 2. Calendar
Menampilkan kalender 7 hari.

Fungsi utama:
- melihat aktivitas terjadwal per hari
- melihat hari yang punya aktivitas penting
- memberi visibilitas ke rutinitas weekly

### 3. Manage Activities
Form untuk membuat dan mengedit aktivitas.

Field minimum:
- title
- category
- icon atau color
- points per check-in
- periodic targets: daily, weekly, monthly, yearly
- periodic caps: daily, weekly, monthly, yearly
- optional schedule weekdays
- active atau archived

## Functional Requirements

### Activities
- User bisa membuat aktivitas baru.
- User bisa mengedit aktivitas.
- User bisa mengarsipkan aktivitas tanpa menghapus riwayat.

### Check-in
- Check-in menambah `1` unit progres pada aktivitas.
- Sistem membuat log check-in yang tersimpan.
- User bisa undo check-in terakhir pada logical day yang sama.
- Sistem menolak check-in jika cap periode kecil sudah tercapai.

### Progress Rules
- Satu aktivitas bisa punya lebih dari satu target paralel.
- Satu aktivitas bisa punya lebih dari satu cap paralel.
- Target dan cap dihitung berdasarkan timezone dan reset hour milik user.
- Status `Complete` untuk card berarti target harian tercapai atau semua target yang relevan untuk hari itu tercapai.
- Status `Capped for today` berarti check-in tambahan ditolak walaupun target periode besar masih belum penuh.

### Reward Progress
- Tiap check-in memberi poin sesuai `points_per_checkin`.
- Poin dihitung untuk reward track aktif, default `weekly`.
- Milestone tampil sebagai visual progression, bukan sistem hadiah kompleks.

## Business Rules
- `Daily` reset setiap hari pada `reset_hour_local`.
- `Weekly` reset setiap awal minggu pada hari yang dipilih sistem, default `Monday`, di `reset_hour_local`.
- `Monthly` reset tanggal `1`.
- `Yearly` reset `January 1`.
- Perhitungan berbasis `logical day`, bukan semata-mata jam 00:00.
- Jika aktivitas punya `weekly target 5` dan `daily cap 1`, maka maksimum kontribusi ke target weekly tetap `1` per logical day.
- Tidak ada carry-over pada MVP.
- Undo mengubah status log menjadi `reverted`, bukan menghapus permanen.

## UX Requirements
- UI harus cepat dibaca seperti panel event game.
- Counter harus lebih dominan daripada deskripsi panjang.
- Satu aksi utama per card: `+1`.
- Feedback check-in harus instan.
- Status selesai dan capped harus sangat jelas secara visual.

## Success Metrics
- User dapat membuat aktivitas pertama dalam kurang dari 2 menit.
- User dapat check-in harian tanpa membuka halaman pengaturan.
- Tidak ada salah hitung pada counter daily, weekly, monthly, yearly.
- Semua aturan cap tervalidasi konsisten.

## Suggested Build Order
1. Activity CRUD
2. Check-in log + reset window calculation
3. Counter derivation per period
4. Cap validation
5. Today / Event UI
6. Reward progress bar
7. Calendar
