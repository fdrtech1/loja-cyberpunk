/* =========================================================
   Gerador de QR Code em JavaScript puro (sem bibliotecas).
   Baseado no algoritmo público de Project Nayuki (licença MIT).
   Modo byte, correção de erro nível M, versão automática.
   Uso: QRCodigo.svg("texto")  → string <svg>
   Você não precisa editar este arquivo.
   ========================================================= */
(function (global) {
  "use strict";

  // Tabelas oficiais (índice: 0 = L, 1 = M, 2 = Q, 3 = H) × versão 1..40
  const ECC_POR_BLOCO = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  ];
  const NUM_BLOCOS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
  ];
  const NIVEL = 1;          // M
  const BITS_FORMATO = 0;   // bits de formato do nível M

  const bit = (x, i) => ((x >>> i) & 1) !== 0;

  function modulosBrutos(ver) {
    let r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const n = Math.floor(ver / 7) + 2;
      r -= (25 * n - 10) * n - 55;
      if (ver >= 7) r -= 36;
    }
    return r;
  }
  function codewordsDados(ver) {
    return Math.floor(modulosBrutos(ver) / 8) - ECC_POR_BLOCO[NIVEL][ver] * NUM_BLOCOS[NIVEL][ver];
  }

  // ---- Reed-Solomon (GF(2^8), polinômio 0x11D) ----
  function rsMult(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z & 0xff;
  }
  function rsDivisor(grau) {
    const r = new Array(grau).fill(0);
    r[grau - 1] = 1;
    let raiz = 1;
    for (let i = 0; i < grau; i++) {
      for (let j = 0; j < r.length; j++) {
        r[j] = rsMult(r[j], raiz);
        if (j + 1 < r.length) r[j] ^= r[j + 1];
      }
      raiz = rsMult(raiz, 0x02);
    }
    return r;
  }
  function rsResto(dados, divisor) {
    const r = divisor.map(() => 0);
    for (const b of dados) {
      const fator = b ^ r.shift();
      r.push(0);
      divisor.forEach((c, i) => { r[i] ^= rsMult(c, fator); });
    }
    return r;
  }

  function adicionarEcc(dados, ver) {
    const nBlocos = NUM_BLOCOS[NIVEL][ver];
    const eccLen = ECC_POR_BLOCO[NIVEL][ver];
    const total = Math.floor(modulosBrutos(ver) / 8);
    const nCurtos = nBlocos - (total % nBlocos);
    const lenCurto = Math.floor(total / nBlocos);
    const div = rsDivisor(eccLen);
    const blocos = [];
    for (let i = 0, k = 0; i < nBlocos; i++) {
      const dat = dados.slice(k, k + lenCurto - eccLen + (i < nCurtos ? 0 : 1));
      k += dat.length;
      const ecc = rsResto(dat, div);
      if (i < nCurtos) dat.push(0);
      blocos.push(dat.concat(ecc));
    }
    const res = [];
    for (let i = 0; i < blocos[0].length; i++) {
      blocos.forEach((b, j) => {
        if (i !== lenCurto - eccLen || j >= nCurtos) res.push(b[i]);
      });
    }
    return res;
  }

  function codificar(texto) {
    const bytes = Array.from(new TextEncoder().encode(texto));
    let ver = 1;
    for (; ver <= 40; ver++) {
      const ccBits = ver < 10 ? 8 : 16;
      if (4 + ccBits + bytes.length * 8 <= codewordsDados(ver) * 8) break;
    }
    if (ver > 40) throw new Error("Texto grande demais para QR Code");

    // Monta o fluxo de bits
    const bits = [];
    const add = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    add(0x4, 4);
    add(bytes.length, ver < 10 ? 8 : 16);
    bytes.forEach((b) => add(b, 8));
    const cap = codewordsDados(ver) * 8;
    add(0, Math.min(4, cap - bits.length));
    add(0, (8 - (bits.length % 8)) % 8);
    for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) add(pad, 8);
    const dados = [];
    for (let i = 0; i < bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      dados.push(b);
    }
    const codewords = adicionarEcc(dados, ver);

    // Matriz
    const tam = ver * 4 + 17;
    const mod = Array.from({ length: tam }, () => new Array(tam).fill(false));
    const fun = Array.from({ length: tam }, () => new Array(tam).fill(false));
    const setF = (x, y, v) => { mod[y][x] = v; fun[y][x] = true; };

    // Padrões de temporização
    for (let i = 0; i < tam; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    // Padrões localizadores
    const finder = (x, y) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && xx < tam && yy >= 0 && yy < tam) setF(xx, yy, d !== 2 && d !== 4);
      }
    };
    finder(3, 3); finder(tam - 4, 3); finder(3, tam - 4);
    // Padrões de alinhamento
    if (ver > 1) {
      const n = Math.floor(ver / 7) + 2;
      const passo = Math.floor((ver * 8 + n * 3 + 5) / (n * 4 - 4)) * 2;
      const pos = [6];
      for (let p = tam - 7; pos.length < n; p -= passo) pos.splice(1, 0, p);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
          setF(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    // Bits de formato
    const formato = (mascara) => {
      const d = (BITS_FORMATO << 3) | mascara;
      let r = d;
      for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412;
      for (let i = 0; i <= 5; i++) setF(8, i, bit(b, i));
      setF(8, 7, bit(b, 6)); setF(8, 8, bit(b, 7)); setF(7, 8, bit(b, 8));
      for (let i = 9; i < 15; i++) setF(14 - i, 8, bit(b, i));
      for (let i = 0; i < 8; i++) setF(tam - 1 - i, 8, bit(b, i));
      for (let i = 8; i < 15; i++) setF(8, tam - 15 + i, bit(b, i));
      setF(8, tam - 8, true);
    };
    formato(0);
    // Bits de versão
    if (ver >= 7) {
      let r = ver;
      for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
      const b = (ver << 12) | r;
      for (let i = 0; i < 18; i++) {
        const c = bit(b, i), a = tam - 11 + (i % 3), q = Math.floor(i / 3);
        setF(a, q, c); setF(q, a, c);
      }
    }
    // Dados em zigue-zague
    let i = 0;
    for (let dir = tam - 1; dir >= 1; dir -= 2) {
      if (dir === 6) dir = 5;
      for (let v = 0; v < tam; v++) for (let j = 0; j < 2; j++) {
        const x = dir - j;
        const subindo = ((dir + 1) & 2) === 0;
        const y = subindo ? tam - 1 - v : v;
        if (!fun[y][x] && i < codewords.length * 8) {
          mod[y][x] = bit(codewords[i >>> 3], 7 - (i & 7));
          i++;
        }
      }
    }
    // Máscaras
    const aplicar = (m) => {
      for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) {
        let inv;
        switch (m) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: inv = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: inv = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
        }
        if (!fun[y][x] && inv) mod[y][x] = !mod[y][x];
      }
    };
    const penalidade = () => {
      let p = 0, escuros = 0;
      const linhas = [];
      for (let y = 0; y < tam; y++) {
        let l = "", c = "";
        for (let x = 0; x < tam; x++) { l += mod[y][x] ? "1" : "0"; c += mod[x][y] ? "1" : "0"; if (mod[y][x]) escuros++; }
        linhas.push(l, c);
      }
      for (const s of linhas) {
        s.replace(/0{5,}|1{5,}/g, (m) => { p += m.length - 2; return m; });
        const s2 = "0000" + s + "0000";
        p += (s2.match(/(?=10111010000|00001011101)/g) || []).length * 40;
      }
      for (let y = 0; y < tam - 1; y++) for (let x = 0; x < tam - 1; x++) {
        const c = mod[y][x];
        if (c === mod[y][x + 1] && c === mod[y + 1][x] && c === mod[y + 1][x + 1]) p += 3;
      }
      const total = tam * tam;
      const k = Math.ceil(Math.abs(escuros * 20 - total * 10) / total) - 1;
      return p + Math.max(0, k) * 10;
    };
    let melhor = 0, menor = Infinity;
    for (let m = 0; m < 8; m++) {
      aplicar(m); formato(m);
      const p = penalidade();
      if (p < menor) { menor = p; melhor = m; }
      aplicar(m);
    }
    aplicar(melhor); formato(melhor);
    return { tamanho: tam, modulos: mod, versao: ver, mascara: melhor };
  }

  function svg(texto, opcoes = {}) {
    const borda = opcoes.borda ?? 4;
    const cor = opcoes.cor || "#1e2a1b";
    const fundo = opcoes.fundo || "#ffffff";
    const { tamanho, modulos } = codificar(texto);
    const lado = tamanho + borda * 2;
    let d = "";
    for (let y = 0; y < tamanho; y++) for (let x = 0; x < tamanho; x++)
      if (modulos[y][x]) d += `M${x + borda},${y + borda}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges" role="img" aria-label="QR Code Pix"><rect width="100%" height="100%" fill="${fundo}"/><path d="${d}" fill="${cor}"/></svg>`;
  }

  global.QRCodigo = { codificar, svg };
})(typeof window !== "undefined" ? window : globalThis);
