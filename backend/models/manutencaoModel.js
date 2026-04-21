import { create, read, update, deleteRecord, comparePassword, hashPassword, getConnection } from '../config/database.js';


class manutencaoModel {
    static async listar() {
        try {
            return await read('historico_manutencao');
        } catch (error) {
            console.error('Erro ao listar manutenções:', error);
            throw error;
        }
    }

    static async registrar(dadosManutencao) {
        try {
            // Garantir que a data de registro seja inserida se não enviada
            const dadosComData = {
                ...dadosManutencao,
                registrado_em: dadosManutencao.registrado_em || new Date()
            };

            return await create('historico_manutencao', dadosComData);
        } catch (error) {
            console.error('Erro ao registrar manutenção:', error);
            throw error;
        }
    }


}

export default manutencaoModel;