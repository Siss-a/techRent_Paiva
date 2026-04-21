// =============================================
// CONTROLLER DE HISTÓRICO DE MANUTENÇÃO
// =============================================
// TODO (alunos): implementar cada função abaixo.
// gerebcia a tabela de auditoria que liga Tecnicos, CHamado e Equipamento
// Fluxo esperado: aberto -> em_atendimento -> (registrar manutenção) -> resolvido/operacional.

import manutencaoModel from '../models/manutencaoModel.js';
import { update } from '../config/database.js';

// GET /manutencao - lista todos os registros de manutenção (admin/técnico)
const listar = async (req, res) => {
  try {
    const manutencoes = await manutencaoModel.listar();

    res.status(200).json({
      sucesso: true,
      dados: manutencoes
    });
  } catch (error) {
    console.error('Erro ao listar manutenções:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao listar manutenções'
    });
  }
};

// POST /manutencao - registra um reparo em um equipamento (técnico)
// Body esperado: { chamado_id, equipamento_id, descricao }
// Após registrar, atualizar chamados.status para 'resolvido'
// e equipamentos.status para 'operacional'
const registrar = async (req, res) => {
  try {
    const { chamado_id, equipamento_id, descricao } = req.body
    const tecnico_id = req.usuario.id;

    // Validação básica
    if (!chamado_id || !equipamento_id || !descricao) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: chamado_id, equipamento_id, descricao'
      });
    }

    //Validar se o chamado existe e pertence ao equipamento
    const chamado = await chamadosModel.buscarPorId(chamado_id);
    if (!chamado) {
      return res.status(404).json({ sucesso: false, erro: 'Chamado não encontrado' });
    }

    if (chamado.equipamento_id !== equipamento_id) {
      return res.status(400).json({
        sucesso: false,
        erro: 'O equipamento informado não corresponde ao equipamento do chamado.'
      });
    }

    // Impedir duplicidade de resolução
    if (chamado.status === 'resolvido') {
      return res.status(400).json({
        sucesso: false,
        erro: 'Este chamado já foi finalizado anteriormente.'
      });
    }

    const dadosManutencao = {
      chamado_id,
      equipamento_id,
      tecnico_id,
      descricao,
      registrado_em: new Date()
    };

    const novoId = await manutencaoModel.registrar(dadosManutencao);

    // Atualiza o chamado para 'resolvido'
    await update('chamados', { status: 'resolvido' }, `id = ${chamado_id}`);

    // Atualiza o equipamento para 'operacional'
    await update('equipamentos', { status: 'operacional' }, `id = ${equipamento_id}`);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Manutenção registrada com sucesso',
      dados: {
        id: novoId,
        ...dadosManutencao
      }
    });

  } catch (error) {
    console.error('Erro ao registrar manutenção:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao registrar manutenção'
    });
  }
};

export default { listar, registrar };
