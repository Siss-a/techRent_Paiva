// =============================================
// CONTROLLER DE CHAMADOS
// =============================================
// TODO (alunos): implementar cada função abaixo.
//
// Fluxo de status:
//   aberto -> em_atendimento -> resolvido
//                           -> cancelado

import chamadosModel from '../models/chamadosModel';
import db from '../config/database.js';

// GET /chamados - lista chamados
//   admin/técnico -> todos os chamados
//   cliente       -> apenas os seus (WHERE cliente_id = req.usuario.id)
const listar = async (req, res) => {
  try {
    const { usuario } = req.usuario;
    const chamados = await chamadosModel.listar(usuario);

    res.status(200).json({
      sucesso: true,
      dados: chamados
    });
  } catch (error) {
    console.error('Erro ao listar chamados:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao listar chamados'
    });
  }
};

// GET /chamados/:id - retorna um chamado pelo ID
const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const chamado = await chamadosModel.buscarPorId(id);

    if (!chamado) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Chamado não encontrado'
      });
    }

    res.status(200).json({
      sucesso: true,
      dados: chamado
    });

  } catch (error) {
    console.error('Erro ao buscar chamado por id:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao buscar chamado'
    });
  }
};

// POST /chamados - abre um novo chamado (cliente/admin)
// Body esperado: { titulo, descricao, equipamento_id, prioridade }
const criar = async (req, res) => {
  // TODO: inserir em chamados com cliente_id = req.usuario.id
  //       e atualizar equipamentos.status para 'em_manutencao'
  try {

    const { titulo, descricao, equipamento_id, prioridade } = req.body;
    const cliente_id = req.usuario.id;

    const prioridadesValidas = ['baixa', 'media', 'alta'];

    if (prioridade && !prioridadesValidas.includes(prioridade)) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Prioridade inválida'
      });
    }

    const dadosChamado = {
      titulo,
      descricao,
      equipamento_id,
      prioridade: prioridade || 'media',
      status: 'aberto',
      cliente_id
      //tecnico_id atribuido dps???
    };

    const novoId = await chamadosModel.criar(dadosChamado);

    // Atualiza o status do equipamento para 'em_manutencao' ?????
    await update('equipamentos', { status: 'em_manutencao' }, `id = ${equipamento_id}`);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Chamado criado com sucesso',
      dados: {
        id: novoId,
        titulo,
        descricao,
        equipamento_id,
        prioridade: chamadoCriado.prioridade,
        status: chamadoCriado.status,
        cliente_id
      }
    });

  } catch (error) {
    console.error('Erro ao criar um novo chamado: ', error);
    throw error;
  }
};

// PUT /chamados/:id/status - atualiza o status do chamado (técnico/admin)
// Body esperado: { status, tecnico_id (opcional) }
const atualizarStatus = async (req, res) => {
  // TODO: ex: aberto -> em_atendimento -> resolvido
  //       ao resolver, atualizar equipamentos.status para 'operacional'
  try {
    const { id } = req.params;
    const { status, tecnico_id } = req.body;

    const statusValidos = ['em_atendimento', 'resolvido', 'cancelado'];
    if (!status || !statusValidos.includes(status)) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Status inválido. Use: em_atendimento, resolvido ou cancelado'
      });
    }


    // Verifica se o chamado existe
    const chamado = await ChamadosModel.buscarPorId(id);
    if (!chamado) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Chamado não encontrado'
      });
    }

    const dadosAtualizar = { status };
    if (tecnico_id) dadosAtualizar.tecnico_id = tecnico_id;

    await ChamadosModel.atualizarStatus(id, dadosAtualizar);

    // Se resolvido, marca o equipamento como 'operacional' novamente
    if (status === 'resolvido' && chamado.equipamento_id) {
      await update('equipamentos', { status: 'operacional' }, `id = ${chamado.equipamento_id}`);
    }

    res.status(200).json({
      sucesso: true,
      mensagem: `Status do chamado atualizado para '${status}'`
    });

  } catch (error) {
    console.error('Erro ao atualizar status de um chamado: ', error);
    throw error;
  }
};

module.exports = { listar, buscarPorId, criar, atualizarStatus };
