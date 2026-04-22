import { create, read, update, deleteRecord, getConnection } from '../config/database.js';

class chamadosModel {

    static async listar(usuario) {
        try {
            if (usuario.nivel_acesso === 'cliente') {
                return await read('chamados', `cliente_id = ${usuario.id}`);
            }
            return await read('chamados');
        } catch (error) {
            console.error('Erro ao listar os chamados:', error);
            throw error;
        }
    }

    static async buscarPorId(id) {
        try {
            const rows = await read('chamados', `id = ${id}`);
            return rows[0] || null;
        } catch (error) {
            console.error('Erro ao retornar um chamado por ID:', error);
            throw error;
        }
    }

    // FIX: método que estava sendo chamado em equipamentosController mas não existia
    static async buscarPorEquipamento(equipamento_id) {
        try {
            const rows = await read('chamados', `equipamento_id = ${equipamento_id} LIMIT 1`);
            return rows[0] || null;
        } catch (error) {
            console.error('Erro ao buscar chamado por equipamento:', error);
            throw error;
        }
    }

    static async criar(dadosChamado) {
        try {
            return await create('chamados', dadosChamado);
        } catch (error) {
            console.error('Erro ao criar chamado:', error);
            throw error;
        }
    }

    static async atualizarStatus(id, dados) {
        try {
            return await update('chamados', dados, `id = ${id}`);
        } catch (error) {
            console.error('Erro ao atualizar status do chamado:', error);
            throw error;
        }
    }
}

export default chamadosModel;