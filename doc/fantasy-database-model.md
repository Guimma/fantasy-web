# Modelo de Banco de Dados - Fantasy Futebol

Este documento descreve o modelo de dados usado no sistema de Fantasy Futebol, implementado nas planilhas do Google Sheets.

## Tabelas Principais

### ConfigSistema
- **chave**: Identificador único da configuração
- **valor**: Valor da configuração
- **descricao**: Descrição da configuração

### Usuarios
- **id_usuario**: Identificador único do usuário
- **email**: Email do usuário
- **nome**: Nome completo do usuário
- **perfil**: Perfil de acesso (admin, user)
- **data_cadastro**: Data e hora do cadastro
- **ativo**: Status de ativação (1=ativo, 0=inativo)

### Ligas
- **id_liga**: Identificador único da liga
- **nome**: Nome da liga
- **id_manager**: ID do usuário manager da liga
- **data_criacao**: Data de criação da liga
- **status**: Status da liga (em preparação, ativa, encerrada)
- **orcamento_inicial**: Orçamento inicial para cada time
- **max_jogadores_time**: Número máximo de jogadores por time
- **max_jogadores_lesionados**: Número máximo de jogadores lesionados

### Times
- **id_time**: Identificador único do time
- **id_liga**: Referência à liga
- **id_usuario**: Referência ao usuário proprietário
- **nome**: Nome do time
- **saldo**: Saldo atual do time
- **formacao_atual**: Formação atual (referência à tabela FormacoesPermitidas)
- **pontuacao_total**: Pontuação total acumulada
- **pontuacao_ultima_rodada**: Pontuação da última rodada
- **colocacao**: Posição atual na classificação

### Atletas
- **id_atleta**: Identificador único do atleta
- **id_cartola**: ID de referência no sistema Cartola
- **nome**: Nome completo do atleta
- **apelido**: Apelido do atleta
- **foto_url**: URL da foto do atleta
- **posicao**: Posição do atleta
- **posicao_abreviacao**: Abreviação da posição
- **clube**: Nome do clube
- **clube_abreviacao**: Abreviação do clube
- **preco**: Preço atual do atleta
- **media_pontos**: Média de pontos
- **jogos**: Número de jogos
- **status**: Status do atleta (Provável, Dúvida, Lesionado, etc.)
- **ultima_atualizacao**: Data da última atualização
- **data_criacao**: Data de inclusão no sistema

## Relacionamentos

O sistema utiliza chaves estrangeiras para manter a integridade referencial entre as tabelas. Por exemplo:

- Times referencia Usuarios (id_usuario) e Ligas (id_liga)
- ElencosTimes referencia Times (id_time) e Atletas (id_atleta)
- ConfigDraft referencia Ligas (id_liga)

## Manutenção de Dados

A atualização de dados é feita através do MCP (Model-Code-Prompt) configurado no projeto, que se comunica com a API do Google Sheets para ler e escrever dados. 