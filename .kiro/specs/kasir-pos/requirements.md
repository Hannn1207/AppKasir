# Requirements Document

## Introduction

Sistem Kasir Penjualan (SPK) adalah aplikasi web yang memungkinkan kasir untuk mengelola menu/produk, memproses pesanan pelanggan, menghitung total dan kembalian secara otomatis, memantau ringkasan penjualan harian, serta mengelola stok barang di gudang. Sistem ini dirancang untuk mempercepat proses transaksi dan memberikan visibilitas penuh terhadap operasional penjualan.

## Glossary

- **Kasir**: Pengguna yang mengoperasikan sistem SPK untuk memproses transaksi.
- **Menu**: Daftar produk atau item yang tersedia untuk dijual beserta harganya.
- **Produk**: Satu item dalam daftar menu yang memiliki nama, harga, dan stok.
- **Pesanan**: Kumpulan satu atau lebih produk yang dipilih oleh kasir untuk satu transaksi pelanggan.
- **Transaksi**: Satu siklus pemesanan yang selesai, mencakup pemilihan produk, pembayaran, dan penghitungan kembalian.
- **Stok**: Jumlah unit produk yang tersedia di gudang.
- **Dashboard**: Halaman ringkasan yang menampilkan data penjualan dan pemasukan.
- **POS_System**: Sistem kasir Point of Sale secara keseluruhan.
- **Menu_Manager**: Modul yang menangani pengelolaan daftar produk dan harga.
- **Order_Processor**: Modul yang menangani pembuatan dan pemrosesan pesanan.
- **Payment_Calculator**: Modul yang menghitung total pesanan dan uang kembalian.
- **Sales_Dashboard**: Modul yang menampilkan ringkasan penjualan dan pemasukan harian.
- **Stock_Manager**: Modul yang menangani pengelolaan stok barang di gudang.
- **Account_Manager**: Modul yang menangani pembuatan, autentikasi, dan pengelolaan akun kasir.

---

## Requirements

### Requirement 1: Manajemen Menu/Produk

**User Story:** Sebagai kasir, saya ingin memasukkan dan mengelola daftar menu beserta harganya, sehingga produk yang tersedia selalu akurat dan terkini.

#### Acceptance Criteria

1. THE Menu_Manager SHALL menampilkan daftar semua produk yang tersedia beserta nama, harga, dan status stok.
2. WHEN kasir memasukkan nama produk, harga, dan jumlah stok awal yang valid, THE Menu_Manager SHALL menyimpan produk baru ke dalam sistem.
3. WHEN kasir memilih produk yang sudah ada dan mengubah nama atau harga, THE Menu_Manager SHALL memperbarui data produk tersebut.
4. WHEN kasir menghapus produk dari daftar menu, THE Menu_Manager SHALL menghapus produk tersebut dan produk tidak lagi tersedia untuk dipilih dalam pesanan baru.
5. IF kasir memasukkan harga produk dengan nilai kurang dari atau sama dengan nol, THEN THE Menu_Manager SHALL menampilkan pesan kesalahan dan menolak penyimpanan data.
6. IF kasir memasukkan nama produk yang sudah ada dalam sistem, THEN THE Menu_Manager SHALL menampilkan pesan peringatan duplikasi dan meminta konfirmasi sebelum menyimpan.
7. THE Menu_Manager SHALL mendukung pencarian produk berdasarkan nama dengan hasil yang ditampilkan secara real-time saat kasir mengetik.

---

### Requirement 2: Pemesanan

**User Story:** Sebagai kasir, saya ingin memasukkan pesanan pelanggan dengan memilih beberapa menu sekaligus, sehingga proses pemesanan berlangsung cepat dan akurat.

#### Acceptance Criteria

1. WHEN kasir membuka halaman pesanan baru, THE Order_Processor SHALL menampilkan daftar produk yang tersedia dan memiliki stok lebih dari nol.
2. WHEN kasir memilih satu produk dari daftar, THE Order_Processor SHALL menambahkan produk tersebut ke dalam daftar pesanan aktif dengan kuantitas awal satu.
3. WHEN kasir mengubah kuantitas produk dalam pesanan, THE Order_Processor SHALL memperbarui kuantitas dan menghitung ulang subtotal produk tersebut.
4. WHEN kasir menghapus satu produk dari pesanan aktif, THE Order_Processor SHALL menghilangkan produk tersebut dari daftar pesanan.
5. IF kasir memasukkan kuantitas produk melebihi jumlah stok yang tersedia, THEN THE Order_Processor SHALL menampilkan pesan kesalahan dan membatasi kuantitas maksimum sesuai stok yang ada.
6. WHEN kasir membatalkan pesanan aktif, THE Order_Processor SHALL mengosongkan seluruh daftar pesanan dan mengembalikan tampilan ke kondisi awal.
7. THE Order_Processor SHALL memungkinkan kasir menambahkan minimal satu dan maksimal lima puluh jenis produk berbeda dalam satu pesanan.

---

### Requirement 3: Kalkulasi Total Otomatis

**User Story:** Sebagai kasir, saya ingin sistem menghitung total pesanan secara otomatis, sehingga saya tidak perlu menghitung manual dan risiko kesalahan berkurang.

#### Acceptance Criteria

1. WHILE pesanan aktif memiliki satu atau lebih produk, THE Payment_Calculator SHALL menghitung dan menampilkan subtotal setiap produk sebagai hasil perkalian harga satuan dengan kuantitas.
2. WHILE pesanan aktif memiliki satu atau lebih produk, THE Payment_Calculator SHALL menghitung dan menampilkan total keseluruhan pesanan sebagai jumlah dari semua subtotal produk.
3. WHEN kasir mengubah kuantitas produk mana pun dalam pesanan, THE Payment_Calculator SHALL memperbarui subtotal produk tersebut dan total keseluruhan dalam waktu kurang dari 500 milidetik.
4. WHEN kasir menambahkan atau menghapus produk dari pesanan, THE Payment_Calculator SHALL memperbarui total keseluruhan secara otomatis.
5. THE Payment_Calculator SHALL menampilkan semua nilai harga dalam format mata uang Rupiah (IDR) dengan pemisah ribuan.

---

### Requirement 4: Kalkulasi Uang Kembalian

**User Story:** Sebagai kasir, saya ingin sistem yang dapat menginputkan jumlah uang dari customer dan dapat menampilkan uang kembalian pelanggan secara otomatis, sehingga proses pembayaran berlangsung cepat dan bebas kesalahan.

#### Acceptance Criteria

1. WHEN kasir memasukkan jumlah uang yang diterima dari pelanggan, THE Payment_Calculator SHALL menghitung uang kembalian sebagai selisih antara jumlah uang diterima dan total pesanan.
2. WHEN jumlah uang yang diterima lebih besar dari atau sama dengan total pesanan, THE Payment_Calculator SHALL menampilkan nilai kembalian dalam format mata uang Rupiah (IDR).
3. IF jumlah uang yang diterima kurang dari total pesanan, THEN THE Payment_Calculator SHALL menampilkan pesan bahwa pembayaran tidak mencukupi dan menampilkan selisih kekurangannya.
4. IF kasir memasukkan nilai uang diterima yang bukan angka positif, THEN THE Payment_Calculator SHALL menampilkan pesan kesalahan dan menolak nilai tersebut.
5. WHEN kasir mengkonfirmasi transaksi setelah pembayaran valid, THE Payment_Calculator SHALL menyimpan transaksi dan mereset tampilan pesanan ke kondisi awal.

---

### Requirement 5: Dashboard Penjualan

**User Story:** Sebagai kasir, saya ingin melihat total penjualan berapa menu dan berapa jumlah pendapatan uang dalam sehari, dan saya ingin melihat grafik menu yang sering dipesan oleh customer sehingga saya dapat memantau performa penjualan dengan mudah.

#### Acceptance Criteria

1. WHEN kasir membuka halaman dashboard, THE Sales_Dashboard SHALL menampilkan total pemasukan dari semua transaksi yang selesai pada hari yang sedang berjalan.
2. WHEN kasir membuka halaman dashboard, THE Sales_Dashboard SHALL menampilkan jumlah total transaksi yang selesai pada hari yang sedang berjalan.
3. WHEN kasir membuka halaman dashboard, THE Sales_Dashboard SHALL menampilkan total jumlah menu (item) yang terjual pada hari yang sedang berjalan sebagai penjumlahan seluruh kuantitas produk dari semua transaksi hari itu.
4. WHEN kasir membuka halaman dashboard, THE Sales_Dashboard SHALL menampilkan total pendapatan uang pada hari yang sedang berjalan dalam format mata uang Rupiah (IDR) dengan pemisah ribuan.
5. WHEN kasir membuka halaman dashboard, THE Sales_Dashboard SHALL menampilkan grafik (bar chart atau pie chart) yang menunjukkan menu-menu yang paling sering dipesan berdasarkan total kuantitas terjual pada hari yang sedang berjalan.
6. WHEN transaksi baru selesai dikonfirmasi, THE Sales_Dashboard SHALL memperbarui grafik menu terpopuler secara otomatis tanpa perlu me-refresh halaman.
7. WHEN kasir membuka halaman dashboard, THE Sales_Dashboard SHALL menampilkan daftar lima produk terlaris berdasarkan total kuantitas terjual pada hari yang sedang berjalan.
8. WHEN kasir membuka halaman dashboard, THE Sales_Dashboard SHALL menampilkan riwayat transaksi hari ini dengan detail waktu transaksi, daftar produk, dan total nilai transaksi.
9. WHEN kasir memilih rentang tanggal tertentu pada filter dashboard, THE Sales_Dashboard SHALL memperbarui semua data ringkasan sesuai rentang tanggal yang dipilih.
10. WHEN transaksi baru selesai dikonfirmasi, THE Sales_Dashboard SHALL memperbarui data ringkasan penjualan secara otomatis tanpa perlu me-refresh halaman.
11. WHEN kasir memilih tanggal tertentu dan mengklik tombol ekspor, THE Sales_Dashboard SHALL menghasilkan file Excel (.xlsx) yang berisi data penjualan pada tanggal tersebut.
12. THE Sales_Dashboard SHALL menghasilkan file Excel dengan tabel yang memuat kolom: nama menu, jumlah dibeli, total harga, nama kasir, dan nama customer; di mana setiap baris mewakili satu item produk dari satu transaksi.
13. WHEN file Excel berhasil dihasilkan, THE Sales_Dashboard SHALL memberi nama file secara otomatis menggunakan format penjualan-YYYY-MM-DD.xlsx berdasarkan tanggal yang dipilih untuk diekspor.

---

### Requirement 6: Manajemen Stok Gudang

**User Story:** Sebagai kasir, saya ingin memasukkan dan mengelola stok barang berdasarkan waktu barang dimasukkan ke gudang sampai batas maksimal penyimpanan barang yang ada di gudang, dan saya ingin ketika barang tersebut terjual maka stok barang otomatis berkurang sehingga ketersediaan produk selalu terpantau dan pesanan tidak melebihi stok yang ada.

#### Acceptance Criteria

1. THE Stock_Manager SHALL menampilkan daftar semua produk beserta jumlah stok saat ini.
2. WHEN kasir memasukkan jumlah penambahan stok untuk produk tertentu, THE Stock_Manager SHALL menambahkan jumlah tersebut ke stok produk yang ada dan menyimpan perubahan.
3. WHEN kasir memasukkan penambahan stok untuk suatu produk, THE Stock_Manager SHALL mencatat tanggal dan jam masuk barang tersebut ke gudang.
4. WHEN kasir membuka halaman manajemen stok, THE Stock_Manager SHALL menampilkan informasi waktu masuk barang (tanggal dan jam) pada daftar stok setiap produk.
5. THE Stock_Manager SHALL mendukung pengaturan batas maksimal kapasitas penyimpanan per produk di gudang dalam satuan unit.
6. WHEN stok suatu produk mencapai jumlah lebih dari atau sama dengan batas maksimal kapasitas penyimpanan yang ditetapkan, THE Stock_Manager SHALL menampilkan peringatan bahwa kapasitas penyimpanan produk tersebut telah mencapai atau melebihi batas maksimal.
7. WHEN stok suatu produk mencapai jumlah kurang dari atau sama dengan lima unit, THE Stock_Manager SHALL menampilkan indikator peringatan stok rendah pada produk tersebut.
8. WHEN transaksi pesanan berhasil dikonfirmasi, THE Stock_Manager SHALL mengurangi stok setiap produk dalam pesanan sesuai kuantitas yang dipesan secara otomatis.
9. IF kasir memasukkan jumlah penambahan stok dengan nilai kurang dari atau sama dengan nol, THEN THE Stock_Manager SHALL menampilkan pesan kesalahan dan menolak perubahan tersebut.
10. THE Stock_Manager SHALL mencatat riwayat setiap perubahan stok beserta waktu perubahan, jenis perubahan (penambahan atau pengurangan), dan jumlah perubahan.
11. WHEN kasir memilih produk tertentu di halaman manajemen stok, THE Stock_Manager SHALL menampilkan riwayat perubahan stok produk tersebut dalam urutan waktu terbaru terlebih dahulu.

---

### Requirement 7: Cetak Struk Pembelian

**User Story:** Sebagai kasir, saya ingin dapat mencetak struk pembelian setelah proses transaksi selesai dan kembalian dihitung, sehingga pelanggan mendapatkan bukti pembelian yang lengkap dan akurat.

#### Acceptance Criteria

1. WHEN kasir mengkonfirmasi pembayaran dan kembalian telah dihitung, THE POS_System SHALL menampilkan opsi untuk mencetak struk pembelian.
2. THE POS_System SHALL mencetak struk yang memuat nama toko, nama kasir, nama customer, tanggal dan waktu transaksi, daftar produk yang dipesan beserta kuantitas dan harga satuan, subtotal per produk, total pesanan, jumlah uang yang diterima, dan uang kembalian.
3. WHEN kasir memulai pesanan baru, THE Order_Processor SHALL menyediakan kolom input untuk memasukkan nama customer sebelum transaksi dikonfirmasi.
4. WHEN kasir memilih opsi cetak struk, THE POS_System SHALL membuka dialog cetak browser (browser print dialog) untuk memproses pencetakan struk.
5. WHEN kasir memilih untuk melewati (skip) pencetakan struk, THE POS_System SHALL melewati proses cetak tanpa mencetak struk apa pun.
6. WHEN proses cetak struk selesai atau kasir memilih untuk melewati pencetakan, THE POS_System SHALL mereset tampilan ke kondisi awal sehingga siap untuk transaksi berikutnya.

---

### Requirement 8: Manajemen Akun Kasir

**User Story:** Sebagai admin/pemilik toko, saya ingin membuat dan mengelola akun kasir, sehingga setiap kasir dapat login dengan akun masing-masing dan aktivitas transaksi dapat dilacak per kasir.

#### Acceptance Criteria

1. WHEN admin memasukkan username, password, dan nama lengkap yang valid, THE Account_Manager SHALL membuat akun kasir baru dan menyimpannya ke dalam sistem.
2. WHEN kasir memasukkan username dan password yang benar pada halaman login, THE Account_Manager SHALL mengautentikasi kasir dan mengizinkan akses ke sistem.
3. WHILE kasir sedang login, THE POS_System SHALL menampilkan nama lengkap kasir yang sedang aktif di halaman utama.
4. WHEN admin memilih akun kasir tertentu dan memilih opsi nonaktifkan atau hapus, THE Account_Manager SHALL menonaktifkan atau menghapus akun kasir tersebut sehingga kasir tidak dapat login.
5. WHEN transaksi berhasil dikonfirmasi, THE Order_Processor SHALL mencatat nama kasir yang memproses transaksi tersebut bersama data transaksi.
6. WHEN kasir memasukkan password lama yang benar dan password baru yang valid, THE Account_Manager SHALL memperbarui password akun kasir tersebut.
7. IF kasir memasukkan username atau password yang salah pada halaman login, THEN THE Account_Manager SHALL menampilkan pesan kesalahan dan menolak permintaan login.
8. THE Account_Manager SHALL mendukung dua peran pengguna: admin dengan akses terbatas pada pengelolaan akun kasir (membuat, menonaktifkan, dan menghapus akun), dan kasir dengan akses penuh ke seluruh fitur operasional sistem.
9. WHILE pengguna dengan peran admin sedang login, THE POS_System SHALL membatasi akses hanya pada halaman manajemen akun kasir dan menolak akses ke halaman transaksi penjualan, manajemen menu, manajemen stok gudang, dashboard penjualan, cetak struk, dan ekspor Excel.
10. WHILE pengguna dengan peran kasir sedang login, THE POS_System SHALL mengizinkan akses ke seluruh fitur operasional: transaksi penjualan, manajemen menu, manajemen stok gudang, dashboard penjualan, cetak struk, dan ekspor Excel.
