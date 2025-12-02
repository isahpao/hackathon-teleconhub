// ===============================
// CONFIGURAÇÃO DA API ONLINE
// ===============================
const API_URL_BASE = "https://hackathon-teleconhub.onrender.com";
const ENDPOINT_DASHBOARD = `${API_URL_BASE}/dashboard`;
const ENDPOINT_TRANSACOES = `${API_URL_BASE}/transacoes`;

function traduzirCategoria(categoriaCurta) {
  if (!categoriaCurta) return "Outros";

  switch (categoriaCurta.toLowerCase()) {
    case "pix_envio":
    case "pix_saida":
      return "Transferência Enviada";
    case "pix_recebido":
    case "pix_entrada":
      return "Renda Recebida (PIX)";
    case "pagamento":
      return "Pagamento de Contas";
    case "recarga":
      return "Serviços/Recarga";
    case "alimentacao":
    case "mercado":
      return "Alimentação";
    case "transporte":
    case "uber":
      return "Transporte";
    case "saude":
    case "farmácia":
      return "Saúde";
    case "renda":
    case "salário":
      return "Renda";
    case "serviços":
      return "Serviços";
    default:
      return categoriaCurta.charAt(0).toUpperCase() + categoriaCurta.slice(1);
  }
}

function categorizar(descricao) {
  descricao = descricao.toLowerCase();
  if (
    descricao.includes("mercado") ||
    descricao.includes("super") ||
    descricao.includes("lanche")
  )
    return "Alimentação";
  if (
    descricao.includes("uber") ||
    descricao.includes("carro") ||
    descricao.includes("gasolina") ||
    descricao.includes("99")
  )
    return "Transporte";
  if (descricao.includes("farmácia") || descricao.includes("remédio"))
    return "Saúde";
  if (descricao.includes("salário") || descricao.includes("pagamento"))
    return "Renda";
  if (
    descricao.includes("recarga") ||
    descricao.includes("celular") ||
    descricao.includes("boleto")
  )
    return "Serviços";
  return "Outros";
}

async function carregarDashboard() {
  try {
    const [dashboardResponse, transacoesResponse] = await Promise.all([
      fetch(ENDPOINT_DASHBOARD),
      fetch(ENDPOINT_TRANSACOES),
    ]);

    if (!dashboardResponse.ok || !transacoesResponse.ok) {
      throw new Error("Erro ao buscar dados do backend.");
    }

    const dashboard = await dashboardResponse.json();
    const transacoes = await transacoesResponse.json();

    const lista = document.getElementById("lista-transacoes");
    const saldoElemento = document.getElementById("saldo");
    const previsaoElemento = document.getElementById("previsao");
    const padraoElemento = document.getElementById("padrao");

    saldoElemento.textContent = `R$ ${dashboard.saldo}`;
    previsaoElemento.textContent = dashboard.previsao_quebra;

    const padraoCompleto = dashboard.padrao_gasto;
    const prefixo = "Maior gasto: ";
    let padraoTraduzido = padraoCompleto;

    if (padraoCompleto.startsWith(prefixo)) {
      const categoriaCurta = padraoCompleto.substring(prefixo.length).trim();
      const categoriaLegivel = traduzirCategoria(categoriaCurta);
      padraoTraduzido = `${prefixo}${categoriaLegivel}`;
    }
    padraoElemento.textContent = padraoTraduzido;

    if (dashboard.alerta_saldo || parseFloat(dashboard.saldo) < 0) {
      saldoElemento.classList.add("saldo-negativo");
      saldoElemento.classList.remove("saldo-positivo");
    } else {
      saldoElemento.classList.remove("saldo-negativo");
      saldoElemento.classList.add("saldo-positivo");
    }

    lista.innerHTML = "";
    transacoes.forEach((t) => {
      const li = document.createElement("li");
      const valorFormatado = t.valor.toFixed(2);
      const categoriaLegivel = traduzirCategoria(t.categoria);
      li.textContent = `${t.descricao} (${categoriaLegivel}): R$ ${valorFormatado}`;
      lista.appendChild(li);
    });
  } catch (error) {
    console.error("Erro fatal ao carregar o dashboard:", error);
    document.getElementById("saldo").textContent = "ERRO: API OFFLINE";
  }
}

async function enviarNovaTransacao(novaTransacao) {
  try {
    const response = await fetch(ENDPOINT_TRANSACOES, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(novaTransacao),
    });

    if (!response.ok)
      throw new Error(`Erro ao adicionar transação: ${response.status}`);

    carregarDashboard();
    return true;
  } catch (error) {
    console.error("Falha ao adicionar transação via API:", error);
    alert("Erro ao conectar com o servidor para adicionar a transação.");
    return false;
  }
}

function entradaRapida(valor) {
  const nova = {
    descricao: `Entrada rápida +${valor}`,
    valor: Number(valor),
    categoria: "Renda",
  };
  enviarNovaTransacao(nova);
}

function gastoRapido(descricao, valor) {
  const nova = {
    descricao,
    valor: -Math.abs(Number(valor)),
    categoria: categorizar(descricao),
  };
  enviarNovaTransacao(nova);
}

async function pagarBoleto() {
  const nova = {
    descricao: "Pagamento de boleto",
    valor: -100,
    categoria: "Serviços",
  };
  const sucesso = await enviarNovaTransacao(nova);
  if (sucesso) alert("Boleto pago com sucesso!");
}

async function recargaCelular() {
  const nova = {
    descricao: "Recarga de celular",
    valor: -20,
    categoria: "Serviços",
  };
  const sucesso = await enviarNovaTransacao(nova);
  if (sucesso) alert("Recarga realizada!");
}

async function resetarTudo() {
  if (confirm("Tem certeza que deseja limpar todas as transações?")) {
    try {
      await fetch(ENDPOINT_TRANSACOES + "/reset", { method: "POST" });
      carregarDashboard();
    } catch (e) {
      alert("Falha ao resetar. Implemente a rota de reset no backend primeiro.");
    }
  }
}

carregarDashboard();
