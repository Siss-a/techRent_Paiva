// =============================================
// CONTROLLER DE EQUIPAMENTOS
// =============================================
// TODO (alunos): implementar cada função abaixo.
// Cada função recebe (req, res) e deve retornar uma resposta JSON.

import equipamentosModel from '../models/equipamentosModel.js';

// GET /equipamentos - lista todos os equipamentos do inventário
const listar = async (req, res) => {
  try {

    //VALIDAÇÕES
    if (nome && nome.length < 3) {
      return res.status(400).json({ sucesso: false, erro: 'Nome do equipamento muito curto' });
    }

    if (patrimonio && patrimonio.toString().length < 4) {
      return res.status(400).json({ sucesso: false, erro: 'Patrimônio inválido ou muito curto' });
    }
    //FIM VALIDAÇÕES

    const equipamentos = await equipamentosModel.listar();

    res.status(200).json({
      sucesso: true,
      dados: equipamentos
    });

  } catch (error) {
    console.error('Erro ao listar equipamentos:', error);
    throw error;
  }

};

// GET /equipamentos/:id - retorna um equipamento pelo ID
const buscarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const equipamentoEspecifico = await equipamentosModel.buscarPorId(id);

    if (!equipamentoEspecifico) {
      return res.status(404).json({
        sucesso: false,
        error: 'Equipamento não encontrado'
      });
    }

    res.status(200).json({
      sucesso: true,
      dados: equipamentoEspecifico
    });

  } catch (error) {
    console.error('Erro ao listar equipamentos por id: ', error);
    throw error;
  }
};

// POST /equipamentos - cria um novo equipamento (apenas admin)
const criar = async (req, res) => {
  try {

    const { nome, categoria, patrimonio, status, descricao } = req.body;

    //VALIDAÇÕES

    const statusValidos = ['operacional', 'em_manutencao', 'desativado'];

    if (status && !statusValidos.includes(status)) {
      return res.status(400).json({
        erro: 'Status inválido'
      });
    }

    //FIM VALIDAÇÕES

    const dadosEquipamentos = {
      nome: nome,
      categoria: categoria,
      patrimonio: patrimonio,
      status: status || 'operacional',
      descricao: descricao || null,
    }

    const equipamentoCriado = await equipamentosModel.criar(dadosEquipamentos);

    res.status(201).json({
      sucesso: true,
      mensagem: 'Equipamento criado com sucesso',
      dados: {
        id: equipamentoCriado,
        nome,
        categoria,
        patrimonio,
        status: dadosEquipamentos.status,
        descricao,
      }
    });

  } catch (error) {
    console.error('Erro ao criar equipamentos: ', error);
    throw error;
  }
};

// PUT /equipamentos/:id - atualiza um equipamento (apenas admin)
const atualizar = async (req, res) => {
  try {

    const { id } = req.params;
    const { nome, categoria, patrimonio, status, descricao } = req.body;

    //validacoes
    if (nome && nome.length < 3) {
      return res.status(400).json({ sucesso: false, erro: 'Nome do equipamento muito curto' });
    }

    if (patrimonio && patrimonio.toString().length < 4) {
      return res.status(400).json({ sucesso: false, erro: 'Patrimônio inválido ou muito curto' });
    }
    //fim validacoes
    const dadosAtualizacao = {};

    if (nome) dadosAtualizacao.nome = nome;
    if (categoria) dadosAtualizacao.categoria = categoria;
    if (patrimonio) dadosAtualizacao.patrimonio = patrimonio;
    if (status) dadosAtualizacao.status = status;
    if (descricao) dadosAtualizacao.descricao = descricao;


    // Verificar se há dados para atualizar
    if (Object.keys(dadosAtualizacao).length === 0) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Nenhum dado para atualizar',
        mensagem: 'Forneça pelo menos um campo para atualizar'
      });
    }

    const resultado = await equipamentosModel.atualizar(id, dadosAtualizacao);

    res.status(200).json({
      sucesso: true,
      mensagem: 'Equipamento atualizado com sucesso',
      dados: {
        linhasAfetadas: resultado || 1
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar as informações de um equipamento', error);
    throw error;
  }
};

// DELETE /equipamentos/:id - remove um equipamento (apenas admin)
const remover = async (req, res) => {
  try {

    const { id } = req.params;

    const chamadoVinculado = await chamadosModel.buscarPorEquipamento(id);
    if (chamadoVinculado) {
      return res.status(400).json({
        sucesso: false,
        erro: 'Não é possível remover: este equipamento possui históricos de chamados.',
      });
    }

    const equipamento = await equipamentosModel.buscarPorId(id);
    if (!equipamento) {
      return res.status(404).json({ sucesso: false, erro: 'Equipamento não encontrado' });
    }

    if (equipamento.status === 'em_manutencao') {
      return res.status(400).json({
        sucesso: false,
        erro: 'Equipamento em manutenção não pode ser excluído do sistema.'
      });
    }

    const resultado = await equipamentosModel.remover(id);

    res.status(200).json({
      sucesso: true,
      mensagem: 'Equipamento excluído com sucesso',
      dados: {
        linhasAfetadas: resultado || 1
      }
    });

  } catch (error) {
    console.error('Erro ao remover um equipamento', error);
    throw error;
  }
};

export default { listar, buscarPorId, criar, atualizar, remover };
