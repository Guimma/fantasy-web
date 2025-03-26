# Casos de Uso - Fantasy Futebol

Este documento descreve os principais casos de uso do sistema de Fantasy Futebol.

## 1. Gerenciamento de Usuários

### 1.1. Cadastro de Usuário
- **Ator principal**: Usuário não cadastrado
- **Descrição**: O usuário se cadastra no sistema fornecendo email, nome e senha
- **Fluxo principal**:
  1. Usuário acessa a página de cadastro
  2. Preenche formulário com dados pessoais
  3. Sistema valida os dados
  4. Sistema cria nova conta com perfil "user"
  5. Sistema envia email de confirmação

### 1.2. Login de Usuário
- **Ator principal**: Usuário cadastrado
- **Descrição**: O usuário acessa o sistema usando suas credenciais
- **Fluxo principal**:
  1. Usuário acessa a página de login
  2. Informa email e senha
  3. Sistema autentica o usuário
  4. Sistema redireciona para dashboard

## 2. Gerenciamento de Ligas

### 2.1. Criação de Liga
- **Ator principal**: Usuário (futuro manager)
- **Descrição**: Usuário cria nova liga de fantasy
- **Fluxo principal**:
  1. Usuário acessa "Criar Liga"
  2. Define nome, orçamento inicial e configurações da liga
  3. Sistema registra a liga e define o usuário como manager
  4. Liga fica em estado "Em preparação"

### 2.2. Convite de Participantes
- **Ator principal**: Manager da liga
- **Descrição**: Manager convida outros usuários para participar da liga
- **Fluxo principal**:
  1. Manager acessa "Gerenciar Liga" > "Convidar"
  2. Informa emails dos convidados
  3. Sistema envia convites
  4. Convidados aceitam via email ou dentro do sistema

## 3. Draft e Mercado

### 3.1. Configuração de Draft
- **Ator principal**: Manager da liga
- **Descrição**: Manager configura o processo de draft
- **Fluxo principal**:
  1. Manager define data/hora do draft
  2. Configura tempo por escolha
  3. Define ordem do draft (aleatória, invertida por rodada, etc.)
  4. Sistema registra configurações

### 3.2. Realização do Draft
- **Ator principal**: Participantes da liga
- **Descrição**: Participantes escolhem atletas em turnos
- **Fluxo principal**:
  1. No horário definido, sistema abre interface de draft
  2. Cada participante escolhe um atleta em seu turno
  3. Sistema registra escolha e passa ao próximo participante
  4. Processo continua até completar todas as rodadas

### 3.3. Mercado de Transferências
- **Ator principal**: Participantes da liga
- **Descrição**: Participantes negociam atletas após o draft
- **Fluxo principal**:
  1. Participante faz proposta para atleta de outro time
  2. Proprietário recebe notificação
  3. Proprietário aceita ou recusa
  4. Se aceita, sistema transfere atleta entre times

## 4. Gerenciamento de Times

### 4.1. Configuração de Escalação
- **Ator principal**: Dono do time
- **Descrição**: Usuário configura escalação semanal
- **Fluxo principal**:
  1. Usuário acessa "Meu Time" > "Escalação"
  2. Seleciona formação tática
  3. Escolhe atletas para cada posição
  4. Sistema valida escalação conforme regras da liga
  5. Sistema salva escalação para próxima rodada

## 5. Pontuação e Relatórios

### 5.1. Atualização de Pontuação
- **Ator principal**: Sistema
- **Descrição**: Sistema atualiza pontuação baseada em eventos reais
- **Fluxo principal**:
  1. Após jogos, sistema recebe dados de desempenho
  2. Calcula pontuação de cada atleta
  3. Atualiza pontuação dos times
  4. Atualiza classificação da liga

### 5.2. Visualização de Estatísticas
- **Ator principal**: Participantes
- **Descrição**: Usuários visualizam estatísticas e relatórios
- **Fluxo principal**:
  1. Usuário acessa "Estatísticas"
  2. Seleciona tipo de relatório (por atleta, por time, por rodada)
  3. Sistema exibe dados solicitados 