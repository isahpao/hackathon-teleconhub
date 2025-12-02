const express = require("express");
const cors = require("cors");
const path = require('path');
const fs = require('fs');

// Caminho para o arquivo JSON (usaremos ele como nosso 'banco de dados' temporário)
const DATA_FILE = path.join(__dirname, "data", "transacoes.json");

// Função para ler as transações
function lerTransacoes() {
    try {
        const data = fs.readFileSync(DATA_FILE);
        return JSON.parse(data);
    } catch (e) {
        // Se o arquivo não existir ou for inválido, retorna uma lista vazia
        console.error("Erro ao ler transacoes.json:", e.message);
        return [];
    }
}

// Função para salvar as transações
function salvarTransacoes(transacoes) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(transacoes, null, 2));
}

// Inicializa as transações
let transacoes = lerTransacoes();

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// FUNÇÃO AUXILIAR: Encontrar a Categoria de Maior Gasto
// ===============================
function calcularPadraoGasto(transacoes) {
    const gastos = transacoes.filter(t => t.valor < 0);
    const somasPorCategoria = gastos.reduce((acc, t) => {
        const categoria = t.categoria || 'outros';
        acc[categoria] = (acc[categoria] || 0) + t.valor; // Valores são negativos
        return acc;
    }, {});

    let maiorGastoCategoria = 'outros';
    let maiorGastoValor = 0;

    for (const cat in somasPorCategoria) {
        // Comparar o valor absoluto (mais negativo)
        if (somasPorCategoria[cat] < maiorGastoValor) {
            maiorGastoValor = somasPorCategoria[cat];
            maiorGastoCategoria = cat;
        }
    }

    return `Maior gasto: ${maiorGastoCategoria}`;
}


// ==========================================================
// 1) ROTA CRÍTICA FALTANDO: Dashboard (GET /dashboard)
// ==========================================================
app.get("/dashboard", (req, res) => {
    // 1. Calcular Saldo
    const saldo = transacoes.reduce((soma, t) => soma + t.valor, 0).toFixed(2);

    // 2. Determinar Padrão de Gasto
    const padraoGasto = calcularPadraoGasto(transacoes);

    // 3. Previsão de Quebra (Lógica simples simulada)
    const previsaoQuebra = (parseFloat(saldo) < 50) 
        ? "ALERTA: Risco de saldo negativo em 7 dias."
        : "Saldo saudável. Mantenha o ritmo.";
    
    // 4. Determinar Alerta
    const alertaSaldo = parseFloat(saldo) < 0;

    res.json({
        saldo: parseFloat(saldo),
        previsao_quebra: previsaoQuebra,
        padrao_gasto: padraoGasto,
        alerta_saldo: alertaSaldo,
    });
});

// ===============================
// 2) ROTA: Extrato completo
// ===============================
app.get("/transacoes", (req, res) => {
    res.json(transacoes);
});

// ==========================================================
// 3) ROTA CRÍTICA FALTANDO: Adicionar Transação (POST /transacoes)
// ==========================================================
app.post("/transacoes", (req, res) => {
    const novaTransacao = req.body;
    
    // Simples validação e criação de ID (para facilitar o reset)
    const id = Date.now(); 
    transacoes.unshift({ ...novaTransacao, id }); // Adiciona no início
    
    // Salva no arquivo (mantém persistência simples)
    salvarTransacoes(transacoes);

    return res.status(201).json({
        sucesso: true,
        mensagem: "Transação adicionada com sucesso.",
        id: id
    });
});

// ==========================================================
// 4) ROTA CRÍTICA FALTANDO: Resetar Transações (POST /transacoes/reset)
// ==========================================================
app.post("/transacoes/reset", (req, res) => {
    // Apaga todas as transações (reset para a lista vazia)
    transacoes = [];
    salvarTransacoes(transacoes); // Salva a lista vazia no arquivo

    return res.status(200).json({
        sucesso: true,
        mensagem: "Todas as transações foram resetadas."
    });
});

// ===============================
// OUTRAS ROTAS (Serviços Simulados)
// ===============================

// ROTA: Serviço simulado (Recarga) - Mantido
app.post("/servicos/recarga", (req, res) => {
    const { numero, valor } = req.body;
    // ... (restante do código)
    if (!numero || !valor) {
        return res.status(400).json({
            erro: "É necessário enviar 'numero' e 'valor'."
        });
    }

    // Se fosse um sistema real, aqui você adicionaria a transação de gasto
    // Apenas simulação de serviço:
    return res.json({
        sucesso: true,
        mensagem: `Recarga de R$${valor} para o número ${numero} realizada com sucesso!`
    });
});

// ROTA: Serviço simulado (PIX) - Mantido
app.post("/servicos/pix", (req, res) => {
    const { chave_destino, valor } = req.body;

    if (!chave_destino || !valor) {
        return res.status(400).json({
            erro: "É necessário enviar 'chave_destino' e 'valor'."
        });
    }

    return res.json({
        sucesso: true,
        mensagem: `PIX de R$${valor} enviado para ${chave_destino} com sucesso!`
    });
});

// ROTA: Serviço simulado (Pagamento de Boleto) - Mantido
app.post("/servicos/pagamento", (req, res) => {
    const { codigo_barras, valor } = req.body;

    if (!codigo_barras || !valor) {
        return res.status(400).json({
            erro: "É necessário enviar 'codigo_barras' e 'valor'."
        });
    }

    return res.json({
        sucesso: true,
        mensagem: `Pagamento de R$${valor} realizado com sucesso para o boleto ${codigo_barras}.`
    });
});

// ===============================
// Servidor rodando
// ===============================
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend rodando em http://localhost:${PORT}`);
    console.log(`Dados carregados de: ${DATA_FILE}`);
});