import { create, read, update, deleteRecord, getConnection } from '../config/database.js';

class equipamentosModel {

    static async listar() {
        try {
            return await read('equipamentos');
        } catch (error) {
            console.error('Erro ao listar equipamentos:', error);
            throw error;
        }
    }

    static async buscarPorId(id) {
        try {
            const idLimpo = parseInt(id);
            const rows = await read('equipamentos', `id = ${idLimpo}`);
            return rows[0] || null;
        } catch (error) {
            console.error('Erro ao retornar um equipamento por ID:', error);
            throw error;
        }
    }

    // FIX: método que estava sendo chamado mas não existia
    static async buscarPorPatrimonio(patrimonio) {
        try {
            const rows = await read('equipamentos', `patrimonio = '${patrimonio}'`);
            return rows[0] || null;
        } catch (error) {
            console.error('Erro ao buscar equipamento por patrimônio:', error);
            throw error;
        }
    }

    static async criar(dadosEquipamentos) {
        try {
            const dadosTratados = {
                nome: dadosEquipamentos.nome,
                categoria: dadosEquipamentos.categoria,
                patrimonio: dadosEquipamentos.patrimonio,
                status: dadosEquipamentos.status,
                descricao: dadosEquipamentos.descricao
            };
            return await create('equipamentos', dadosTratados);
        } catch (error) {
            console.error('Erro ao criar um equipamento:', error);
            throw error;
        }
    }

    static async atualizar(id, dadosEquipamento) {
        try {
            return await update('equipamentos', dadosEquipamento, `id = ${id}`);
        } catch (error) {
            console.error('Erro ao editar um equipamento:', error);
            throw error;
        }
    }

    static async remover(id) {
        try {
            return await deleteRecord('equipamentos', `id = ${id}`);
        } catch (error) {
            console.error('Erro ao remover um equipamento:', error);
            throw error;
        }
    }
}

export default equipamentosModel;