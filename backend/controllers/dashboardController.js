// =============================================
// CONTROLLER DE DASHBOARD
// =============================================
// Usa as VIEWS do banco para retornar dados agregados.
// TODO (alunos): implementar cada função abaixo.

import dashboardModel from '../models/dashboardModel';
import db from '../config/database.js';

// GET /dashboard/admin - resumo geral de chamados e equipamentos (apenas admin)
// Usa as views: view_resumo_chamados e view_resumo_equipamentos
const resumoAdmin = async (req, res) => {
  try {
    const resumo = await dashboardModel.resumoAdmin()


    res.status(200).json({
      sucesso: true,
      dados: resumo
    });
  } catch (error) {
    console.error('Erro ao listar o resumo geral de chamados e equipamentos', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao listar o resumo geral de chamados e equipamentos'
    });
  }
};

// GET /dashboard/tecnico - chamados abertos/em andamento (técnico/admin)
// Usa a view: view_painel_tecnico
const painelTecnico = async (req, res) => {
  try {
        const painel = await dashboardModel.painelTecnico();
 
        res.status(200).json({
            sucesso: true,
            dados: painel
        });
    } catch (error) {
        console.error('Erro ao listar o painel técnico', error);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno ao listar o painel técnico'
        });
    }
};

module.exports = { resumoAdmin, painelTecnico };
