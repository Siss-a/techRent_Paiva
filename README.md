## TechRent - MVP de Chamados / Manutencao (TI)

Este MVP tem foco em centralizar o relato de problemas de TI, permitir que administradores gerenciem o fluxo e que tecnicos resolvam os chamados, com base no modelo de banco de dados presente em `bd/`.

> Observacao: o seu banco atual foi modelado com as tabelas e views abaixo; para o MVP de TI, alguns nomes foram mapeados conceitualmente (por exemplo, `alugueis` funciona como “chamados”).

## Stack (pretendida)

- Frontend: Next.js (App Router) + Tailwind CSS + shadcn/ui (Radix UI, Lucide, Sonner Toast)
- Backend: Node.js + Express + JWT
- Banco: MySQL

## Modelo de Dados (MySQL)

### Database

- Nome: `techrent_db`
- Scripts:
  - `bd/schema.sql` (cria o banco e as tabelas)
  - `bd/views.sql` (cria as views)

### Tabelas

`usuarios` (perfis do sistema)

- `id` (PK, AUTO_INCREMENT)
- `nome` (varchar(100), NOT NULL)
- `email` (varchar(100), UNIQUE, NOT NULL)
- `senha` (varchar(255), NOT NULL) -> armazena o hash para JWT/login
- `nivel_acesso` (ENUM: `cliente`, `admin`, `tecnico`)
- `criado_em` (TIMESTAMP, default CURRENT_TIMESTAMP)

`equipamentos` (maquinas/equipamentos dos laboratorios)

- `id` (PK, AUTO_INCREMENT)
- `nome` (varchar(100), NOT NULL)
- `categoria` (varchar(50), ex: Laptop, Projetor, Tablet)
- `preco_diaria` (decimal(10,2), NOT NULL) -> no contexto de TI, pode ser usado como “custo/impacto” para metricao
- `status` (ENUM: `disponivel`, `alugado`, `manutencao`) -> estado operacional
- `descricao` (TEXT)

`alugueis` (NO MVP: chamados/reservas de atendimento)

- `id` (PK, AUTO_INCREMENT)
- `usuario_id` (FK -> `usuarios.id`) -> quem abriu o chamado (cliente)
- `equipamento_id` (FK -> `equipamentos.id`) -> qual equipamento sera atendido
- `data_inicio` (DATE, NOT NULL) -> data de abertura
- `data_fim` (DATE, NOT NULL) -> data prevista/limite
- `valor_total` (decimal(10,2), NOT NULL) -> no contexto de TI, pode ser usado como custo estimado
- `status_reserva` (ENUM: `pendente`, `ativo`, `finalizado`, `cancelado`) -> estado do chamado
- Relacoes:
  - ON DELETE CASCADE para `usuarios` e `equipamentos`

`historico_manutencao` (NO MVP: registro do que o tecnico fez)

- `id` (PK, AUTO_INCREMENT)
- `equipamento_id` (FK -> `equipamentos.id`)
- `tecnico_id` (FK -> `usuarios.id`) -> tecnico que registrou o reparo
- `descricao_reparo` (TEXT)
- `data_manutencao` (DATETIME, default CURRENT_TIMESTAMP)

### Views

`view_equipamentos_disponiveis`

- Lista equipamentos com `equipamentos.status = 'disponivel'`

`view_painel_tecnico`

- Retorna chamados em `pendente` ou `ativo` (via `alugueis.status_reserva`)
- Inclui `aluguel_id`, `cliente`, `equipamento`, `data_inicio` e `status_reserva`
- Observacao: a view nao traz `tecnico_id` diretamente; a associacao do tecnico com a resolucao ocorre via `historico_manutencao`.

`view_resumo_admin`

- Agrupa por `equipamentos.status`
- Colunas:
  - `status`
  - `total_itens` (COUNT)
  - `potencial_receita_diaria` (SUM de `preco_diaria`)
- Observacao: por enquanto essa metricacao e feita sobre `preco_diaria`. Para TI, voce pode adaptar o significado (por exemplo custo/impacto do equipamento).

## Fluxos do MVP (mapeados ao banco)

### 1) Usuario relata um problema

Como o banco atual nao possui uma tabela chamada “chamados” explicitamente, o fluxo usa `alugueis`:

- Criar um usuario com `nivel_acesso = 'cliente'`
- Selecionar o equipamento (em geral com status `disponivel`, usando `view_equipamentos_disponiveis`)
- Inserir um registro em `alugueis` com:
  - `usuario_id` = id do usuario logado
  - `equipamento_id` = maquina afetada
  - `data_inicio` e `data_fim`
  - `valor_total` = estimativa (opcional no contexto TI)
  - `status_reserva = 'pendente'`
- Opcional (para refletir estado operacional):
  - atualizar `equipamentos.status` para `alugado` ou `manutencao` (a regra pode ser definida pela sua logica de backend)

### 2) Administrador gerencia a equipe

O banco ja diferencia `admin` e `tecnico` em `usuarios.nivel_acesso`.

Para o admin:
- Utilizar `view_resumo_admin` para metricao do parque de equipamentos por status
- Gerenciar acesso:
  - controle de quem e `admin` ou `tecnico` e feito no proprio `usuarios.nivel_acesso`

### 3) Tecnico resolve o chamado

No MVP, o tecnico:

- Visualiza chamados em execucao/abertos via `view_painel_tecnico` (status `pendente` ou `ativo`)
- Quando inicia o atendimento:
  - atualizar `alugueis.status_reserva` para `ativo` (regra do backend)
- Quando resolve:
  - inserir um registro em `historico_manutencao` com `equipamento_id`, `tecnico_id` e `descricao_reparo`
  - atualizar `alugueis.status_reserva` para `finalizado`
  - atualizar `equipamentos.status` para `disponivel` (ou outro estado definido)

## Setup do banco (local)

1. Criar a estrutura:
   - execute `bd/schema.sql`
2. Criar as views:
   - execute `bd/views.sql`

Exemplo (ordem sugerida):

```sql
-- 1) Tabelas
SOURCE bd/schema.sql;

-- 2) Views
SOURCE bd/views.sql;
```

## Observacoes e lacunas do modelo atual

1. Nao existe `tecnico_id` direto na tabela `alugueis`.
   - Se voce quiser “atribuicao” de tecnico ao chamado (para garantir que cada chamado pertence a um tecnico especifico), a modelagem atual precisa ser estendida (por exemplo, adicionar `tecnico_id` em `alugueis`).
2. O modelo foi criado com terminologia de aluguel (tabela `alugueis`) e metrica em `preco_diaria`.
   - No MVP de TI, isso funciona como adaptacao conceitual, mas pode exigir ajustes futuros de nomes/regras.

## Proximo passo (backend/contrato)

Como o `backend/` esta vazio neste workspace, o README acima descreve o “contrato” esperado do MVP em cima do banco.

Ao implementar o Express + JWT, a recomendacao e:
- Endpoints para:
  - autenticar usuarios (JWT)
  - listar/alterar `equipamentos`
  - criar/atualizar “chamados” em `alugueis`
  - registrar reparos em `historico_manutencao`
  - dashboards usando as views `view_painel_tecnico` e `view_resumo_admin`
- Regras de autorizacao por `usuarios.nivel_acesso`
