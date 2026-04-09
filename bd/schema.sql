-- =============================================
-- TECHRENT - SISTEMA DE CHAMADOS DE TI
-- =============================================
-- Execute este arquivo antes do views.sql

CREATE DATABASE IF NOT EXISTS techrent_db;
USE techrent_db;

-- =============================================
-- 1. USUÁRIOS
-- =============================================
-- Armazena todos os perfis do sistema.
-- nivel_acesso define o que cada usuário pode fazer:
--   'cliente'  -> abre chamados
--   'tecnico'  -> atende chamados
--   'admin'    -> gerencia tudo
CREATE TABLE usuarios (
    id           INT PRIMARY KEY AUTO_INCREMENT,
    nome         VARCHAR(100)  NOT NULL,
    email        VARCHAR(100)  UNIQUE NOT NULL,
    senha        VARCHAR(255)  NOT NULL, -- sempre salvar o HASH (bcrypt), nunca a senha em texto
    nivel_acesso ENUM('cliente', 'admin', 'tecnico') DEFAULT 'cliente',
    criado_em    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. EQUIPAMENTOS
-- =============================================
-- Inventário de máquinas/dispositivos do laboratório.
-- O campo 'status' indica a condição operacional do equipamento:
--   'operacional'   -> funcionando normalmente; cliente pode abrir chamado
--   'em_manutencao' -> com chamado aberto / sendo atendido pelo técnico
--   'desativado'    -> aposentado ou descartado; fora do sistema
CREATE TABLE equipamentos (
    id          INT PRIMARY KEY AUTO_INCREMENT,
    nome        VARCHAR(100) NOT NULL,
    categoria   VARCHAR(50),              -- Ex: Notebook, Projetor, Impressora, Servidor
    patrimonio  VARCHAR(50) UNIQUE,       -- número de patrimônio (etiqueta física)
    status      ENUM('operacional', 'em_manutencao', 'desativado') DEFAULT 'operacional',
    descricao   TEXT
);

-- =============================================
-- 3. CHAMADOS
-- =============================================
-- Registro central de cada solicitação de atendimento.
-- Um chamado vincula um cliente a um equipamento com problema.
-- O campo 'tecnico_id' é preenchido quando um técnico assume o chamado.
--
-- Fluxo de status:
--   aberto -> em_atendimento -> resolvido
--                           -> cancelado
CREATE TABLE chamados (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    titulo         VARCHAR(150) NOT NULL,           -- breve descrição do problema
    descricao      TEXT,                             -- detalhes informados pelo cliente
    cliente_id     INT NOT NULL,                     -- quem abriu o chamado
    equipamento_id INT NOT NULL,                     -- equipamento com problema
    tecnico_id     INT,                              -- técnico responsável (pode ser NULL no início)
    prioridade     ENUM('baixa', 'media', 'alta') DEFAULT 'media',
    status         ENUM('aberto', 'em_atendimento', 'resolvido', 'cancelado') DEFAULT 'aberto',
    aberto_em      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Um chamado pertence a um cliente
    CONSTRAINT fk_chamado_cliente   FOREIGN KEY (cliente_id)
        REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Um chamado está vinculado a um equipamento
    CONSTRAINT fk_chamado_equip     FOREIGN KEY (equipamento_id)
        REFERENCES equipamentos(id) ON DELETE CASCADE,

    -- Um chamado pode (ou não) ter um técnico responsável
    CONSTRAINT fk_chamado_tecnico   FOREIGN KEY (tecnico_id)
        REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =============================================
-- 4. HISTÓRICO DE MANUTENÇÃO
-- =============================================
-- Cada registro descreve uma ação realizada pelo técnico
-- em um equipamento, vinculado ao chamado correspondente.
CREATE TABLE historico_manutencao (
    id             INT PRIMARY KEY AUTO_INCREMENT,
    chamado_id     INT NOT NULL,                     -- qual chamado originou o registro
    equipamento_id INT NOT NULL,
    tecnico_id     INT NOT NULL,
    descricao      TEXT NOT NULL,                    -- o que foi feito
    registrado_em  DATETIME DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_hist_chamado FOREIGN KEY (chamado_id)
        REFERENCES chamados(id) ON DELETE CASCADE,

    CONSTRAINT fk_hist_equip   FOREIGN KEY (equipamento_id)
        REFERENCES equipamentos(id) ON DELETE CASCADE,

    CONSTRAINT fk_hist_tecnico FOREIGN KEY (tecnico_id)
        REFERENCES usuarios(id)
);
