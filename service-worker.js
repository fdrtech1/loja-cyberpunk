/* =========================================================
   Service Worker — deixa o cardápio funcionando offline.

   IMPORTANTE: sempre que você editar qualquer arquivo do app
   (produtos, preços, chave Pix...), mude a VERSAO abaixo
   (ex.: "v2", "v3"...). Assim o celular dos clientes baixa a
   versão nova em vez de ficar com a antiga guardada.
   ========================================================= */
const VERSAO = "loja-cyber-v1";
const CACHE_FONTES = "loja-cyber-fontes";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./products.js",
  "./qrcode.js",
  "./manifest.json",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO && n !== CACHE_FONTES).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Busca na rede com limite de tempo (para não travar em internet ruim)
function redeComLimite(req, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("tempo esgotado")), ms);
    fetch(req).then((r) => { clearTimeout(t); resolve(r); }, (e) => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Página: tenta a rede primeiro (pega atualizações), senão usa a cópia salva
  if (req.mode === "navigate" && url.origin === location.origin) {
    evento.respondWith(
      redeComLimite(req, 4000)
        .then((res) => {
          const copia = res.clone();
          caches.open(VERSAO).then((c) => c.put("./index.html", copia));
          return res;
        })
        .catch(() => caches.match("./index.html", { ignoreSearch: true }).then((r) => r || caches.match("./")))
    );
    return;
  }

  // Arquivos do app e fontes do Google: responde da cópia salva e atualiza por trás
  const ehFonte = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin === location.origin || ehFonte) {
    const nomeCache = ehFonte ? CACHE_FONTES : VERSAO;
    evento.respondWith(
      caches.open(nomeCache).then(async (cache) => {
        const salvo = await cache.match(req, { ignoreSearch: !ehFonte });
        const rede = fetch(req)
          .then((res) => {
            if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
            return res;
          })
          .catch(() => null);
        if (salvo) {
          evento.waitUntil(rede);
          return salvo;
        }
        const res = await rede;
        return res || Response.error();
      })
    );
  }
  // Outros endereços (WhatsApp, links de pagamento, mapas): vão direto para a internet.
});
