//O campo 'patrimonio' deve ser único e o 'status' deve seguir o ENUM: operacional, em_manutencao, desativado.
import { create, read, update, deleteRecord, comparePassword, hashPassword, getConnection } from '../config/database.js';

class equipamentosModel {

    // GET /equipamentos - lista todos os equipamentos do inventário
    static async listar() {
        try {
            return await read('equipamentos');

        } catch (error) {
            console.error('Erro ao listar equipamentos: ', error);
            throw error;
        }
    }

    // GET /equipamentos/:id - retorna um equipamento pelo ID
    static async buscarPorId(id) {
        try {
            const idLimpo = parseInt(id);
            const rows = await read('equipamentos', `id = ${idLimpo}`);
            return rows[0] || null;

        } catch (error) {
            console.error('Erro ao retornar um equipamento por ID: ', error);
            throw error;
        }
    }

    // POST /equipamentos - cria um novo equipamento (apenas admin)
    static async criar(dadosEquipamentos) {
        try {

            const dadosTratados = {
                nome: dadosEquipamentos.nome,
                categoria: dadosEquipamentos.categoria,
                patrimonio: dadosEquipamentos.patrimonio,
                status: dadosEquipamentos.status,
                descricao: dadosEquipamentos.descricao
            }

            return await create('equipamentos', dadosTratados)

        } catch (error) {
            console.error('Erro ao criar um equipamento');
            throw error;
        }
    }

    // PUT /equipamentos/:id - atualiza um equipamento (apenas admin)
    static async atualizar(id, dadosEquipamento) {
        try {

            return await update('equipamentos', dadosEquipamento, `id = ${id}`);

        } catch (error) {
            console.error('Erro ao editar um equipamento');
            throw error;
        }
    }

    // DELETE /equipamentos/:id - remove um equipamento (apenas admin)
    static async remover(id) {
        try {

            return await deleteRecord('equipamentos', `id = ${id}`)

        } catch (error) {
            console.error('Erro ao rmeover um equipamento');
            throw error;
        }
    }
}

export default equipamentosModel;