// =============================================
// PONTO DE ENTRADA DO SERVIDOR
// =============================================
// Este é o arquivo principal. Ele:
//   1. Carrega as variáveis de ambiente (.env)
//   2. Configura o Express e seus middlewares globais
//   3. Registra as rotas da aplicação
//   4. Inicia o servidor na porta definida no .env

// dotenv deve ser o PRIMEIRO require, para que as variáveis
// fiquem disponíveis em todos os outros módulos
import 'dotenv/config';
import express from 'express';

// ---- Importação das rotas ----
import authRoutes from './routes/authRoutes.js';
import equipamentosRoutes from './routes/equipamentosRoutes.js';
import chamadosRoutes from './routes/chamadosRoutes.js';
import manutencaoRoutes from './routes/manutencaoRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();

// ---- Middlewares globais ----

// Permite que o Express leia o corpo das requisições em JSON
app.use(express.json());

// TODO (opcional): adicionar cors se o frontend rodar em outra porta
import cors from 'cors';
app.use(cors());

// ---- Registro das rotas ----
// Cada prefixo aponta para um arquivo de rotas separado
app.use('/auth',         authRoutes);
app.use('/equipamentos', equipamentosRoutes);
app.use('/chamados',     chamadosRoutes);
app.use('/manutencao',   manutencaoRoutes);
app.use('/dashboard',    dashboardRoutes);

// ---- Rota de health check ----
// Útil para verificar se o servidor está no ar
app.get('/', (req, res) => {
  res.json({ mensagem: 'TechRent API está rodando!' });
});

// ---- Inicialização do servidor ----
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
