let chart;

// ================= UTIL =================
function deg2rad(d) {
  return (d * Math.PI) / 180;
}
function rad2deg(r) {
  return (r * 180) / Math.PI;
}
function norm(x) {
  return ((x % 360) + 360) % 360;
}

function julian(date) {
  return date / 86400000 + 2440587.5;
}

// ================= SUPER AKURASI =================

// Delta-T
function deltaT(year) {
  let y = year;

  return 62.92 + 0.32217 * (y - 2000) + 0.005589 * Math.pow(y - 2000, 2);
}

// Refraction Saemundsson
function refractionSaemundsson(alt) {
  if (alt > -1) {
    return alt + 1.02 / Math.tan(deg2rad(alt + 10.3 / (alt + 5.11))) / 60;
  }
  return alt;
}

// Topocentric correction
function topocentricCorrection(alt, lat) {
  let rho = 0.99833 + 0.00167 * Math.cos(2 * deg2rad(lat));
  return alt - rho * 0.9507 * Math.cos(deg2rad(alt));
}

// Elongasi akurat (pakai bujur ekliptika)
function elongasiAkurat(s, m) {
  let diff = Math.abs(m.lambda - s.lambda);

  if (diff > 180) {
    diff = 360 - diff;
  }

  return diff;
}

// ================= UPGRADE FINAL =================

// nutasi
function nutation(d) {
  let L = deg2rad(280.4665 + (36000.7698 * d) / 36525);
  let LP = deg2rad(218.3165 + (481267.8813 * d) / 36525);
  let omega = deg2rad(125.04452 - (1934.136261 * d) / 36525);

  return (
    (-17.2 * Math.sin(omega) -
      1.32 * Math.sin(2 * L) -
      0.23 * Math.sin(2 * LP) +
      0.21 * Math.sin(2 * omega)) /
    3600
  );
}

// semi diameter hilal
function semiDiameterMoon() {
  return 0.2725;
}

// ================= GEO =================
function ambilLokasi() {
  navigator.geolocation.getCurrentPosition((pos) => {
    document.getElementById("lat").value = pos.coords.latitude.toFixed(4);
    document.getElementById("lng").value = pos.coords.longitude.toFixed(4);
  });
}

// ================= SUN =================
function sun(d) {
  let M = deg2rad(357.52911 + 0.98560028 * d);
  let C =
    1.914602 * Math.sin(M) +
    0.019993 * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);

  let L = 280.46646 + 0.98564736 * d + C;
  L = L - 0.00569;
  let nut = nutation(d);
  L = L + nut;
  let T = d / 36525;
  let e = 23.439291 - 0.0130042 * T;

  let RA = rad2deg(
    Math.atan2(
      Math.cos(deg2rad(e)) * Math.sin(deg2rad(L)),
      Math.cos(deg2rad(L)),
    ),
  );

  let Dec = rad2deg(Math.asin(Math.sin(deg2rad(e)) * Math.sin(deg2rad(L))));

  return {
    RA: norm(RA),
    Dec,
    lambda: norm(L),
  };
}

// ================= MOON =================
function moon(d) {
  let JD = 2451545 + d;
  let T = (JD - 2451545.0) / 36525;

  let L0 = norm(218.3164477 + 481267.88123421 * T);

  let D = norm(297.8501921 + 445267.1114034 * T);

  let M = norm(357.5291092 + 35999.0502909 * T);

  let Mprime = norm(134.9633964 + 477198.8675055 * T);

  let F = norm(93.272095 + 483202.0175233 * T);

  let lambda =
    L0 +
    6.289 * Math.sin(deg2rad(Mprime)) +
    1.274 * Math.sin(deg2rad(2 * D - Mprime)) +
    0.658 * Math.sin(deg2rad(2 * D)) +
    0.214 * Math.sin(deg2rad(2 * Mprime)) -
    0.186 * Math.sin(deg2rad(M)) -
    0.114 * Math.sin(deg2rad(2 * F)) +
    0.059 * Math.sin(deg2rad(2 * D - 2 * Mprime)) +
    0.057 * Math.sin(deg2rad(2 * D - M - Mprime)) +
    0.053 * Math.sin(deg2rad(2 * D + Mprime)) +
    0.046 * Math.sin(deg2rad(2 * D - M)) +
    0.041 * Math.sin(deg2rad(M - Mprime)) -
    0.035 * Math.sin(deg2rad(D)) -
    0.031 * Math.sin(deg2rad(M + Mprime)) -
    0.015 * Math.sin(deg2rad(2 * F - 2 * D)) +
    0.011 * Math.sin(deg2rad(Mprime - 4 * D));

  let beta =
    5.128 * Math.sin(deg2rad(F)) +
    0.28 * Math.sin(deg2rad(Mprime + F)) +
    0.277 * Math.sin(deg2rad(Mprime - F)) +
    0.173 * Math.sin(deg2rad(2 * D - F)) +
    0.055 * Math.sin(deg2rad(2 * D + F - Mprime)) +
    0.046 * Math.sin(deg2rad(2 * D - F - Mprime));
  beta +=
    0.017 * Math.sin(deg2rad(2 * F + Mprime)) +
    0.009 * Math.sin(deg2rad(F + 2 * Mprime));

  let distance =
    385000.56 -
    20905 * Math.cos(deg2rad(Mprime)) -
    3699 * Math.cos(deg2rad(2 * D - Mprime)) -
    2956 * Math.cos(deg2rad(2 * D)) -
    570 * Math.cos(deg2rad(2 * Mprime)) +
    246 * Math.cos(deg2rad(2 * Mprime - 2 * D)) -
    205 * Math.cos(deg2rad(M - 2 * D)) -
    171 * Math.cos(deg2rad(Mprime + 2 * D));

  let e = 23.439291 - 0.0130042 * T;

  let x = Math.cos(deg2rad(lambda)) * Math.cos(deg2rad(beta));

  let y =
    Math.sin(deg2rad(lambda)) * Math.cos(deg2rad(beta)) * Math.cos(deg2rad(e)) -
    Math.sin(deg2rad(beta)) * Math.sin(deg2rad(e));

  let z =
    Math.sin(deg2rad(lambda)) * Math.cos(deg2rad(beta)) * Math.sin(deg2rad(e)) +
    Math.sin(deg2rad(beta)) * Math.cos(deg2rad(e));

  let RA = rad2deg(Math.atan2(y, x));
  let Dec = rad2deg(Math.asin(z));

  // koreksi nutasi bulan
  let omega = 125.04452 - 1934.136261 * T;
  let nutLon = (-17.2 * Math.sin(deg2rad(omega))) / 3600;

  // apparent longitude bulan
  lambda = lambda + nutLon;

  // hitung ulang koordinat equatorial
  let x2 = Math.cos(deg2rad(lambda)) * Math.cos(deg2rad(beta));

  let y2 =
    Math.sin(deg2rad(lambda)) * Math.cos(deg2rad(beta)) * Math.cos(deg2rad(e)) -
    Math.sin(deg2rad(beta)) * Math.sin(deg2rad(e));

  let z2 =
    Math.sin(deg2rad(lambda)) * Math.cos(deg2rad(beta)) * Math.sin(deg2rad(e)) +
    Math.sin(deg2rad(beta)) * Math.cos(deg2rad(e));

  RA = rad2deg(Math.atan2(y2, x2));
  Dec = rad2deg(Math.asin(z2));

  return {
    RA: norm(RA),
    Dec: Dec,
    lambda: norm(lambda),
    distance: distance,
  };
}

function topocentricEquatorial(m, lat, lng, jd) {
  let phi = deg2rad(lat);

  let lst = sidereal(jd, lng);

  let Hdeg = lst - m.RA;

  if (Hdeg > 180) Hdeg -= 360;
  if (Hdeg < -180) Hdeg += 360;

  let H = deg2rad(Hdeg);

  let dec = deg2rad(m.Dec);

  let pi = Math.asin(6378.14 / m.distance);

  let dRA = Math.atan2(
    -Math.cos(phi) * Math.sin(pi) * Math.sin(H),
    Math.cos(dec) - Math.cos(phi) * Math.sin(pi) * Math.cos(H),
  );

  let RA_topo = m.RA + rad2deg(dRA);

  let Dec_topo = rad2deg(
    Math.atan2(
      (Math.sin(dec) - Math.sin(phi) * Math.sin(pi)) * Math.cos(dRA),
      Math.cos(dec) - Math.cos(phi) * Math.sin(pi) * Math.cos(H),
    ),
  );

  return {
    RA: norm(RA_topo),
    Dec: Dec_topo,
  };
}

// ================= SIDEREAL =================
function sidereal(jd, lng) {
  let jd0 = Math.floor(jd - 0.5) + 0.5;
  let H = (jd - jd0) * 24;

  let D = jd - 2451545.0;
  let D0 = jd0 - 2451545.0;
  let T = D / 36525;

  let GMST =
    6.697374558 + 0.06570982441908 * D0 + 1.00273790935 * H + 0.000026 * T * T;

  let LST = GMST * 15 + lng;

  return norm(LST);
}

// ================= MAGHRIB REAL =================
function waktuMaghrib(lat, dec, lng, elev = 0, dateInput) {
  lat = deg2rad(lat);
  dec = deg2rad(dec);

  // altitude matahari saat maghrib
  let h0 = deg2rad(-0.8333 - dip(elev));

  let cosH =
    (Math.sin(h0) - Math.sin(lat) * Math.sin(dec)) /
    (Math.cos(lat) * Math.cos(dec));

  if (cosH < -1) cosH = -1;
  if (cosH > 1) cosH = 1;

  let H = Math.acos(cosH);

  let dayOfYear = Math.floor(
    (dateInput - new Date(dateInput.getFullYear(), 0, 0)) / 86400000,
  );

  let B = deg2rad((360 / 365) * (dayOfYear - 81));

  let eqTime = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // koreksi semi diameter matahari + refraksi horizon
  let hCorrection = 0.53;

  // sunset lebih realistis
  let solarTime = 12 + rad2deg(H) / 15 - hCorrection / 15;

  // koreksi longitude zona WIB
  let standardMeridian;

  if (lng < 115) {
    standardMeridian = 105; // WIB
  } else if (lng < 130) {
    standardMeridian = 120; // WITA
  } else {
    standardMeridian = 135; // WIT
  }

  // koreksi longitude + equation of time
  let clockTime = solarTime + (standardMeridian - lng) / 15 - eqTime / 60;

  return clockTime;
}

// ================= ALT AZ =================
function hor(lat, dec, HA) {
  lat = deg2rad(lat);
  dec = deg2rad(dec);
  HA = deg2rad(HA);

  let alt = Math.asin(
    Math.sin(lat) * Math.sin(dec) +
      Math.cos(lat) * Math.cos(dec) * Math.cos(HA),
  );

  let az = Math.atan2(
    -Math.sin(HA),
    Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(HA),
  );

  return { alt: rad2deg(alt), az: norm(rad2deg(az)) };
}

// ================= REFRAKSI =================
function refr(alt) {
  if (alt > -1) {
    return alt + 1.02 / Math.tan(deg2rad(alt + 10.3 / (alt + 5.11)));
  }
  return alt;
}

// ================= PILIH KOTA =================
function pilihKota() {
  let val = document.getElementById("kota").value;
  if (val) {
    let [latK, lngK] = val.split(",");
    document.getElementById("lat").value = latK;
    document.getElementById("lng").value = lngK;
  }
}

// ================= IJTIMA REAL =================
function ijtimaReal(d) {
  let x = d;

  for (let i = 0; i < 15; i++) {
    let s = sun(x);
    let m = moon(x);

    let diff = m.lambda - s.lambda;

    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    x = x - diff / 12.190749;
  }

  return x;
}

// ================= KONVERSI JD =================
function jdToDate(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}

// ================= PARALLAX =================
function parallaxCorrection(alt, distance) {
  let ratio = 6378 / distance;

  // pengaman
  ratio = Math.max(0, Math.min(1, ratio));

  const pi = rad2deg(Math.asin(ratio));

  return alt - pi * Math.cos(deg2rad(alt));
}

// ================= DIP (KETINGGIAN TEMPAT) =================
function dip(elev) {
  return (1.76 * Math.sqrt(elev)) / 60;
}

// ================= ALTITUDE =================
function altitudeHilal(
  lat,
  dec,
  HA,
  elev = 0,
  distance = 384400,
  pressure = 1010,
  temp = 27,
) {
  lat = deg2rad(lat);
  dec = deg2rad(dec);
  HA = deg2rad(HA);

  // GEOMETRIC
  let sinAlt =
    Math.sin(lat) * Math.sin(dec) +
    Math.cos(lat) * Math.cos(dec) * Math.cos(HA);

  sinAlt = Math.max(-1, Math.min(1, sinAlt));

  let alt = rad2deg(Math.asin(sinAlt));

  // REFRAKSI REAL
  if (alt > -1) {
    alt = refractionSaemundsson(alt);
  }

  // DIP
  alt = alt - dip(elev) * 0.3;

  // SEMI DIAMETER
  // gunakan tinggi pusat bulan (bukan tepi atas)
  let SD = rad2deg(Math.asin(1737.4 / distance));

  // kalau mau tinggi tepi atas:
  // alt += SD

  // untuk hisab hilal lebih stabil gunakan pusat bulan:
  alt = alt;

  return alt;
}

function altitudeSuperPrecise(jd, lat, lng, elev) {
  let d = jd - 2451545;

  let m = moon(d);

  let lst = sidereal(jd, lng);

  let H = lst - m.RA;

  if (H > 180) H -= 360;
  if (H < -180) H += 360;

  return altitudeHilal(lat, m.Dec, H, elev, m.distance);
}

function badge(status) {
  return status
    ? '<span class="badge">✔ Terlihat</span>'
    : '<span class="badge" style="background:#d50000">✖ Tidak</span>';
}
function hitungGrafikReal(jd, lat, lng, elev) {
  let data = [];
  let labels = [];

  for (let i = 0; i <= 30; i += 10) {
    let jd_i = jd + i / 1440;

    let d_i = jd_i - 2451545;

    let s = sun(d_i);
    let m = moon(d_i);

    let LST = sidereal(jd_i, lng);

    let topo = topocentricEquatorial(m, lat, lng, jd_i);

    let HA = LST - topo.RA;

    if (HA < -180) {
      HA += 360;
    }

    if (HA > 180) {
      HA -= 360;
    }

    let alt_i = altitudeHilal(lat, topo.Dec, HA, elev, m.distance);

    data.push(alt_i);
    labels.push(i === 0 ? "Maghrib" : `+${i} menit`);
  }

  return { data, labels };
}

// ================= ANALISIS VISIBILITAS =================

function cekMABIMS(tinggi, elongasi, umur) {
  return tinggi >= 3 && elongasi >= 6.4 && umur >= 8
    ? "Memenuhi"
    : "Tidak Memenuhi";
}

function hitungSkor(tinggi, elongasi, arcv) {
  return tinggi * 0.4 + elongasi * 0.3 + arcv * 0.3;
}

function klasifikasiVisibilitas(score) {
  if (score < 4) return "Tidak Terlihat";
  if (score <= 6) return "Mungkin Terlihat";
  return "Terlihat";
}

function probabilitas(score) {
  return ((score / 10) * 100).toFixed(1) + "%";
}

// data rukyat sederhana
const dataRukyat = [
  { tanggal: "2026-03-19", lokasi: "Makassar", hasil: "Tidak Terlihat" },
];

function cekAkurasi(prediksi, tanggal) {
  let data = dataRukyat.find((d) => d.tanggal === tanggal);

  if (!data) return "Data tidak tersedia";

  return data.hasil === prediksi ? "AKURAT ✔" : "TIDAK AKURAT ❌";
}

// ================= HITUNG =================
function hitung() {
  let hasilAtas = document.getElementById("hasilAtas");
  let hasilBawah = document.getElementById("hasilBawah");
  let kriteria = document.getElementById("kriteria");

  // ================= INPUT =================
  let latVal = parseFloat(document.getElementById("lat").value);
  let elev = parseFloat(document.getElementById("elevasi").value) || 0;
  let lngVal = parseFloat(document.getElementById("lng").value);
  let tgl = document.getElementById("tanggal").value;

  if (isNaN(latVal) || isNaN(lngVal) || !tgl) {
    alert("Lengkapi input!");
    return;
  }

  // ================= WAKTU =================
  let date0 = new Date(tgl + "T12:00:00");
  let jd0 = julian(date0);
  let d0 = jd0 - 2451545;

  let s0 = sun(d0);

  let maghribJam = waktuMaghrib(latVal, s0.Dec, lngVal, elev, date0);

  let jam = Math.floor(maghribJam);

  let menitFloat = (maghribJam - jam) * 60;
  let menit = Math.floor(menitFloat);

  let detik = Math.floor((menitFloat - menit) * 60);

  let localDate = new Date(
    tgl +
      `T${jam.toString().padStart(2, "0")}:` +
      `${menit.toString().padStart(2, "0")}:` +
      `${detik.toString().padStart(2, "0")}`,
  );

  // otomatis zona waktu Indonesia berdasarkan longitude
  let zonaWaktu = 7; // default WIB

  if (lngVal >= 115 && lngVal < 130) {
    zonaWaktu = 8; // WITA
  } else if (lngVal >= 130) {
    zonaWaktu = 9; // WIT
  }

  // konversi lokal → UTC
  let utcDate = new Date(
    Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      localDate.getHours() - zonaWaktu,
      localDate.getMinutes(),
      localDate.getSeconds(),
    ),
  );

  // Julian UTC
  let jdUTC = julian(utcDate);

  // Delta T
  let jd = jdUTC + deltaT(localDate.getFullYear()) / 86400;

  // variabel astronomi
  let d = jd - 2451545;

  // umur bulan

  let dIjtima = ijtimaReal(d);
  let jdIjtima = dIjtima + 2451545;
  let tIjtima = jdToDate(jdIjtima);

  // umur bulan berdasarkan waktu lokal
  let umur = (localDate.getTime() - tIjtima.getTime()) / 3600000;

  // ================= POSISI PRESISI  =================

  // posisi matahari dan bulan
  let s = sun(d);
  let m = moon(d);

  // sidereal time stabil
  let LST = sidereal(jd, lngVal);

  // topocentric moon
  let topo = topocentricEquatorial(m, latVal, lngVal, jd);

  // hour angle topocentric
  let Htopo = LST - topo.RA;
  Htopo = ((Htopo + 540) % 360) - 180;

  // altitude super presisi
  let alt = altitudeHilal(latVal, topo.Dec, Htopo, elev, m.distance);

  // azimuth super presisi
  let azRel = rad2deg(
    Math.atan2(
      Math.sin(deg2rad(-Htopo)),
      Math.cos(deg2rad(Htopo)) * Math.sin(deg2rad(latVal)) -
        Math.tan(deg2rad(topo.Dec)) * Math.cos(deg2rad(latVal)),
    ),
  );

  azRel = norm(azRel);

  // elongasi super presisi
  let elong = elongasiAkurat(s, {
    lambda: m.lambda,
  });

  // ARCV super presisi
  let sunAlt = altitudeHilal(latVal, s.Dec, LST - s.RA, elev, 149600000);

  let arcv = alt - sunAlt;

  // ================= ANALISIS =================

  let statusM = cekMABIMS(alt, elong, umur);
  let skor = hitungSkor(alt, elong, arcv);
  let klas = klasifikasiVisibilitas(skor);
  let prob = probabilitas(skor);
  let akurasi = cekAkurasi(klas, tgl);

  document.getElementById("mabims").innerText = statusM;
  document.getElementById("skor").innerText = skor.toFixed(2);
  document.getElementById("klasifikasi").innerText = klas;
  document.getElementById("prob").innerText = prob;
  document.getElementById("akurasi").innerText = akurasi;
  let interpretasi = "";

  if (klas === "Tidak Terlihat") {
    interpretasi =
      "Hilal sangat sulit diamati, kemungkinan besar tidak terlihat.";
  } else if (klas === "Mungkin Terlihat") {
    interpretasi = "Hilal berada pada kondisi kritis (borderline).";
  } else {
    interpretasi = "Hilal berpotensi terlihat dengan alat optik.";
  }

  document.getElementById("interpretasi").innerText = interpretasi;

  let kesimpulan = "";

  if (statusM === "Tidak Memenuhi" && klas === "Tidak Terlihat") {
    kesimpulan =
      "Hasil konsisten: hilal tidak memenuhi kriteria dan tidak terlihat.";
  } else if (statusM === "Memenuhi" && klas === "Terlihat") {
    kesimpulan = "Hasil konsisten: hilal memenuhi kriteria dan terlihat.";
  } else {
    kesimpulan =
      "Terdapat perbedaan antara kriteria MABIMS dan model visibilitas.";
  }

  document.getElementById("kesimpulan").innerText = kesimpulan;

  // ================= KRITERIA =================
  let mabims = alt >= 3 && elong >= 6.4 && umur >= 8;
  let odeh = arcv > 5.65;
  let q = alt - (0.1018 * Math.pow(elong, 2) - 6.3226 * elong + 11.8371);
  let yallop = q > 0;
  let turki = alt >= 5 && elong >= 8;

  let bestTime = new Date(localDate.getTime() + 20 * 60000);

  let labelZona = zonaWaktu === 7 ? "WIB" : zonaWaktu === 8 ? "WITA" : "WIT";

  // ================= OUTPUT =================
  hasilAtas.innerHTML = `
        <div class="box">📅 Tanggal<br>${tgl}</div>
        <div class="box">🌇 Waktu Maghrib<br>${jam}:${menit.toString().padStart(2, "0")} ${labelZona}</div>
        <div class="box">🌙 Tinggi Hilal<br>${alt.toFixed(2)}°</div>
    `;

  hasilTengah.innerHTML = `
        <div class="box">🌗 Elongasi<br>${elong.toFixed(2)}°</div>
        <div class="box">🕒 Umur Bulan<br>${umur.toFixed(2)} jam</div>
        <div class="box">✨ ARCV<br>${arcv.toFixed(3)}°</div>
    `;

  hasilBawah.innerHTML = `
        <div class="box">⏱ Waktu Terbaik<br>${bestTime.getHours().toString().padStart(2, "0")}:${bestTime.getMinutes().toString().padStart(2, "0")}</div>
        <div class="box">🧭 Azimuth Hilal<br>${azRel.toFixed(2)}°</div>
        <div class="box">🌑 Ijtima<br>${tIjtima.toLocaleString()}</div>
    `;

  // ================= GRAFIK =================
  if (chart) chart.destroy();

  let grafik = hitungGrafikReal(jd, latVal, lngVal, elev);

  //  buat chart
  chart = new Chart(document.getElementById("chart"), {
    type: "line",
    data: {
      labels: grafik.labels,
      datasets: [
        {
          label: "Ketinggian Hilal (°)",
          data: grafik.data,
          tension: 0.4,
        },
      ],
    },
  });

  // ================= KRITERIA ================= //
  kriteria.innerHTML = `
<div class="kcard">
    <h4>MABIMS ${badge(mabims)}</h4>
    <ul>
        <li>Tinggi ≥ 3°</li>
        <li>Elongasi ≥ 6.4°</li>
        <li>Umur ≥ 8 jam</li>
    </ul>
</div>

<div class="kcard">
    <h4>Odeh ${badge(odeh)}</h4>
    <ul>
        <li>ARCV > 5.65°</li>
    </ul>
</div>

<div class="kcard">
    <h4>Yallop ${badge(yallop)}</h4>
    <ul>
        <li>q-value > 0</li>
    </ul>
</div>

<div class="kcard">
    <h4>Turki ${badge(turki)}</h4>
    <ul>
        <li>Tinggi ≥ 5°</li>
        <li>Elongasi ≥ 8°</li>
    </ul>
</div>
    `;
}
