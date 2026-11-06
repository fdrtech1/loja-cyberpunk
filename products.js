/* =========================================================
   PRODUTOS — Loja Cyberpunk

   Os preços abaixo foram baseados em valores reais de tabacarias online e
   supermercados/apps de delivery do Brasil (nov/2026). Ajuste para o seu
   custo e margem.

   1) CATEGORIAS: as seções do cardápio, na ordem em que aparecem.
      - id:       identificador (sem espaços). Usado no campo "categoria".
      - nome:     título da seção.
      - texto:    frase curta embaixo do título.
      - cor:      "ouro", "verde" ou "vermelho".
      - destaque: true = cards grandes (1 por linha no celular).

   2) PRODUTOS: cada produto é um bloco { ... }.
      - id:        identificador único, sem espaços nem acentos. Não repita.
      - categoria: id de uma das categorias acima.
      - nome:      nome que aparece no cardápio.
      - descricao: texto curto. Não escreva promessas de efeito no corpo.
      - preco:     número com PONTO decimal. Ex.: 6 = R$ 6,00 | 18.9 = R$ 18,90
                   Nos COMBOS use preco: "soma" — o app calcula sozinho
                   somando o preço de todos os itens do combo.
      - icone:     ilustração do card. Opções:
                   "combo", "seda", "tabaco", "piteira", "dichavador",
                   "isqueiro", "bandeja", "salgadinho", "chocolate",
                   "refri", "cookie", "bala", "cigarro",
                   bebidas: "lata-vermelha", "lata-preta", "lata-laranja",
                   "lata-uva", "lata-verde", "energetico-preto",
                   "energetico-azul", "energetico-branco", "energetico-rosa",
                   "garrafa-agua", "garrafa-cola", "garrafa-laranja"
      - selo:      etiqueta opcional no canto do card ("" para nenhuma).
      - itens:     o que vem no combo. Cada item pode ser:
                   { id: "seda-king-brown", qtd: 3 }
                       → usa o nome e o preço do produto avulso com esse id
                         (mudou o preço da seda? o combo muda junto)
                   { nome: "Tabaco para enrolar 20 g", qtd: 1, preco: 15.9 }
                       → item que não é vendido separado, com preço próprio
                   Produtos avulsos usam itens: [].
   ========================================================= */

const CATEGORIAS = [
  { id: "combos", nome: "Kits", texto: "Loadout completo, já separado. O preço é a soma dos itens.", cor: "ouro", destaque: true },
  { id: "tabacaria", nome: "Tabacaria", texto: "Sedas, tabaco, cigarros e acessórios com cara de futuro.", cor: "verde", destaque: false },
  { id: "larica", nome: "Larica & Energia", texto: "Snacks, refri e energético pra virar a noite.", cor: "vermelho", destaque: false },
];

const PRODUTOS = [
  // ---------- COMBOS ----------
  // O preço de cada combo é a soma dos itens (preco: "soma").
  {
    id: "combo-kingston",
    categoria: "combos",
    nome: "Kit Overclock",
    descricao: "O loadout básico: tudo pra enrolar e a larica pra recarregar.",
    preco: "soma",
    icone: "combo",
    selo: "Nível 1",
    itens: [
      { id: "tabaco-25", qtd: 1 },
      { id: "seda-king-brown", qtd: 3 },
      { id: "piteira-papel", qtd: 1 },
      { id: "piteira-vidro", qtd: 1 },
      { id: "isqueiro", qtd: 1 },
      { id: "salgadinho", qtd: 1 },
      { id: "chocolate", qtd: 1 },
      { id: "cookies", qtd: 1 },
      { id: "refri-lata", qtd: 1 },
    ],
  },
  {
    id: "combo-montego-bay",
    categoria: "combos",
    nome: "Kit Neon Rush",
    descricao: "Upgrade com dichavador e bandeja, mais tabaco e larica pra squad.",
    preco: "soma",
    icone: "combo",
    selo: "Mais pedido",
    itens: [
      { id: "tabaco-50", qtd: 1 },
      { id: "tabaco-25", qtd: 1 },
      { id: "seda-king-brown", qtd: 5 },
      { id: "piteira-vidro", qtd: 1 },
      { id: "piteira-papel", qtd: 2 },
      { id: "dichavador-metal", qtd: 1 },
      { id: "bandeja-metal", qtd: 1 },
      { id: "isqueiro", qtd: 2 },
      { id: "salgadinho", qtd: 2 },
      { id: "chocolate", qtd: 1 },
      { id: "cookies", qtd: 1 },
      { id: "refri-lata", qtd: 2 },
    ],
  },
  {
    id: "combo-zion",
    categoria: "combos",
    nome: "Kit Chrome Total",
    descricao: "Equipamento completo da casa: acessórios, estoque de tabaco e larica de respeito.",
    preco: "soma",
    icone: "combo",
    selo: "Nível máx.",
    itens: [
      { nome: "Tabaco para enrolar 120 g", qtd: 1, preco: 83.8 }, // proporcional ao pacote de 50 g (R$ 34,90)
      { id: "seda-king-brown", qtd: 10 },
      { id: "piteira-vidro", qtd: 2 },
      { id: "piteira-papel", qtd: 3 },
      { id: "dichavador-metal", qtd: 1 },
      { id: "bandeja-metal", qtd: 1 },
      { id: "isqueiro", qtd: 3 },
      { id: "salgadinho", qtd: 4 },
      { id: "chocolate", qtd: 3 },
      { id: "cookies", qtd: 2 },
      { id: "bala-goma", qtd: 2 },
      { id: "refri-lata", qtd: 6 },
    ],
  },

  // ---------- TABACARIA ----------
  { id: "seda-king-brown", categoria: "tabacaria", nome: "Seda King Size Brown", descricao: "Livreto de papel natural, tamanho king size.", preco: 6.0, icone: "seda", selo: "", itens: [] },
  { id: "seda-slim-branca", categoria: "tabacaria", nome: "Seda Slim Branca", descricao: "Livreto de folhas finas, tamanho slim.", preco: 3.5, icone: "seda", selo: "", itens: [] },
  { id: "tabaco-25", categoria: "tabacaria", nome: "Tabaco para Enrolar 25 g", descricao: "Pacote com fecho, corte fino.", preco: 18.9, icone: "tabaco", selo: "", itens: [] },
  { id: "tabaco-50", categoria: "tabacaria", nome: "Tabaco para Enrolar 50 g", descricao: "Pacote maior com fecho, corte fino.", preco: 34.9, icone: "tabaco", selo: "Rende mais", itens: [] },
  { id: "cigarro-maco", categoria: "tabacaria", nome: "Cigarro de Papel (maço)", descricao: "Maço com 20 cigarros, marcas sortidas.", preco: 15.0, icone: "cigarro", selo: "", itens: [] },
  { id: "piteira-papel", categoria: "tabacaria", nome: "Piteira de Papel", descricao: "Livreto picotado, fácil de enrolar.", preco: 3.5, icone: "piteira", selo: "", itens: [] },
  { id: "piteira-vidro", categoria: "tabacaria", nome: "Piteira de Vidro", descricao: "Reutilizável e lavável.", preco: 12.0, icone: "piteira", selo: "", itens: [] },
  { id: "dichavador-metal", categoria: "tabacaria", nome: "Dichavador de Metal", descricao: "4 partes, dentes afiados e ímã na tampa.", preco: 35.0, icone: "dichavador", selo: "", itens: [] },
  { id: "isqueiro", categoria: "tabacaria", nome: "Isqueiro", descricao: "Isqueiro a gás, cores sortidas.", preco: 5.0, icone: "isqueiro", selo: "", itens: [] },
  // ---- acessórios neon / tech ----
  { id: "isqueiro-plasma", categoria: "tabacaria", nome: "Isqueiro Plasma USB", descricao: "Arco elétrico duplo, recarrega no USB-C. Sem gás.", preco: 35.0, icone: "isqueiro", selo: "Novo", itens: [] },
  { id: "dichavador-eletrico", categoria: "tabacaria", nome: "Dichavador Elétrico USB", descricao: "Motor recarregável e lâminas de inox.", preco: 69.9, icone: "dichavador", selo: "Tech", itens: [] },
  { id: "bandeja-holografica", categoria: "tabacaria", nome: "Bandeja Holográfica", descricao: "Acabamento furta-cor que muda com a luz.", preco: 39.9, icone: "bandeja", selo: "Neon", itens: [] },
  { id: "piteira-vidro-neon", categoria: "tabacaria", nome: "Piteira de Vidro Neon", descricao: "Vidro colorido que brilha sob luz negra.", preco: 18.0, icone: "piteira", selo: "", itens: [] },
  { id: "bandeja-metal", categoria: "tabacaria", nome: "Bandeja de Metal", descricao: "Tamanho médio, estampada.", preco: 30.0, icone: "bandeja", selo: "", itens: [] },

  // ---------- LARICA ----------
  { id: "salgadinho", categoria: "larica", nome: "Salgadinho", descricao: "Pacote de 100 g, sabores sortidos.", preco: 9.9, icone: "salgadinho", selo: "", itens: [] },
  { id: "chocolate", categoria: "larica", nome: "Chocolate", descricao: "Barra ao leite de 90 g.", preco: 11.0, icone: "chocolate", selo: "", itens: [] },
  { id: "cookies", categoria: "larica", nome: "Cookies", descricao: "Pacote com gotas de chocolate.", preco: 6.5, icone: "cookie", selo: "", itens: [] },
  { id: "bala-acida-neon", categoria: "larica", nome: "Bala Ácida Neon", descricao: "Pacote de 100 g, cores fluorescentes.", preco: 8.5, icone: "bala", selo: "", itens: [] },
  { id: "bala-goma", categoria: "larica", nome: "Bala de Goma", descricao: "Pacote de 150 g, sabores de fruta.", preco: 7.5, icone: "bala", selo: "", itens: [] },

  // ---------- BEBIDAS (dentro da Larica) ----------
  { id: "refri-lata", categoria: "larica", nome: "Coca-Cola Lata 350 ml", descricao: "Lata gelada.", preco: 6.5, icone: "lata-vermelha", selo: "", itens: [] },
  { id: "coca-zero-lata", categoria: "larica", nome: "Coca-Cola Zero Lata 350 ml", descricao: "Lata gelada, sem açúcar.", preco: 6.5, icone: "lata-preta", selo: "", itens: [] },
  { id: "coca-2l", categoria: "larica", nome: "Coca-Cola 2 L", descricao: "Garrafa pra dividir com a galera.", preco: 12.9, icone: "garrafa-cola", selo: "", itens: [] },
  { id: "fanta-laranja-lata", categoria: "larica", nome: "Fanta Laranja Lata 350 ml", descricao: "Lata gelada.", preco: 6.0, icone: "lata-laranja", selo: "", itens: [] },
  { id: "fanta-uva-lata", categoria: "larica", nome: "Fanta Uva Lata 350 ml", descricao: "Lata gelada.", preco: 6.0, icone: "lata-uva", selo: "", itens: [] },
  { id: "fanta-2l", categoria: "larica", nome: "Fanta Laranja 2 L", descricao: "Garrafa pra dividir.", preco: 10.9, icone: "garrafa-laranja", selo: "", itens: [] },
  { id: "guarana-lata", categoria: "larica", nome: "Guaraná Antarctica Lata 350 ml", descricao: "Lata gelada.", preco: 5.5, icone: "lata-verde", selo: "", itens: [] },
  { id: "monster-mango", categoria: "larica", nome: "Monster Mango Loco 473 ml", descricao: "Energético sabor manga.", preco: 11.0, icone: "energetico-azul", selo: "Top", itens: [] },
  { id: "monster-tradicional", categoria: "larica", nome: "Monster Energy 473 ml", descricao: "Energético sabor tradicional.", preco: 11.0, icone: "energetico-preto", selo: "", itens: [] },
  { id: "monster-ultra", categoria: "larica", nome: "Monster Ultra 473 ml", descricao: "Energético sem açúcar.", preco: 11.0, icone: "energetico-branco", selo: "", itens: [] },
  { id: "monster-pipeline", categoria: "larica", nome: "Monster Pipeline Punch 473 ml", descricao: "Energético sabor frutas tropicais.", preco: 11.0, icone: "energetico-rosa", selo: "", itens: [] },
  { id: "agua-500", categoria: "larica", nome: "Água Mineral 500 ml", descricao: "Sem gás, gelada.", preco: 3.5, icone: "garrafa-agua", selo: "", itens: [] },
];
