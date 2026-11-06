/* =========================================================
   LOJA CYBERPUNK — app.js
   =========================================================

   ╔═══════════════════════════════════════════════════════╗
   ║  CONFIGURAÇÃO — edite só esta parte                    ║
   ╚═══════════════════════════════════════════════════════╝ */

// Chave Pix que vai receber os pagamentos. Pode ser:
//   e-mail ........ "loja@exemplo.com"
//   celular ....... "+5511999999999"   (com +55 e DDD, só números)
//   CPF/CNPJ ...... "12345678900"      (só números)
//   aleatória ..... "123e4567-e12b-12d1-a456-426655440000"
const CHAVE_PIX = "+5533991423328";

// Nome de quem recebe o Pix (aparece no app do banco do cliente).
// Sem acentos, até 25 letras. Use o mesmo nome da conta.
const NOME_RECEBEDOR = "FERNANDO DANIEL";

// Cidade de quem recebe o Pix. Sem acentos, até 15 letras.
const CIDADE = "CAPELINHA";

// Link de pagamento com cartão (Mercado Pago, InfinitePay, PagSeguro...).
// Deixe "" (vazio) para esconder a opção de cartão.
const LINK_CARTAO = "https://link.mercadopago.com.br/ervcap";

// Pedido mínimo para pagar com cartão, em reais.
const MINIMO_CARTAO = 100.0;

// Link de pagamento com criptomoeda (NOWPayments, Binance Pay...).
// Deixe "" (vazio) para esconder a opção de cripto.
const LINK_CRIPTO = "";

// WhatsApp que recebe os pedidos: 55 + DDD + número, só números.
// Ex.: (11) 91234-5678  →  "5511912345678"
const WHATSAPP_VENDEDOR = "5511912130716";

// Taxa fixa de entrega, em reais (use ponto: 20.0 = R$ 20,00).
const TAXA_ENTREGA = 20.0;

// Valor mínimo e máximo do pedido (soma dos produtos, sem a entrega).
const PEDIDO_MINIMO = 100.0;
const PEDIDO_MAXIMO = 1000.0;

// Endereço para retirada no local (aparece para o cliente).
// Deixe "" (vazio) para combinar o endereço pelo WhatsApp.
const ENDERECO_RETIRADA = "Beco 260, Capelinha";

// Pede para o cliente confirmar que tem 18 anos ou mais ao abrir o app.
// (Venda de produtos de tabacaria para menores de 18 é proibida por lei.)
const CONFIRMAR_IDADE = true;

// Horário de funcionamento para retirada (formato 24h "HH:MM").
const HORA_ABERTURA = "15:00";
const HORA_FECHAMENTO = "20:00";

// Dias em que há retirada: 0 = domingo, 1 = segunda ... 6 = sábado.
const DIAS_FUNCIONAMENTO = [1, 2, 3, 4, 5, 6];

// Quantos minutos leva para o pedido ficar pronto.
const TEMPO_PREPARO_MINUTOS = 40;

// De quantos em quantos minutos aparecem os horários de retirada.
const INTERVALO_HORARIOS_MINUTOS = 15;

/* ╔═══════════════════════════════════════════════════════╗
   ║  FIM DA CONFIGURAÇÃO — daqui para baixo é o app        ║
   ╚═══════════════════════════════════════════════════════╝ */

const ROTAS = ["inicio", "carrinho", "entrega", "dados", "pagamento", "confirmacao"];
const MOEDA = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const estado = {
  carrinho: {},        // { idProduto: quantidade }
  modo: null,          // "retirada" | "entrega"
  horario: null,       // ISO da retirada
  endereco: "",
  localizacao: null,   // { lat, lng, precisao } — só em memória, nunca salvo
  nome: "",
  telefone: "",
  pagamento: null,     // "pix" | "cartao" | "cripto"
  numero: null,        // número do pedido
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const brl = (v) => MOEDA.format(v);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- Armazenamento local (só carrinho e dados do cliente) ---------- */
const CHAVE_LS = "loja-cyber-v1";
function salvar() {
  try {
    localStorage.setItem(CHAVE_LS, JSON.stringify({ carrinho: estado.carrinho, nome: estado.nome, telefone: estado.telefone }));
  } catch (e) { /* navegação privada: segue sem salvar */ }
}
function carregar() {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE_LS) || "{}");
    if (d.carrinho && typeof d.carrinho === "object") {
      for (const [id, q] of Object.entries(d.carrinho)) if (produto(id) && q > 0) estado.carrinho[id] = Math.min(99, q | 0);
    }
    estado.nome = d.nome || "";
    estado.telefone = d.telefone || "";
  } catch (e) { /* ignora */ }
}

/* ---------- Ilustrações SVG (paleta neon: ciano, amarelo, magenta sobre preto) ---------- */
const VERDE = "#00f0ff", OURO = "#fcee0a", VERM = "#ff2bd6", PRETO = "#07060d", CREME = "#eafcff";
const ILUSTRACOES = {
  combo: `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="70" y="18" width="18" height="40" rx="5" fill="${VERM}"/><rect x="70" y="30" width="18" height="10" fill="${OURO}"/><g transform="rotate(-14 46 40)"><rect x="32" y="14" width="30" height="16" fill="${CREME}"/><rect x="28" y="24" width="38" height="30" rx="4" fill="${VERDE}"/><rect x="28" y="24" width="38" height="9" rx="4" fill="${OURO}"/></g><path d="M18 52h84l-6 44a6 6 0 0 1-6 5H30a6 6 0 0 1-6-5z" fill="${OURO}"/><path d="M18 52h84v10H18z" fill="${PRETO}"/><path d="M22 66l38 30 38-30M22 96l38-30 38 30" stroke="${VERDE}" stroke-width="6" fill="none"/><path d="M18 52l42 0" stroke="${VERM}" stroke-width="3"/></svg>`,
  seda: `<svg viewBox="0 0 120 120" aria-hidden="true"><g transform="rotate(-12 60 60)"><rect x="36" y="18" width="48" height="28" rx="2" fill="${CREME}"/><path d="M40 26h40M40 33h40" stroke="#c9bf9c" stroke-width="2"/><rect x="28" y="36" width="64" height="54" rx="7" fill="${VERDE}"/><rect x="28" y="36" width="64" height="15" rx="7" fill="${OURO}"/><rect x="28" y="44" width="64" height="7" fill="${OURO}"/><path d="M40 66h40M40 77h26" stroke="${PRETO}" stroke-width="6" stroke-linecap="round"/></g></svg>`,
  tabaco: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M40 34c3-9 8-9 10 0M56 30c3-10 9-10 11 0M72 34c3-8 7-8 9 0" stroke="#c88a4a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M28 40q32-14 64 0l6 48q-38 14-76 0z" fill="#7a4b22"/><path d="M28 40q32-14 64 0" stroke="${OURO}" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="40" y="56" width="40" height="22" rx="5" fill="${OURO}"/><path d="M48 67h24" stroke="${PRETO}" stroke-width="5" stroke-linecap="round"/><path d="M26 82q34 12 70 0" stroke="${VERDE}" stroke-width="5" fill="none"/></svg>`,
  piteira: `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="16" y="36" width="44" height="58" rx="5" fill="${VERM}"/><rect x="16" y="36" width="44" height="14" rx="5" fill="${OURO}"/><rect x="16" y="44" width="44" height="6" fill="${OURO}"/><path d="M26 64h24M26 74h16" stroke="${CREME}" stroke-width="5" stroke-linecap="round"/><rect x="68" y="28" width="16" height="56" rx="8" fill="${CREME}" stroke="${PRETO}" stroke-width="2"/><rect x="88" y="38" width="16" height="56" rx="8" fill="#bfe9cf" stroke="${PRETO}" stroke-width="2"/><path d="M76 36v40M96 46v40" stroke="#9c9478" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
  dichavador: `<svg viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="86" rx="34" ry="11" fill="#5e5e5e"/><rect x="26" y="40" width="68" height="46" fill="#9a9a9a"/><rect x="26" y="54" width="68" height="7" fill="${VERDE}"/><rect x="26" y="63" width="68" height="7" fill="${OURO}"/><rect x="26" y="72" width="68" height="7" fill="${VERM}"/><ellipse cx="60" cy="40" rx="34" ry="11" fill="#d7d7d7"/><ellipse cx="60" cy="40" rx="22" ry="6" fill="#bdbdbd"/><path d="M34 44v4M42 46v5M52 47v5M62 47v5M72 46v5M82 44v5" stroke="#7a7a7a" stroke-width="2"/></svg>`,
  isqueiro: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M56 32c-8-9 2-16 4-26 5 9 12 14 5 26z" fill="${OURO}"/><path d="M58 30c-2-4 1-8 2-11 2 4 5 7 1 11z" fill="#ff8a00"/><rect x="44" y="30" width="32" height="16" rx="3" fill="#c9c9c9"/><circle cx="71" cy="38" r="5" fill="#7a7a7a"/><rect x="42" y="44" width="36" height="62" rx="9" fill="${VERM}"/><rect x="42" y="66" width="36" height="9" fill="${OURO}"/><rect x="42" y="75" width="36" height="9" fill="${VERDE}"/></svg>`,
  bandeja: `<svg viewBox="0 0 120 120" aria-hidden="true"><g transform="rotate(-10 60 60)"><rect x="14" y="30" width="92" height="62" rx="12" fill="${OURO}"/><rect x="22" y="38" width="76" height="46" rx="7" fill="${PRETO}"/><path d="M22 38l76 46M98 38L22 84" stroke="${OURO}" stroke-width="7"/><path d="M22 38l38 23 38-23zM22 84l38-23 38 23z" fill="${VERDE}"/><path d="M22 38l76 46M98 38L22 84" stroke="${OURO}" stroke-width="7"/></g></svg>`,
  salgadinho: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M32 18h56l-4 8 6 66-4 8H34l-4-8 6-66z" fill="${VERM}"/><path d="M32 18l5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5M30 100l5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5" stroke="${PRETO}" stroke-width="2" fill="none"/><circle cx="60" cy="60" r="20" fill="${OURO}"/><path d="M50 66l10-17 10 17z" fill="#e08a00" stroke="${PRETO}" stroke-width="1.5"/><path d="M40 36h40" stroke="${CREME}" stroke-width="5" stroke-linecap="round"/></svg>`,
  chocolate: `<svg viewBox="0 0 120 120" aria-hidden="true"><g transform="rotate(-12 60 60)"><rect x="32" y="16" width="56" height="88" rx="5" fill="#5a3418"/><path d="M32 38h56M32 60h56M60 16v44" stroke="#3b2210" stroke-width="3"/><rect x="28" y="62" width="64" height="46" rx="4" fill="${VERDE}"/><path d="M28 62l6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6 6 6 6-6" stroke="${VERDE}" stroke-width="3" fill="none"/><rect x="28" y="76" width="64" height="12" fill="${OURO}"/><path d="M40 82h40" stroke="${PRETO}" stroke-width="4" stroke-linecap="round"/></g></svg>`,
  refri: `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M40 28h40l-2 6v62l2 6H40l2-6V34z" fill="${VERM}"/><ellipse cx="60" cy="27" rx="20" ry="5" fill="#d7d7d7"/><ellipse cx="60" cy="27" rx="7" ry="2" fill="#8a8a8a"/><rect x="42" y="52" width="36" height="22" fill="${OURO}"/><path d="M42 63h36" stroke="${VERDE}" stroke-width="6"/><circle cx="50" cy="86" r="3" fill="${CREME}"/><circle cx="58" cy="92" r="2" fill="${CREME}"/><circle cx="68" cy="84" r="2.5" fill="${CREME}"/><path d="M84 20c6 4 6 10 0 14M92 16c9 6 9 16 0 22" stroke="#7fd6ff" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  cigarro: `<svg viewBox="0 0 120 120" aria-hidden="true"><g transform="rotate(-8 60 60)"><rect x="44" y="14" width="10" height="30" fill="${CREME}"/><rect x="44" y="14" width="10" height="9" fill="#d98c3a"/><rect x="57" y="10" width="10" height="34" fill="${CREME}"/><rect x="57" y="10" width="10" height="9" fill="#d98c3a"/><rect x="70" y="16" width="10" height="28" fill="${CREME}"/><rect x="70" y="16" width="10" height="9" fill="#d98c3a"/><rect x="32" y="34" width="56" height="74" rx="5" fill="${VERM}"/><path d="M32 34h56l-6 14H38z" fill="${PRETO}" opacity=".35"/><rect x="32" y="58" width="56" height="10" fill="${OURO}"/><rect x="32" y="68" width="56" height="10" fill="${VERDE}"/><rect x="40" y="86" width="40" height="14" rx="3" fill="${CREME}"/></g></svg>`,
  cookie: `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="48" cy="70" r="30" fill="#c98a44"/><circle cx="80" cy="46" r="24" fill="#dba05a"/><g fill="#3b2210"><circle cx="38" cy="62" r="4"/><circle cx="54" cy="78" r="4.5"/><circle cx="44" cy="86" r="3"/><circle cx="60" cy="60" r="3.5"/><circle cx="74" cy="40" r="3.5"/><circle cx="88" cy="50" r="4"/><circle cx="80" cy="58" r="3"/></g><path d="M22 100h76" stroke="${OURO}" stroke-width="5" stroke-linecap="round"/></svg>`,
  bala: `<svg viewBox="0 0 120 120" aria-hidden="true"><g transform="rotate(-20 48 50)"><path d="M26 50L10 38v24zM70 50l16-12v24z" fill="${OURO}"/><ellipse cx="48" cy="50" rx="24" ry="16" fill="${VERDE}"/><path d="M38 38c-4 8-4 16 0 24M52 36c-4 9-4 19 0 28" stroke="${CREME}" stroke-width="3" fill="none" opacity=".7"/></g><g transform="rotate(16 74 80)"><path d="M52 80L38 70v20zM96 80l14-10v20z" fill="${VERDE}"/><ellipse cx="74" cy="80" rx="22" ry="15" fill="${VERM}"/><path d="M66 69c-4 7-4 15 0 22M78 67c-4 8-4 18 0 26" stroke="${CREME}" stroke-width="3" fill="none" opacity=".7"/></g></svg>`,
};
// Estilhaço neon (usado na "chuva" do fundo e no confete ao finalizar)
const folhaSVG = (cor) => `<svg viewBox="0 0 24 24" aria-hidden="true" style="filter:drop-shadow(0 0 4px ${cor})"><path d="M12 1l5 9-5 13-5-13z" fill="${cor}"/><path d="M12 1v22" stroke="rgba(255,255,255,.55)" stroke-width="1"/></svg>`;
const CORES_RASTA = [VERDE, OURO, VERM, "#8a5cff", "#39ff14"];

// Bebidas: latas, latas altas (energético) e garrafas, cada uma com suas cores.
const lata = (corpo, faixa) => `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M40 28h40l-2 6v62l2 6H40l2-6V34z" fill="${corpo}" stroke="#6b6b6b" stroke-width="2"/><ellipse cx="60" cy="27" rx="20" ry="5" fill="#d7d7d7"/><ellipse cx="60" cy="27" rx="7" ry="2" fill="#8a8a8a"/><path d="M42 58c10-8 26 8 36 0v12c-10 8-26-8-36 0z" fill="${faixa}"/><circle cx="50" cy="86" r="3" fill="${CREME}" opacity=".8"/><circle cx="58" cy="92" r="2" fill="${CREME}" opacity=".8"/><circle cx="68" cy="84" r="2.5" fill="${CREME}" opacity=".8"/></svg>`;
const lataAlta = (corpo, raio) => `<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M44 16h32l-2 6v80l2 6H44l2-6V22z" fill="${corpo}" stroke="#6b6b6b" stroke-width="2"/><ellipse cx="60" cy="15" rx="16" ry="4" fill="#d7d7d7"/><path d="M66 36L50 62h11l-7 24 18-30H60z" fill="${raio}"/><rect x="46" y="92" width="28" height="6" fill="${raio}"/></svg>`;
const garrafa = (liquido, rotulo) => `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="52" y="8" width="16" height="9" rx="2" fill="${rotulo}"/><path d="M52 17h16v9l9 13v62a6 6 0 0 1-6 6H49a6 6 0 0 1-6-6V39l9-13z" fill="${liquido}" stroke="#6b6b6b" stroke-width="2"/><rect x="43" y="56" width="34" height="24" fill="${rotulo}"/><path d="M49 34l-3 7" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/></svg>`;
Object.assign(ILUSTRACOES, {
  "lata-vermelha": lata(VERM, CREME),
  "lata-preta": lata("#1a1a1a", VERM),
  "lata-laranja": lata("#ff8a00", "#1f4fbf"),
  "lata-uva": lata("#6a2c91", "#ff8a00"),
  "lata-verde": lata("#0a7a2f", VERM),
  "energetico-preto": lataAlta("#1a1a1a", "#7ac142"),
  "energetico-azul": lataAlta("#1e88e5", OURO),
  "energetico-branco": lataAlta("#eeeeee", "#5f6b73"),
  "energetico-rosa": lataAlta("#e64a8a", OURO),
  "garrafa-agua": garrafa("#bfe7ff", "#1e88e5"),
  "garrafa-cola": garrafa("#3b1d0e", VERM),
  "garrafa-laranja": garrafa("#ff8a00", "#1f4fbf"),
});

/* ---------- Cálculos ---------- */
const produto = (id) => PRODUTOS.find((p) => p.id === id);
const qtd = (id) => estado.carrinho[id] || 0;
const totalItens = () => Object.values(estado.carrinho).reduce((a, b) => a + b, 0);
const subtotal = () => Object.entries(estado.carrinho).reduce((s, [id, q]) => s + (produto(id)?.preco || 0) * q, 0);
const taxa = () => (estado.modo === "entrega" ? TAXA_ENTREGA : 0);
const total = () => Math.round((subtotal() + taxa()) * 100) / 100;
const faixaOk = () => subtotal() >= PEDIDO_MINIMO && subtotal() <= PEDIDO_MAXIMO;
const entregaOk = () =>
  (estado.modo === "retirada" && !!estado.horario) ||
  (estado.modo === "entrega" && (!!estado.localizacao || estado.endereco.trim().length >= 5));
const digitosTel = () => estado.telefone.replace(/\D/g, "");
const dadosOk = () => estado.nome.trim().length >= 2 && digitosTel().length >= 10 && digitosTel().length <= 11;
const cartaoDisponivel = () => !!LINK_CARTAO && total() >= MINIMO_CARTAO;
const pagamentoOk = () =>
  estado.pagamento === "pix" ||
  (estado.pagamento === "cartao" && cartaoDisponivel()) ||
  (estado.pagamento === "cripto" && !!LINK_CRIPTO);

function mensagemFaixa() {
  const s = subtotal();
  if (totalItens() === 0) return { ok: false, texto: `Adicione produtos. Pedido mínimo: ${brl(PEDIDO_MINIMO)}.` };
  if (s < PEDIDO_MINIMO) return { ok: false, texto: `Faltam ${brl(PEDIDO_MINIMO - s)} para o pedido mínimo de ${brl(PEDIDO_MINIMO)}.` };
  if (s > PEDIDO_MAXIMO) return { ok: false, texto: `Seu pedido passou do máximo de ${brl(PEDIDO_MAXIMO)}. Remova ${brl(s - PEDIDO_MAXIMO)} em produtos para continuar.` };
  return { ok: true, texto: "Tudo certo! Seu pedido está dentro do valor permitido." };
}

/* ---------- Pix (BR Code / EMV do Banco Central) ---------- */
function campoEMV(id, valor) {
  const v = String(valor);
  return id + String(v.length).padStart(2, "0") + v;
}
function limparTexto(s, max) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, "").trim().toUpperCase().slice(0, max);
}
function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}
function gerarPix(valor, txid) {
  let chave = CHAVE_PIX.trim();
  if (chave.includes("@")) chave = chave.toLowerCase();
  const conta = campoEMV("00", "br.gov.bcb.pix") + campoEMV("01", chave);
  let p =
    campoEMV("00", "01") +
    campoEMV("26", conta) +
    campoEMV("52", "0000") +
    campoEMV("53", "986") +
    (valor > 0 ? campoEMV("54", valor.toFixed(2)) : "") +
    campoEMV("58", "BR") +
    campoEMV("59", limparTexto(NOME_RECEBEDOR, 25) || "RECEBEDOR") +
    campoEMV("60", limparTexto(CIDADE, 15) || "BRASIL") +
    campoEMV("62", campoEMV("05", (txid || "***").replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***")) +
    "6304";
  return p + crc16(p);
}

/* ---------- Animações ---------- */
function animarValor(el, valor) {
  if (!el) return;
  const de = typeof el._valor === "number" ? el._valor : valor;
  el._valor = valor;
  cancelAnimationFrame(el._raf);
  if (reduzMovimento || de === valor) { el.textContent = brl(valor); return; }
  const ini = performance.now(), dur = 550;
  const passo = (t) => {
    const p = Math.min(1, (t - ini) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = brl(de + (valor - de) * e);
    if (p < 1) el._raf = requestAnimationFrame(passo);
  };
  el._raf = requestAnimationFrame(passo);
  el.classList.remove("piscar"); void el.offsetWidth; el.classList.add("piscar");
}
function pulsarCarrinho() {
  const b = $("#btn-carrinho");
  b.classList.remove("pulsar"); void b.offsetWidth; b.classList.add("pulsar");
}
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("visivel");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("visivel"), 2400);
}
function criarFolhasFundo() {
  if (reduzMovimento) return;
  const box = $("#folhas-fundo");
  const cores = CORES_RASTA;
  const n = window.innerWidth < 600 ? 14 : 22;
  for (let i = 0; i < n; i++) {
    const f = document.createElement("span");
    f.className = "folha-cai";
    const tam = 16 + Math.random() * 22;
    f.style.cssText = `left:${Math.random() * 100}%;width:${tam}px;height:${tam}px;--dur:${9 + Math.random() * 10}s;--delay:${-Math.random() * 18}s;--deriva:${(Math.random() * 160 - 80).toFixed(0)}px;--giro:${(Math.random() * 540 - 270).toFixed(0)}deg;opacity:${(0.45 + Math.random() * 0.4).toFixed(2)}`;
    f.innerHTML = folhaSVG(cores[i % cores.length]);
    box.appendChild(f);
  }
}
function confete() {
  if (reduzMovimento || !Element.prototype.animate) return;
  const box = $("#confete");
  const cores = CORES_RASTA;
  const x0 = window.innerWidth / 2, y0 = window.innerHeight * 0.32;
  for (let i = 0; i < 46; i++) {
    const f = document.createElement("span");
    f.className = "folha-confete";
    const tam = 14 + Math.random() * 16;
    f.style.cssText = `left:${x0}px;top:${y0}px;width:${tam}px;height:${tam}px`;
    f.innerHTML = folhaSVG(cores[i % cores.length]);
    box.appendChild(f);
    const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 220;
    const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist * 0.8 - 90;
    const giro = Math.random() * 900 - 450;
    const a = f.animate(
      [
        { transform: "translate(-50%,-50%) scale(.2) rotate(0deg)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${giro / 2}deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(calc(-50% + ${dx * 1.3}px), calc(-50% + ${dy + window.innerHeight * 0.6}px)) scale(.9) rotate(${giro}deg)`, opacity: 0 },
      ],
      { duration: 1900 + Math.random() * 1100, easing: "cubic-bezier(.15,.7,.4,1)", delay: Math.random() * 120 }
    );
    a.onfinish = () => f.remove();
  }
}

/* ---------- Produtos (tela inicial) ---------- */
function controleQtd(p) {
  const q = qtd(p.id);
  if (q === 0) return `<button type="button" class="btn btn-primario btn-add" data-add="${p.id}">${iconeMais} Adicionar</button>`;
  return `<div class="qtd" role="group" aria-label="Quantidade de ${esc(p.nome)}">
      <button type="button" class="qtd-btn" data-menos="${p.id}" aria-label="Diminuir ${esc(p.nome)}">−</button>
      <output class="qtd-num" aria-live="polite">${q}</output>
      <button type="button" class="qtd-btn" data-mais="${p.id}" aria-label="Aumentar ${esc(p.nome)}">+</button>
    </div>`;
}
const iconeMais = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;

const ilustracao = (p) => ILUSTRACOES[p.icone] || ILUSTRACOES.combo;

// Combos: transforma cada item em { qtd, nome, preco } (puxando do produto
// avulso quando o item tem "id") e, se preco for "soma", calcula o preço.
function montarCombos() {
  for (const p of PRODUTOS) {
    if (!Array.isArray(p.itens)) p.itens = [];
    p.itensCalc = p.itens.map((it) => {
      if (typeof it === "string") return { qtd: 0, nome: it, preco: 0, texto: true };
      const base = it.id ? PRODUTOS.find((x) => x.id === it.id) : null;
      const qtd = Math.max(1, Number(it.qtd) || 1);
      const preco = Number(it.preco ?? (base && typeof base.preco === "number" ? base.preco : 0)) || 0;
      return { qtd, nome: it.nome || (base ? base.nome : it.id || "Item"), preco };
    });
    if (p.preco === "soma") {
      p.preco = Math.round(p.itensCalc.reduce((s, it) => s + it.qtd * it.preco, 0) * 100) / 100;
    }
    p.preco = Number(p.preco) || 0;
  }
}

function listaItens(p) {
  if (!p.itensCalc || !p.itensCalc.length) return "";
  const comValor = p.itensCalc.some((it) => !it.texto);
  const linhas = p.itensCalc
    .map((it) => it.texto
      ? `<li><span>${esc(it.nome)}</span></li>`
      : `<li><span>${it.qtd}× ${esc(it.nome)}</span><strong>${brl(it.qtd * it.preco)}</strong></li>`)
    .join("");
  return `<ul class="produto-itens${comValor ? " com-valor" : ""}">${linhas}</ul>${comValor ? `<p class="soma-itens"><span>Soma dos itens</span><strong>${brl(p.preco)}</strong></p>` : ""}`;
}

function cardProduto(p, i) {
  const economia = p.de && p.de > p.preco ? p.de - p.preco : 0;
  return `
    <li class="produto" data-id="${p.id}" style="--i:${i}">
      <div class="produto-arte">
        ${p.selo ? `<span class="selo">${esc(p.selo)}</span>` : ""}
        ${ilustracao(p)}
      </div>
      <div class="produto-corpo">
        <div class="produto-topo">
          <h3 class="produto-nome">${esc(p.nome)}</h3>
          <p class="produto-preco">
            ${economia ? `<s class="preco-de">${brl(p.de)}</s>` : ""}
            <span>${brl(p.preco)}</span>
          </p>
        </div>
        ${economia ? `<p class="economia">Economize ${brl(economia)}</p>` : ""}
        <p class="produto-desc">${esc(p.descricao)}</p>
        ${listaItens(p)}
        <div class="produto-acao" data-acao="${p.id}">${controleQtd(p)}</div>
      </div>
    </li>`;
}

function renderProdutos() {
  const cats = (typeof CATEGORIAS !== "undefined" && CATEGORIAS.length ? CATEGORIAS : [{ id: "", nome: "Produtos", texto: "", cor: "ouro" }])
    .map((c) => ({ ...c, itens: PRODUTOS.filter((p) => !c.id || p.categoria === c.id) }))
    .filter((c) => c.itens.length);
  $("#nav-categorias").innerHTML = cats
    .map((c) => `<button type="button" class="chip chip-${esc(c.cor)}" data-ir-cat="${esc(c.id)}">${esc(c.nome)} <span>${c.itens.length}</span></button>`)
    .join("");
  $("#lista-produtos").innerHTML = cats
    .map((c) => `
      <section class="categoria cor-${esc(c.cor)} ${c.destaque ? "destaque" : "compacta"}" id="cat-${esc(c.id)}">
        <div class="categoria-topo">
          <h2 class="secao-titulo">${esc(c.nome)}</h2>
          ${c.texto ? `<p class="secao-texto">${esc(c.texto)}</p>` : ""}
        </div>
        <ul class="lista-produtos">${c.itens.map((p, i) => cardProduto(p, i)).join("")}</ul>
      </section>`)
    .join("");
}

function alterarQtd(id, delta) {
  const p = produto(id);
  if (!p) return;
  const antes = qtd(id);
  const nova = Math.max(0, Math.min(99, antes + delta));
  if (nova === antes) return;
  if (nova === 0) delete estado.carrinho[id];
  else estado.carrinho[id] = nova;
  salvar();
  const box = $(`[data-acao="${id}"]`);
  if (box) box.innerHTML = controleQtd(p);
  if (delta > 0) {
    pulsarCarrinho();
    if (subtotal() > PEDIDO_MAXIMO) toast(`Atenção: o máximo por pedido é ${brl(PEDIDO_MAXIMO)}.`);
    else if (antes === 0) toast(`${p.nome} adicionado ao carrinho`);
  }
  atualizarTudo();
  if (document.body.dataset.tela === "carrinho") renderCarrinho();
}

/* ---------- Carrinho ---------- */
function renderCarrinho() {
  const ids = Object.keys(estado.carrinho);
  $("#carrinho-vazio").hidden = ids.length > 0;
  $("#carrinho-cheio").hidden = ids.length === 0;
  $("#lista-carrinho").innerHTML = ids
    .map((id) => {
      const p = produto(id);
      return `<li class="item">
        <div class="item-arte">${ilustracao(p)}</div>
        <div class="item-info">
          <strong class="item-nome">${esc(p.nome)}</strong>
          <span class="item-unit">${brl(p.preco)} cada</span>
          <div class="item-linha">
            ${controleQtd(p).replace("btn-add", "btn-add btn-pequeno")}
            <strong class="item-total">${brl(p.preco * qtd(id))}</strong>
          </div>
        </div>
        <button type="button" class="item-remover" data-remover="${id}" aria-label="Remover ${esc(p.nome)}">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
        </button>
      </li>`;
    })
    .join("");
  atualizarTudo();
}

function atualizarTudo() {
  const n = totalItens();
  const badge = $("#badge");
  badge.textContent = n;
  badge.hidden = n === 0;
  $("#btn-carrinho").setAttribute("aria-label", `Abrir carrinho, ${n} ${n === 1 ? "item" : "itens"}`);

  // Barra inferior da tela inicial
  $("#barra-total").classList.toggle("visivel", n > 0 && document.body.dataset.tela === "inicio");
  $("#barra-itens").textContent = `${n} ${n === 1 ? "item" : "itens"}`;
  animarValor($("#barra-valor"), subtotal());
  const f = mensagemFaixa();
  const bAviso = $("#barra-aviso");
  bAviso.textContent = f.ok ? "Pronto para finalizar" : f.texto;
  bAviso.classList.toggle("ok", f.ok);

  // Carrinho
  animarValor($("#carrinho-subtotal"), subtotal());
  animarValor($("#carrinho-total"), total());
  $("#carrinho-entrega").textContent =
    estado.modo === "entrega" ? brl(TAXA_ENTREGA) : estado.modo === "retirada" ? "Grátis (retirada)" : "Escolha na próxima etapa";
  const aviso = $("#aviso-faixa");
  aviso.textContent = f.texto;
  aviso.className = "aviso " + (f.ok ? "ok" : "erro");
  $("#btn-finalizar").disabled = !f.ok;
  const pct = Math.min(100, (subtotal() / PEDIDO_MAXIMO) * 100);
  const barra = $("#faixa-preenchida");
  barra.style.width = pct + "%";
  barra.classList.toggle("passou", subtotal() > PEDIDO_MAXIMO);
  barra.classList.toggle("ok", f.ok);

  // Outras telas
  animarValor($("#entrega-total"), total());
  animarValor($("#pagamento-total"), total());
}

/* ---------- Recebimento: retirada ou entrega ---------- */
function horaMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return [h || 0, m || 0]; }
function rotuloDia(d) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dif = Math.round((d - hoje) / 86400000);
  const data = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  if (dif === 0) return `Hoje (${data})`;
  if (dif === 1) return `Amanhã (${data})`;
  const sem = d.toLocaleDateString("pt-BR", { weekday: "long" });
  return `${sem.charAt(0).toUpperCase() + sem.slice(1)} (${data})`;
}
const horaTxt = (d) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function gerarHorarios() {
  const agora = new Date();
  const pronto = new Date(agora.getTime() + TEMPO_PREPARO_MINUTOS * 60000);
  const passo = INTERVALO_HORARIOS_MINUTOS * 60000;
  const [ha, ma] = horaMin(HORA_ABERTURA);
  const [hf, mf] = horaMin(HORA_FECHAMENTO);
  const dias = [];
  for (let d = 0; d < 10 && dias.length < 3; d++) {
    const dia = new Date(agora); dia.setDate(agora.getDate() + d); dia.setHours(0, 0, 0, 0);
    if (!DIAS_FUNCIONAMENTO.includes(dia.getDay())) continue;
    const ini = new Date(dia); ini.setHours(ha, ma, 0, 0);
    const fim = new Date(dia); fim.setHours(hf, mf, 0, 0);
    let t = new Date(Math.max(ini.getTime(), pronto.getTime()));
    // arredonda para o próximo intervalo a partir da abertura
    const desde = t - ini;
    if (desde > 0) t = new Date(ini.getTime() + Math.ceil(desde / passo) * passo);
    const slots = [];
    while (t <= fim) { slots.push(new Date(t)); t = new Date(t.getTime() + passo); }
    if (slots.length) dias.push({ dia, slots });
  }
  const sel = $("#horario");
  if (!dias.length) {
    sel.innerHTML = `<option value="">Sem horários disponíveis</option>`;
    $("#pronto-em").textContent = "—";
    estado.horario = null;
    return;
  }
  const valores = [];
  sel.innerHTML =
    `<option value="">Escolha um horário</option>` +
    dias.map(({ dia, slots }) =>
      `<optgroup label="${rotuloDia(dia)}">${slots.map((s) => { valores.push(s.toISOString()); return `<option value="${s.toISOString()}">${horaTxt(s)}</option>`; }).join("")}</optgroup>`
    ).join("");
  const primeiro = dias[0].slots[0];
  $("#pronto-em").textContent = `${rotuloDia(dias[0].dia).replace(/ \(.*\)/, "").toLowerCase()}, ${horaTxt(primeiro)}`;
  if (estado.horario && valores.includes(estado.horario)) sel.value = estado.horario;
  else estado.horario = null;
}
function textoHorario(iso) {
  const d = new Date(iso);
  const dia = new Date(d); dia.setHours(0, 0, 0, 0);
  return `${rotuloDia(dia)} às ${horaTxt(d)}`;
}
const textoEnderecoLoja = () => ENDERECO_RETIRADA.trim() || "Combinamos o endereço pelo WhatsApp.";
const linkMapa = (l) => `https://www.google.com/maps?q=${l.lat.toFixed(6)},${l.lng.toFixed(6)}`;

function atualizarEntrega() {
  $$('input[name="modo"]').forEach((r) => (r.checked = r.value === estado.modo));
  $("#bloco-retirada").hidden = estado.modo !== "retirada";
  $("#bloco-entrega").hidden = estado.modo !== "entrega";
  const st = $("#status-localizacao");
  if (estado.localizacao) {
    st.innerHTML = `<span class="ok-txt">✓ Localização recebida</span> (precisão de ~${estado.localizacao.precisao} m). <a href="${linkMapa(estado.localizacao)}" target="_blank" rel="noopener">Ver no mapa</a> · <button type="button" class="link" id="btn-tirar-local">remover</button>`;
    $("#btn-localizacao").lastChild.textContent = " Atualizar localização";
  } else if (!st.dataset.msg) {
    st.textContent = "";
  }
  let aviso = "";
  if (!estado.modo) aviso = "Escolha retirar no local ou entrega.";
  else if (estado.modo === "retirada" && !estado.horario) aviso = "Escolha o horário de retirada.";
  else if (estado.modo === "entrega" && !entregaOk()) aviso = "Envie sua localização ou escreva o endereço com um ponto de referência.";
  const el = $("#aviso-entrega");
  el.textContent = aviso;
  el.className = "aviso " + (aviso ? "info" : "");
  $("#btn-ir-dados").disabled = !entregaOk();
  atualizarTudo();
}

function pedirLocalizacao() {
  const st = $("#status-localizacao");
  const btn = $("#btn-localizacao");
  if (!("geolocation" in navigator)) {
    st.dataset.msg = "1";
    st.innerHTML = `<span class="erro-txt">Seu navegador não permite enviar a localização.</span> Escreva o endereço abaixo.`;
    return;
  }
  btn.disabled = true;
  st.dataset.msg = "1";
  st.textContent = "Buscando sua localização…";
  // Pede UMA única vez (getCurrentPosition). Não há rastreamento contínuo.
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      btn.disabled = false;
      delete st.dataset.msg;
      estado.localizacao = { lat: pos.coords.latitude, lng: pos.coords.longitude, precisao: Math.round(pos.coords.accuracy) };
      atualizarEntrega();
      toast("Localização recebida");
    },
    (err) => {
      btn.disabled = false;
      const msgs = {
        1: "Você não permitiu o acesso à localização.",
        2: "Não foi possível descobrir sua localização agora.",
        3: "Demorou demais para achar sua localização.",
      };
      st.innerHTML = `<span class="erro-txt">${msgs[err.code] || "Não foi possível obter a localização."}</span> Escreva o endereço abaixo.`;
      atualizarEntrega();
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

/* ---------- Dados do cliente ---------- */
function mascaraTelefone(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d.length) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/* ---------- Pagamento ---------- */
function atualizarPagamento() {
  const cartao = $('input[name="pagamento"][value="cartao"]');
  const cripto = $('input[name="pagamento"][value="cripto"]');
  cartao.disabled = !cartaoDisponivel();
  cripto.disabled = !LINK_CRIPTO;
  $("#opcao-cartao").hidden = !LINK_CARTAO;
  $("#opcao-cripto").hidden = !LINK_CRIPTO;
  $("#cartao-sub").textContent = cartaoDisponivel() ? "Link de pagamento seguro" : `Disponível a partir de ${brl(MINIMO_CARTAO)}`;
  if (estado.pagamento && !pagamentoOk()) estado.pagamento = null;
  $$('input[name="pagamento"]').forEach((r) => (r.checked = r.value === estado.pagamento));

  $("#bloco-pix").hidden = estado.pagamento !== "pix";
  $("#bloco-cartao").hidden = estado.pagamento !== "cartao";
  $("#bloco-cripto").hidden = estado.pagamento !== "cripto";

  if (estado.pagamento === "pix") {
    const codigo = gerarPix(total(), estado.numero);
    $("#pix-codigo").value = codigo;
    $("#pix-valor").textContent = brl(total());
    $("#pix-recebedor").textContent = limparTexto(NOME_RECEBEDOR, 25);
    try { $("#pix-qr").innerHTML = QRCodigo.svg(codigo); }
    catch (e) { $("#pix-qr").innerHTML = `<p class="aviso erro">Não foi possível gerar o QR Code. Use o código copia e cola.</p>`; }
  }
  $("#cartao-valor").textContent = brl(total());
  $("#cripto-valor").textContent = brl(total());
  $("#btn-link-cartao").href = LINK_CARTAO || "#";
  $("#btn-link-cripto").href = LINK_CRIPTO || "#";
  $("#btn-ir-confirmar").disabled = !pagamentoOk();
  atualizarTudo();
}

async function copiarPix() {
  const ta = $("#pix-codigo");
  const btn = $("#btn-copiar-pix");
  let ok = false;
  try { await navigator.clipboard.writeText(ta.value); ok = true; }
  catch (e) {
    ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length);
    try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
  }
  btn.classList.toggle("copiado", ok);
  btn.lastChild.textContent = ok ? " Código copiado!" : " Selecione e copie o código";
  toast(ok ? "Código Pix copiado. Cole no app do seu banco." : "Não deu para copiar automaticamente.");
  setTimeout(() => { btn.classList.remove("copiado"); btn.lastChild.textContent = " Copiar código Pix"; }, 3000);
}

/* ---------- Confirmação e WhatsApp ---------- */
const NOMES_PAGAMENTO = { pix: "Pix", cartao: "Cartão (link de pagamento)", cripto: "Criptomoeda (link de pagamento)" };

function montarMensagem() {
  const linhas = [];
  linhas.push(`⚡ *Novo pedido — Loja Cyberpunk*`);
  linhas.push(`Pedido: *${estado.numero}*`);
  linhas.push("");
  linhas.push(`*Cliente:* ${estado.nome.trim()}`);
  linhas.push(`*Telefone:* ${estado.telefone}`);
  linhas.push("");
  linhas.push(`*Itens:*`);
  for (const [id, q] of Object.entries(estado.carrinho)) {
    const p = produto(id);
    linhas.push(`• ${q}x ${p.nome} — ${brl(p.preco * q)}`);
  }
  linhas.push("");
  linhas.push(`Subtotal: ${brl(subtotal())}`);
  if (estado.modo === "entrega") linhas.push(`Taxa de entrega: ${brl(TAXA_ENTREGA)}`);
  linhas.push(`*Total: ${brl(total())}*`);
  linhas.push("");
  if (estado.modo === "retirada") {
    linhas.push(`*Recebimento:* Retirada no local`);
    linhas.push(`*Horário:* ${textoHorario(estado.horario)}`);
  } else {
    linhas.push(`*Recebimento:* Entrega`);
    if (estado.endereco.trim()) linhas.push(`*Endereço/referência:* ${estado.endereco.trim()}`);
    if (estado.localizacao) linhas.push(`*Localização:* ${linkMapa(estado.localizacao)}`);
  }
  linhas.push("");
  linhas.push(`*Pagamento:* ${NOMES_PAGAMENTO[estado.pagamento]}`);
  if (estado.pagamento === "pix") linhas.push(`Vou enviar o comprovante do Pix aqui.`);
  else linhas.push(`Vou enviar o comprovante do pagamento aqui.`);
  return linhas.join("\n");
}

function renderConfirmacao() {
  const itens = Object.entries(estado.carrinho)
    .map(([id, q]) => { const p = produto(id); return `<li><span>${q}× ${esc(p.nome)}</span><strong>${brl(p.preco * q)}</strong></li>`; })
    .join("");
  const receber =
    estado.modo === "retirada"
      ? `<dt>Retirada no local</dt><dd>${esc(textoHorario(estado.horario))}<br><small>${esc(textoEnderecoLoja())}</small></dd>`
      : `<dt>Entrega</dt><dd>${estado.endereco.trim() ? esc(estado.endereco.trim()) : ""}${estado.localizacao ? `${estado.endereco.trim() ? "<br>" : ""}<a href="${linkMapa(estado.localizacao)}" target="_blank" rel="noopener">📍 Localização enviada</a>` : ""}</dd>`;
  $("#resumo-final").innerHTML = `
    <p class="numero-pedido">Pedido <strong>${esc(estado.numero)}</strong></p>
    <ul class="resumo-itens">${itens}</ul>
    <div class="linha"><span>Subtotal</span><span>${brl(subtotal())}</span></div>
    ${estado.modo === "entrega" ? `<div class="linha"><span>Taxa de entrega</span><span>${brl(TAXA_ENTREGA)}</span></div>` : ""}
    <div class="linha total"><span>Total</span><strong>${brl(total())}</strong></div>
    <dl class="resumo-dados">
      <dt>Cliente</dt><dd>${esc(estado.nome.trim())} · ${esc(estado.telefone)}</dd>
      ${receber}
      <dt>Pagamento</dt><dd>${esc(NOMES_PAGAMENTO[estado.pagamento])}</dd>
    </dl>`;
  const numero = WHATSAPP_VENDEDOR.replace(/\D/g, "");
  $("#btn-whatsapp").href = `https://wa.me/${numero}?text=${encodeURIComponent(montarMensagem())}`;
}

function novoPedido() {
  estado.carrinho = {};
  estado.modo = null;
  estado.horario = null;
  estado.endereco = "";
  estado.localizacao = null;
  estado.pagamento = null;
  estado.numero = null;
  $("#endereco").value = "";
  salvar();
  renderProdutos();
  location.hash = "#inicio";
  atualizarTudo();
}

/* ---------- Navegação entre telas ---------- */
function destinoPermitido(nome) {
  const i = ROTAS.indexOf(nome);
  if (i >= 2 && (totalItens() === 0 || !faixaOk())) return "carrinho";
  if (i >= 3 && !entregaOk()) return "entrega";
  if (i >= 4 && !dadosOk()) return "dados";
  if (i >= 5 && !pagamentoOk()) return "pagamento";
  return nome;
}

function rota() {
  let nome = location.hash.replace("#", "") || "inicio";
  if (!ROTAS.includes(nome)) nome = "inicio";
  const destino = destinoPermitido(nome);
  if (destino !== nome) { location.replace("#" + destino); return; }

  $$(".tela").forEach((t) => (t.hidden = t.dataset.tela !== nome));
  document.body.dataset.tela = nome;
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  // Indicador de etapas
  const idx = ROTAS.indexOf(nome);
  $("#etapas").hidden = idx === 0;
  $$("#etapas li").forEach((li, i) => {
    li.classList.toggle("feita", i + 1 < idx);
    li.classList.toggle("atual", i + 1 === idx);
    if (i + 1 === idx) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
  });

  if (nome === "carrinho") renderCarrinho();
  if (nome === "entrega") { gerarHorarios(); atualizarEntrega(); }
  if (nome === "dados") { $("#nome").value = estado.nome; $("#telefone").value = estado.telefone; }
  if (nome === "pagamento") {
    if (!estado.numero) estado.numero = "CAP" + Date.now().toString(36).toUpperCase().slice(-6);
    atualizarPagamento();
  }
  if (nome === "confirmacao") { renderConfirmacao(); setTimeout(confete, 250); }
  atualizarTudo();

  const h = $(`.tela[data-tela="${nome}"] h1`);
  if (h && nome !== "inicio") h.focus({ preventScroll: true });
}

/* ---------- Eventos ---------- */
function ligarEventos() {
  document.addEventListener("click", (e) => {
    const cat = e.target.closest("[data-ir-cat]");
    if (cat) {
      const alvo = document.getElementById("cat-" + cat.dataset.irCat);
      if (alvo) {
        const y = alvo.getBoundingClientRect().top + window.scrollY - ($(".topo").offsetHeight + $(".nav-categorias").offsetHeight + 8);
        window.scrollTo({ top: y, behavior: reduzMovimento ? "auto" : "smooth" });
      }
      return;
    }
    const t = e.target.closest("[data-add],[data-mais],[data-menos],[data-remover],#btn-tirar-local");
    if (!t) return;
    if (t.dataset.add) alterarQtd(t.dataset.add, 1);
    else if (t.dataset.mais) alterarQtd(t.dataset.mais, 1);
    else if (t.dataset.menos) alterarQtd(t.dataset.menos, -1);
    else if (t.dataset.remover) alterarQtd(t.dataset.remover, -qtd(t.dataset.remover));
    else if (t.id === "btn-tirar-local") {
      estado.localizacao = null;
      $("#btn-localizacao").lastChild.textContent = " Enviar minha localização";
      atualizarEntrega();
    }
  });

  // Efeito de "levantar" ao tocar nos cards
  document.addEventListener("pointerdown", (e) => {
    const c = e.target.closest(".produto");
    if (c) c.classList.add("tocando");
  });
  const soltar = () => $$(".produto.tocando").forEach((c) => setTimeout(() => c.classList.remove("tocando"), 180));
  ["pointerup", "pointercancel"].forEach((ev) => document.addEventListener(ev, soltar));

  $("#btn-finalizar").addEventListener("click", () => { if (faixaOk()) location.hash = "#entrega"; });

  $$('input[name="modo"]').forEach((r) =>
    r.addEventListener("change", () => { estado.modo = r.value; atualizarEntrega(); })
  );
  $("#horario").addEventListener("change", (e) => { estado.horario = e.target.value || null; atualizarEntrega(); });
  $("#btn-localizacao").addEventListener("click", pedirLocalizacao);
  $("#endereco").addEventListener("input", (e) => { estado.endereco = e.target.value; atualizarEntrega(); });
  $("#btn-ir-dados").addEventListener("click", () => { if (entregaOk()) location.hash = "#dados"; });

  $("#telefone").addEventListener("input", (e) => {
    e.target.value = mascaraTelefone(e.target.value);
    estado.telefone = e.target.value;
  });
  $("#nome").addEventListener("input", (e) => (estado.nome = e.target.value));
  $("#form-dados").addEventListener("submit", (e) => {
    e.preventDefault();
    estado.nome = $("#nome").value;
    estado.telefone = mascaraTelefone($("#telefone").value);
    const erros = [];
    if (estado.nome.trim().length < 2) erros.push("Digite seu nome.");
    if (digitosTel().length < 10) erros.push("Digite o telefone com DDD, ex.: (11) 91234-5678.");
    const el = $("#erro-dados");
    el.textContent = erros.join(" ");
    el.className = "aviso " + (erros.length ? "erro" : "");
    if (erros.length) { (estado.nome.trim().length < 2 ? $("#nome") : $("#telefone")).focus(); return; }
    salvar();
    location.hash = "#pagamento";
  });

  $$('input[name="pagamento"]').forEach((r) =>
    r.addEventListener("change", () => { estado.pagamento = r.value; atualizarPagamento(); })
  );
  $("#btn-copiar-pix").addEventListener("click", copiarPix);
  $("#btn-ir-confirmar").addEventListener("click", () => { if (pagamentoOk()) location.hash = "#confirmacao"; });

  $("#btn-whatsapp").addEventListener("click", () => setTimeout(confete, 50));
  $("#btn-novo").addEventListener("click", novoPedido);

  window.addEventListener("hashchange", rota);
}

/* ---------- PWA: instalação e modo offline ---------- */
function configurarPWA() {
  let pedidoInstalacao = null;
  const btn = $("#btn-instalar");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    pedidoInstalacao = e;
    btn.hidden = false;
  });
  btn.addEventListener("click", async () => {
    if (!pedidoInstalacao) return;
    pedidoInstalacao.prompt();
    await pedidoInstalacao.userChoice.catch(() => null);
    pedidoInstalacao = null;
    btn.hidden = true;
  });
  window.addEventListener("appinstalled", () => { btn.hidden = true; toast("App instalado!"); });

  // Dica para iPhone (o Safari não mostra botão de instalar)
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const instalado = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  let dispensou = false;
  try { dispensou = localStorage.getItem("loja-cyber-dica-ios") === "1"; } catch (e) {}
  if (ios && !instalado && !dispensou) {
    $("#dica-ios").hidden = false;
    $("#fechar-dica-ios").addEventListener("click", () => {
      $("#dica-ios").hidden = true;
      try { localStorage.setItem("loja-cyber-dica-ios", "1"); } catch (e) {}
    });
  }

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
  }
}

/* ---------- Confirmação de idade (18+) ---------- */
function confirmarIdade() {
  const tela = $("#idade");
  let ok = false;
  try { ok = localStorage.getItem("loja-cyber-18") === "1"; } catch (e) {}
  if (!CONFIRMAR_IDADE || ok) { tela.hidden = true; return; }
  tela.hidden = false;
  document.body.classList.add("travado");
  $("#idade-sim").focus();
  $("#idade-sim").addEventListener("click", () => {
    try { localStorage.setItem("loja-cyber-18", "1"); } catch (e) {}
    tela.classList.add("saindo");
    document.body.classList.remove("travado");
    setTimeout(() => (tela.hidden = true), 350);
  });
  $("#idade-nao").addEventListener("click", () => {
    $("#idade-pergunta").hidden = true;
    $("#idade-bloqueio").hidden = false;
  });
}

/* ---------- Início ---------- */
function iniciar() {
  montarCombos();
  carregar();
  // Textos que vêm da configuração
  $("#regra-minimo").textContent = `Pedido mínimo ${brl(PEDIDO_MINIMO)}`;
  $("#faixa-min").textContent = `Mín. ${brl(PEDIDO_MINIMO)}`;
  $("#faixa-max").textContent = `Máx. ${brl(PEDIDO_MAXIMO)}`;
  $("#faixa-marca").style.left = `${(PEDIDO_MINIMO / PEDIDO_MAXIMO) * 100}%`;
  $("#taxa-entrega-txt").textContent = `Taxa fixa de ${brl(TAXA_ENTREGA)}`;
  $("#endereco-loja").textContent = textoEnderecoLoja();
  const formas = ["Pix", LINK_CARTAO && "cartão", LINK_CRIPTO && "cripto"].filter(Boolean);
  const textoFormas = formas.length > 1 ? formas.slice(0, -1).join(", ") + " ou " + formas[formas.length - 1] : formas[0];
  $$(".formas-pagamento").forEach((el) => (el.textContent = textoFormas));
  confirmarIdade();
  $("#cartao-minimo").textContent = brl(MINIMO_CARTAO);
  $("#ano").textContent = new Date().getFullYear();

  renderProdutos();
  criarFolhasFundo();
  ligarEventos();
  configurarPWA();
  rota();
}

document.addEventListener("DOMContentLoaded", iniciar);
