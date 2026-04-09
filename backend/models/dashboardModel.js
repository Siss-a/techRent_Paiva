import { create, read, update, deleteRecord, comparePassword, hashPassword, getConnection } from '../config/database.js';

class dashboardModel {
    // GET /dashboard/admin - resumo geral de chamados e equipamentos (apenas admin)
    // Usa as views: view_resumo_chamados e view_resumo_equipamentos
    static async resumoAdmin() {
        try {
            const [chamados, equipamentos] = await Promise.all([
                read('view_resumo_chamados'),
                read('view_resumo_equipamentos')
            ]);

            return { chamados, equipamentos };

        } catch (error) {
            console.error('Erro ao listar o resumo Admin')
            throw error;
        }
    }

    // GET /dashboard/tecnico - chamados abertos/em andamento (técnico/admin)
    // Usa a view: view_painel_tecnico
    static async painelTecnico() {
        try {
            return await read('view_painel_tecnico');
        } catch (error) {
            console.error('Erro ao listar o painel técnico', error);
            throw error;
        }
    }

}

export default dashboardModel;