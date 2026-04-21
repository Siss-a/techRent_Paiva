import { create, read, update, deleteRecord, comparePassword, hashPassword, getConnection } from '../config/database.js';


class chamadosModel {

    // GET /chamados - lista chamados
    //   admin/técnico -> todos os chamados
    //   cliente       -> apenas os seus (WHERE cliente_id = req.usuario.id)
    static async listar(usuario) {
        try {
            if (usuario.nivel_acesso === 'cliente') {
                return await read('chamados', `cliente_id = ${usuario.id}`);
            }

            return await read('chamados');

        } catch (error) {
            console.error('Erro ao listar os chamados');
            throw error;
        }
    }

    // GET /chamados/:id - retorna um chamado pelo ID
    static async buscarPorId(id){
        try{
            // Garantir que o ID seja tratado como número ou string segura
            const rows = await read('chamados', ` id = ${id}`);
            return rows[0] || null;

        }catch(error){
            console.error('Erro ao retornar um chamado por ID: ', error);
            throw error;
        }
    }

    
// POST /chamados - abre um novo chamado (cliente/admin)
// Body esperado: { titulo, descricao, equipamento_id, prioridade }
    static async criar(dadosChamado){
        try{

          return await create('chamados', dadosChamado)  

        }catch(error){
            console.error('Erro ao criar chamado')
             throw error;
        }
    }

    static async atualizarStatus(id,dados){
        try{
            return await update('chamados', dados, `id = ${id}`);
        }catch(error){
            console.error('Erro ao atualizar status do chamado:', error);
            throw error;
        }
    }

}

export default chamadosModel;