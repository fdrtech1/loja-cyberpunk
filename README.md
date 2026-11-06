# ⚡ Loja Cyberpunk — Web App (PWA)

Loja com tema **cyberpunk** (neon, glitch, cantos cortados): cardápio e pedidos com combos, tabacaria e larica,
feita em HTML, CSS e JavaScript puro.
Ao abrir, o app pede para o cliente confirmar que tem **18 anos ou mais**.
Não precisa de servidor, banco de dados nem instalação de programas: é só
subir os arquivos no **GitHub Pages** (gratuito).

O cliente escolhe os kits, decide entre **retirar no local** ou **receber em casa**,
paga com **Pix** (QR Code e copia e cola gerados na hora), **cartão** ou **cripto**
(links externos) e envia o pedido pronto pelo **WhatsApp**.

---

## 📁 Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Estrutura das telas |
| `style.css` | Cores, layout e animações |
| `app.js` | Funcionamento do app. **As configurações ficam no topo deste arquivo.** |
| `products.js` | Categorias e produtos (nome, descrição, preço, ilustração) |
| `qrcode.js` | Gera o QR Code do Pix sem depender de internet (não precisa mexer) |
| `manifest.json` | Nome, cores e ícones para “Adicionar à tela inicial” |
| `service-worker.js` | Guarda o app no celular para o cardápio abrir offline |
| `icon.svg` | Ícone do app |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | O mesmo ícone em PNG (Android e iPhone pedem PNG) |

---

## 🚀 Como publicar no GitHub Pages (passo a passo, sem programar)

1. **Crie uma conta** em <https://github.com> (se ainda não tiver).
2. No canto superior direito, clique em **+** → **New repository**.
3. Em **Repository name**, escreva por exemplo `loja-cyberpunk`.
   Deixe marcado **Public** e clique em **Create repository**.
4. Na página do repositório novo, clique no link **uploading an existing file**
   (ou em **Add file → Upload files**).
5. **Arraste todos os arquivos desta pasta** para a janela (os arquivos, não a pasta).
   Confira se `index.html` está na lista. Clique em **Commit changes**.
6. Vá em **Settings** (engrenagem) → no menu da esquerda, **Pages**.
7. Em **Build and deployment → Source**, escolha **Deploy from a branch**.
   Em **Branch**, escolha **main** e a pasta **/ (root)**. Clique em **Save**.
8. Espere 1 a 3 minutos e atualize a página. Vai aparecer:
   **“Your site is live at `https://SEU-USUARIO.github.io/loja-cyberpunk/`”**.
   Esse é o link do seu app. Mande para os clientes! 🎉

> O GitHub Pages já usa **https**, que é obrigatório para instalar o app,
> para o botão de localização e para copiar o código Pix.

### Alternativa pelo terminal (para quem usa git)

```bash
cd loja-cyberpunk
git init
git add .
git commit -m "Primeira versão do app"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/loja-cyberpunk.git
git push -u origin main
```

Depois faça os passos 6 a 8 acima.

---

## 📱 Como o cliente instala no celular

- **Android (Chrome):** abre o link → aparece o botão **Instalar** no topo do app
  (ou menu ⋮ → **Adicionar à tela inicial**).
- **iPhone (Safari):** abre o link → toca em **Compartilhar** (quadrado com seta) →
  **Adicionar à Tela de Início**. O próprio app mostra essa dica no iPhone.

Depois de aberto uma vez, o cardápio funciona **mesmo sem internet**.
(Para enviar pelo WhatsApp e pagar por link, aí sim precisa de internet.)

---

## ⚙️ Configurações (chave Pix, WhatsApp, taxas…)

Abra o `app.js` — no GitHub, clique no arquivo e depois no **lápis ✏️ (Edit this file)**.
Tudo o que você precisa mudar está **no topo**, com explicação:

```js
const CHAVE_PIX = "SEU-EMAIL-AQUI@exemplo.com";   // sua chave Pix
const NOME_RECEBEDOR = "FERNANDO DANIEL";          // nome da conta, sem acento, até 25 letras
const CIDADE = "SAO PAULO";                        // sem acento, até 15 letras
const LINK_CARTAO = "https://link.mercadopago.com.br/SEU-LINK";
const MINIMO_CARTAO = 100.0;
const LINK_CRIPTO = "https://nowpayments.io/payment/?iid=SEU-ID";
const WHATSAPP_VENDEDOR = "5511999999999";         // 55 + DDD + número
const TAXA_ENTREGA = 20.0;
const PEDIDO_MINIMO = 100.0;
const PEDIDO_MAXIMO = 1000.0;
const ENDERECO_RETIRADA = "";                     // vazio = "combinamos pelo WhatsApp"
const CONFIRMAR_IDADE = true;                     // pergunta "tem 18 anos?" ao abrir
const HORA_ABERTURA = "09:00";
const HORA_FECHAMENTO = "18:00";
const DIAS_FUNCIONAMENTO = [1, 2, 3, 4, 5, 6];    // 0 = domingo ... 6 = sábado
const TEMPO_PREPARO_MINUTOS = 40;
const INTERVALO_HORARIOS_MINUTOS = 15;
```

### Chave Pix — formatos

| Tipo | Como escrever |
|---|---|
| E-mail | `"loja@exemplo.com"` |
| Celular | `"+5511912345678"` (com **+55** e DDD, sem espaços) |
| CPF / CNPJ | `"12345678900"` (só números) |
| Aleatória | `"123e4567-e12b-12d1-a456-426655440000"` (como o banco mostra) |

> ✅ **Teste antes de divulgar:** faça um pedido no app, copie o código Pix e cole no
> app do seu banco. Confira se aparecem **o seu nome** e **o valor certo**
> (não precisa concluir o pagamento).

### Regras de valor

- O **mínimo** e o **máximo** valem para a soma dos produtos (sem a taxa de entrega).
  Fora dessa faixa, o botão **Finalizar pedido** fica bloqueado e aparece um aviso.
- A taxa de entrega (`TAXA_ENTREGA`) é somada ao total quando o cliente escolhe **Entrega**.
- O cartão só fica disponível quando o total chega em `MINIMO_CARTAO`.
- Para esconder cartão ou cripto, deixe o link vazio: `const LINK_CRIPTO = "";`

---

## 🛍️ Como editar produtos e preços

Abra o `products.js`. No topo ficam as **categorias** (Combos, Tabacaria, Larica)
e, embaixo, os **produtos**. Cada produto é um bloco assim:

```js
{
  id: "seda-king-brown",
  categoria: "tabacaria",          // "combos", "tabacaria" ou "larica"
  nome: "Seda King Size Brown",
  descricao: "Livreto de papel natural, tamanho king size.",
  preco: 6.0,
  icone: "seda",
  selo: "",                        // etiqueta no card ("" = nenhuma)
  itens: [],                       // lista do que vem (usada nos combos)
},
```

- **Preço:** use ponto, não vírgula → `18.9` = R$ 18,90.
- **Combos:** use `preco: "soma"` e liste os itens. O preço do combo é a **soma
  automática** dos itens. Item com `id` usa o preço do produto avulso (mudou a seda,
  o combo muda junto); item sem `id` leva `nome` e `preco` próprios.
  Ex.: `{ id: "seda-king-brown", qtd: 3 }` ou `{ nome: "Tabaco 120 g", qtd: 1, preco: 83.8 }`.
- **Ícones disponíveis:** `combo`, `seda`, `tabaco`, `piteira`, `dichavador`,
  `isqueiro`, `bandeja`, `salgadinho`, `chocolate`, `refri`, `cookie`, `bala`, `cigarro`.
- **Novo produto:** copie um bloco inteiro, cole depois do último, troque o `id`
  (ele não pode se repetir) e não esqueça a **vírgula** entre os blocos.
- **Remover produto:** apague o bloco inteiro, do `{` até o `},`.

Os preços iniciais foram baseados em valores reais de tabacarias online e
supermercados/apps de delivery (nov/2026). **Ajuste para o seu custo e margem.**

> ⚠️ **Regras importantes**
> - Venda de produtos de tabacaria é **proibida para menores de 18 anos** — por isso
>   o app pede a confirmação de idade (`CONFIRMAR_IDADE` no `app.js`). Confira também
>   a idade na entrega/retirada.
> - O rodapé traz o aviso do Ministério da Saúde exigido para propaganda de tabaco. Não remova.
> - Não escreva nos produtos promessas de efeito no corpo.

---

## 🔄 Depois de editar: atualize a versão

Toda vez que mudar qualquer arquivo, abra o `service-worker.js` e troque a versão:

```js
const VERSAO = "loja-cyber-v1";   // mude para "loja-cyber-v2", depois "v3"...
```

Isso faz o celular dos clientes baixar a versão nova. No GitHub as mudanças
aparecem no site em 1 a 3 minutos.

---

## 🎨 Cores

Tema cyberpunk: as cores ficam no topo do `style.css` (`--preto`, `--verde` = ciano,
`--ouro` = amarelo, `--vermelho` = magenta…). Se trocar, mantenha sempre **texto claro em fundo
escuro e texto preto em fundo neon**.

---

## 🔒 Privacidade

- A localização é pedida **uma única vez**, só quando o cliente toca em
  “Enviar minha localização”. Não existe rastreamento e ela não fica salva.
- O app guarda no próprio celular do cliente apenas o carrinho, o nome e o
  telefone (para facilitar o próximo pedido). Nada é enviado para servidores:
  o pedido só sai quando o cliente toca em **Enviar pelo WhatsApp**.

---

## 🧪 Testar no computador antes de publicar

O app precisa ser aberto por um endereço `http://`, não com duplo clique no arquivo.
Com Python instalado, dentro da pasta:

```bash
python -m http.server 8080
```

Depois abra <http://localhost:8080> no navegador.
