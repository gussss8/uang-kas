const form = document.getElementById('formKas');
const tbody = document.querySelector('#tabelKas tbody');
const totalKasDisplay = document.getElementById('totalKas');
const filterBulan = document.getElementById('filterBulan');
const printBtn = document.getElementById('printBtn');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

let dataKas = JSON.parse(localStorage.getItem('dataKas')) || [];
let editMode = false;
let editInfo = null;

updateFilterBulan();

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const nama = document.getElementById('nama').value.trim();
  const bulan = document.getElementById('bulan').value;
  const minggu = document.getElementById('minggu').value;
  const jumlah = parseInt(document.getElementById('jumlah').value);

  if (!nama || !bulan || !minggu || isNaN(jumlah) || jumlah <= 0) {
    alert('Isi semua data dengan benar!');
    return;
  }

  // --- EDIT MODE ---
  if (editMode && editInfo) {
    const bulanData = dataKas.find(b => b.bulan === editInfo.bulan);
    if (bulanData) {
      const siswa = bulanData.siswa.find(s => s.nama === editInfo.nama);
      if (siswa) {
        siswa[`minggu${minggu}`] = jumlah;
      }
    }
    alert('✅ Data siswa berhasil diperbarui!');
    editMode = false;
    editInfo = null;
  } else {
    // --- TAMBAH MODE ---
    let bulanData = dataKas.find(item => item.bulan === bulan);
    if (!bulanData) {
      bulanData = { bulan, siswa: [] };
      dataKas.push(bulanData);
    }

    // Pastikan nama unik (beda huruf besar kecil dianggap sama)
    let siswa = bulanData.siswa.find(s => s.nama.toLowerCase() === nama.toLowerCase());
    if (!siswa) {
      siswa = { nama, minggu1: 0, minggu2: 0, minggu3: 0, minggu4: 0 };
      bulanData.siswa.push(siswa);
    }

    siswa[`minggu${minggu}`] = jumlah;
    alert('✅ Data siswa baru berhasil ditambahkan!');
  }

  // Simpan ke LocalStorage
  try {
    localStorage.setItem('dataKas', JSON.stringify(dataKas));
  } catch (err) {
    alert('❌ Penyimpanan penuh! Silakan backup dan hapus data lama.');
  }

  updateFilterBulan();
  renderTable(filterBulan.value || bulan);
  form.reset();
});

filterBulan.addEventListener('change', () => {
  renderTable(filterBulan.value);
});

function renderTable(bulan) {
  tbody.innerHTML = '';
  let totalKas = 0;

  const bulanData = dataKas.find(item => item.bulan === bulan);
  if (!bulanData) {
    totalKasDisplay.textContent = 'Rp 0';
    return;
  }

  bulanData.siswa.forEach((item, index) => {
    const total = item.minggu1 + item.minggu2 + item.minggu3 + item.minggu4;
    totalKas += total;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.nama}</td>
      <td class="${item.minggu1 > 0 ? 'lunas' : 'belum'}">${item.minggu1 > 0 ? 'Lunas' : 'Belum'}</td>
      <td class="${item.minggu2 > 0 ? 'lunas' : 'belum'}">${item.minggu2 > 0 ? 'Lunas' : 'Belum'}</td>
      <td class="${item.minggu3 > 0 ? 'lunas' : 'belum'}">${item.minggu3 > 0 ? 'Lunas' : 'Belum'}</td>
      <td class="${item.minggu4 > 0 ? 'lunas' : 'belum'}">${item.minggu4 > 0 ? 'Lunas' : 'Belum'}</td>
      <td>Rp ${total.toLocaleString()}</td>
      <td>
        <button class="editBtn" data-bulan="${bulan}" data-nama="${item.nama}">✏️ Edit</button>
        <button class="deleteBtn" data-bulan="${bulan}" data-nama="${item.nama}">🗑️ Hapus</button>
      </td>
    `;
    tbody.appendChild(row);
  });

  totalKasDisplay.textContent = 'Rp ' + totalKas.toLocaleString();

  // Tombol edit
  document.querySelectorAll('.editBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const nama = e.target.dataset.nama;
      const bulan = e.target.dataset.bulan;
      startEdit(nama, bulan);
    });
  });

  // Tombol hapus
  document.querySelectorAll('.deleteBtn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const nama = e.target.dataset.nama;
      const bulan = e.target.dataset.bulan;
      deleteSiswa(nama, bulan);
    });
  });
}

function startEdit(nama, bulan) {
  const bulanData = dataKas.find(b => b.bulan === bulan);
  if (!bulanData) return;
  const siswa = bulanData.siswa.find(s => s.nama === nama);
  if (!siswa) return;

  document.getElementById('nama').value = siswa.nama;
  document.getElementById('bulan').value = bulan;

  let mingguTerisi = Object.entries(siswa).find(([k, v]) => k.startsWith('minggu') && v > 0);
  if (mingguTerisi) {
    const minggu = mingguTerisi[0].replace('minggu', '');
    document.getElementById('minggu').value = minggu;
    document.getElementById('jumlah').value = siswa[`minggu${minggu}`];
  }

  editMode = true;
  editInfo = { nama, bulan };
  alert(`✏️ Mode edit untuk ${nama} (${bulan}) diaktifkan.`);
}

function deleteSiswa(nama, bulan) {
  if (!confirm(`Hapus data ${nama} dari bulan ${bulan}?`)) return;

  const bulanData = dataKas.find(b => b.bulan === bulan);
  if (!bulanData) return;

  bulanData.siswa = bulanData.siswa.filter(s => s.nama !== nama);
  localStorage.setItem('dataKas', JSON.stringify(dataKas));
  renderTable(bulan);
}

function updateFilterBulan() {
  const bulanList = [...new Set(dataKas.map(item => item.bulan))];
  filterBulan.innerHTML = '<option value="">-- Pilih Bulan --</option>';
  bulanList.forEach(bulan => {
    const opt = document.createElement('option');
    opt.value = bulan;
    opt.textContent = bulan;
    filterBulan.appendChild(opt);
  });
}

printBtn.addEventListener('click', () => {
  if (!filterBulan.value) {
    alert('Pilih bulan terlebih dahulu!');
    return;
  }
  window.print();
});

// Simpan data ke file JSON
exportBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify(dataKas, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data_kas.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Muat data JSON
importBtn.addEventListener('click', () => importFile.click());
importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const importedData = JSON.parse(event.target.result);
      if (Array.isArray(importedData)) {
        dataKas = importedData;
        localStorage.setItem('dataKas', JSON.stringify(dataKas));
        updateFilterBulan();
        renderTable(filterBulan.value);
        alert('✅ Data berhasil dimuat!');
      } else {
        alert('❌ Format file tidak valid!');
      }
    } catch {
      alert('❌ Gagal membaca file!');
    }
  };
  reader.readAsText(file);
});

// tampilkan tabel awal
if (filterBulan.options.length > 1) {
  filterBulan.selectedIndex = 1;
  renderTable(filterBulan.value);
}
