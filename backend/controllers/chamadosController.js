// =============================================
// CONTROLLER DE CHAMADOS
// =============================================
// Fluxo de status:
//   aberto -> em_atendimento -> resolvido
//                           -> cancelado

import chamadosModel from '../models/chamadosModel.js';
import { update, deleteRecord } from '../config/database.js';

// GET /chamados - lista chamados
//   admin/técnico -> todos os chamados
//   cliente       -> apenas os seus (WHERE cliente_id = req.usuario.id)
const listar = async (req, res) => {
  try {
    const usuario = req.usuario;
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
  try {
    const { titulo, descricao, equipamento_id, prioridade } = req.body;
    const cliente_id = req.usuario.id;

    if (!titulo || !equipamento_id) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Campos obrigatórios: titulo, equipamento_id'
      });
    }

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
    };

    const novoId = await chamadosModel.criar(dadosChamado);

    await update('equipamentos', { status: 'em_manutencao' }, `id = ${equipamento_id}`);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Chamado criado com sucesso',
      dados: {
        id: novoId,
        titulo,
        descricao,
        equipamento_id,
        prioridade: dadosChamado.prioridade,
        status: dadosChamado.status,
        cliente_id,
        aberto_em: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro ao criar um novo chamado: ', error.message);

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        sucesso: false,
        erro: 'O ID do equipamento informado não existe no sistema.'
      });
    }

    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor ao criar chamado.'
    });
  }
};

// PUT /chamados/:id - atualização geral do chamado (técnico/admin)
// Body esperado: { titulo, descricao, prioridade, status, equipamento_id }
const atualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descricao, prioridade, status, equipamento_id } = req.body;

    const chamado = await chamadosModel.buscarPorId(id);
    if (!chamado) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Chamado não encontrado'
      });
    }

    const dadosAtualizar = {};
    if (titulo !== undefined) dadosAtualizar.titulo = titulo;
    if (descricao !== undefined) dadosAtualizar.descricao = descricao;
    if (prioridade !== undefined) dadosAtualizar.prioridade = prioridade;
    if (status !== undefined) dadosAtualizar.status = status;
    if (equipamento_id !== undefined) dadosAtualizar.equipamento_id = equipamento_id;

    if (Object.keys(dadosAtualizar).length === 0) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nenhum campo para atualizar foi fornecido.'
      });
    }

    await chamadosModel.atualizarStatus(id, dadosAtualizar);

    // Se status mudou para resolvido, libera o equipamento
    if (status === 'resolvido' && chamado.equipamento_id) {
      await update('equipamentos', { status: 'operacional' }, `id = ${chamado.equipamento_id}`);
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Chamado atualizado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar chamado:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao atualizar chamado'
    });
  }
};

// PUT /chamados/:id/status - atualiza apenas o status (técnico/admin)
// Body esperado: { status, tecnico_id (opcional) }
const atualizarStatus = async (req, res) => {
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

    const chamado = await chamadosModel.buscarPorId(id);
    if (!chamado) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Chamado não encontrado'
      });
    }

    const dadosAtualizar = { status };
    if (tecnico_id) dadosAtualizar.tecnico_id = tecnico_id;

    await chamadosModel.atualizarStatus(id, dadosAtualizar);

    if (status === 'resolvido' && chamado.equipamento_id) {
      await update('equipamentos', { status: 'operacional' }, `id = ${chamado.equipamento_id}`);
    }

    res.status(200).json({
      sucesso: true,
      mensagem: `Status do chamado atualizado para '${status}'`
    });

  } catch (error) {
    console.error('Erro ao atualizar status de um chamado: ', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao atualizar status'
    });
  }
};

// DELETE /chamados/:id - remove um chamado (admin)
const remover = async (req, res) => {
  try {
    const { id } = req.params;

    const chamado = await chamadosModel.buscarPorId(id);
    if (!chamado) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Chamado não encontrado'
      });
    }

    // Se o chamado estava em andamento, libera o equipamento
    if (['aberto', 'em_atendimento'].includes(chamado.status) && chamado.equipamento_id) {
      await update('equipamentos', { status: 'operacional' }, `id = ${chamado.equipamento_id}`);
    }

    await deleteRecord('chamados', `id = ${id}`);

    res.status(200).json({
      sucesso: true,
      mensagem: 'Chamado removido com sucesso'
    });

  } catch (error) {
    console.error('Erro ao remover chamado:', error);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao remover chamado'
    });
  }
};

export default { listar, buscarPorId, criar, atualizar, atualizarStatus, remover };