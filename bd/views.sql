-- =============================================
-- TECHRENT - VIEWS DO SISTEMA DE CHAMADOS
-- =============================================
-- Execute este arquivo APÓS o schema.sql

USE techrent_db;

-- =============================================
-- VIEW 1: EQUIPAMENTOS OPERACIONAIS
-- =============================================
-- Usada ao abrir um novo chamado.
-- Mostra apenas equipamentos com status 'operacional'
-- (ou seja, que ainda não têm um chamado em andamento).
CREATE VIEW view_equipamentos_operacionais AS
SELECT
    id,
    nome,
    categoria,
    patrimonio,
    descricao
FROM equipamentos
WHERE status = 'operacional';


-- =============================================
-- VIEW 2: PAINEL DO TÉCNICO
-- =============================================
-- Lista os chamados que precisam de atenção:
-- status 'aberto' ou 'em_atendimento'.
-- Inclui nome do solicitante, equipamento e técnico responsável (se já atribuído).
CREATE VIEW view_painel_tecnico AS
SELECT
    c.id              AS chamado_id,
    c.titulo,
    c.prioridade,
    c.status,
    u_cliente.nome    AS solicitante,
    e.nome            AS equipamento,
    e.categoria,
    e.patrimonio,
    u_tec.nome        AS tecnico_responsavel,  -- NULL se ainda não atribuído
    c.aberto_em,
    c.atualizado_em
FROM chamados c
JOIN usuarios     u_cliente ON c.cliente_id     = u_cliente.id
JOIN equipamentos e          ON c.equipamento_id = e.id
LEFT JOIN usuarios u_tec     ON c.tecnico_id     = u_tec.id  -- LEFT JOIN: técnico pode ser NULL
WHERE c.status IN ('aberto', 'em_atendimento')
ORDER BY
    FIELD(c.prioridade, 'alta', 'media', 'baixa'),  -- urgentes primeiro
    c.aberto_em ASC;                                 -- mais antigos primeiro (mesma prioridade)


-- =============================================
-- VIEW 3: RESUMO DO ADMINISTRADOR
-- =============================================

-- 3a. Total de chamados agrupados por status
CREATE VIEW view_resumo_chamados AS
SELECT
    status,
    COUNT(*) AS total
FROM chamados
GROUP BY status;

-- 3b. Total de equipamentos agrupados por status operacional
CREATE VIEW view_resumo_equipamentos AS
SELECT
    status,
    COUNT(*) AS total
FROM equipamentos
GROUP BY status;
