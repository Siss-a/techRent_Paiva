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

    static async registrar(dadosManutencao){
        try{

          return await create('historico_manutencao', `id = ${id}` )  

        }catch(error){
            cconsole.error('Erro ao registrar manutenção:', error);
            throw error;
        }
    }
    

}

export default manutencaoModel;