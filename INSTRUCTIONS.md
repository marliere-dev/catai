# INSTRUCTIONS.md

## Projeto

Nome do projeto: **Cataí**

O Cataí é um aplicativo gratuito e open source para conectar estabelecimentos que possuem recicláveis disponíveis com catadores que desejam coletar esses materiais.

O objetivo do MVP é validar o fluxo básico de coleta, sem monetização, sem pagamentos, sem marketplace de compra e venda e sem complexidade operacional desnecessária.

---

## Princípios do projeto

1. Simplicidade acima de sofisticação.
2. Baixo custo operacional.
3. Código fácil de entender para contributors iniciantes.
4. TypeScript em toda a base possível.
5. Testes antes ou junto da implementação.
6. Evitar abstrações prematuras.
7. Manter o escopo do MVP enxuto.
8. Segurança e privacidade desde o início.
9. Não criar features fora do escopo sem necessidade clara.
10. Toda regra de negócio importante deve estar coberta por testes.

---

## Stack definida

### Mobile

- Expo
- React Native
- TypeScript

### Backend

- NestJS
- TypeScript
- TypeORM
- PostgreSQL

### Autenticação

- Firebase Auth
- Login por e-mail/senha
- E-mail validado

### Imagens

- Cloudflare R2
- PostgreSQL salva apenas a referência da imagem, nunca o arquivo em si

### Mapa

- OpenStreetMap/MapLibre, se viável
- Alternativamente, mapa simples no app

### Navegação

- O app deve abrir navegação externa:
  - Google Maps
  - Waze
  - Apple Maps

O MVP não deve implementar navegação própria dentro do aplicativo.

---

## Escopo do MVP

### Perfis de usuário

Existem dois perfis principais:

#### 1. Dono de reciclável

Representa quem cria solicitações de coleta.

Exemplos:

- Bar
- Restaurante
- Loja
- Mercado
- Escritório
- Pequeno comércio
- Estabelecimento com recicláveis disponíveis

#### 2. Catador

Representa quem visualiza solicitações disponíveis, reserva uma solicitação e realiza a coleta.

---

## Cadastro e autenticação

### Cadastro obrigatório

Todos os usuários devem ter:

- Nome
- E-mail
- Senha
- Tipo de perfil

### Não solicitar no MVP

- CPF
- Endereço fixo
- Documentos
- Dados empresariais completos
- Dados bancários
- Telefone obrigatório
- Pagamento

### Validação

O e-mail deve ser validado pelo Firebase Auth antes de permitir uso completo do app.

O backend deve validar o token do Firebase em todas as rotas protegidas.

---

## Localização

A localização pertence à solicitação, não ao usuário.

Não deve existir endereço fixo na conta do usuário no MVP.

Ao criar uma solicitação, o usuário informa a localização do material reciclável.

A localização da solicitação deve conter:

- Latitude
- Longitude
- Texto opcional de referência

Exemplo de referência:

> Retirar nos fundos do bar, próximo ao portão azul.

---

## Solicitação de coleta

A solicitação é a entidade central do sistema.

### Campos mínimos

- ID
- Usuário criador
- Tipo de reciclável
- Quantidade aproximada
- Observação opcional
- Latitude
- Longitude
- Referência de localização opcional
- Imagem opcional ou obrigatória, conforme decisão de produto
- Status
- Catador reservado, se houver
- Data de criação
- Data de atualização
- Data limite da reserva, se houver

### Tipos de reciclável iniciais

Manter simples no MVP:

- Alumínio
- Papelão
- Plástico
- Vidro
- Metal
- Óleo de cozinha
- Eletrônico pequeno
- Misto

Evitar categorias complexas no MVP.

### Quantidade aproximada

Usar categorias simples:

- Pequena
- Média
- Grande

Não solicitar peso em kg no MVP.

---

## Status da solicitação

Usar status claros e previsíveis:

- OPEN
- RESERVED
- COMPLETED
- CANCELLED
- EXPIRED

### Regras

#### OPEN

Solicitação criada e disponível para catadores.

#### RESERVED

Solicitação aceita por um catador.

Deve armazenar:

- ID do catador
- Data/hora limite da reserva

#### COMPLETED

Solicitação coletada com sucesso.

Apenas o catador que reservou ou o criador da solicitação pode marcar como concluída, conforme regra definida na implementação.

#### CANCELLED

Solicitação cancelada pelo criador.

#### EXPIRED

Solicitação expirada automaticamente.

---

## Reserva de solicitação

Quando um catador aceitar uma solicitação:

1. A solicitação muda de OPEN para RESERVED.
2. O ID do catador é salvo.
3. Um prazo de reserva é definido.
4. A solicitação não deve poder ser reservada por outro catador enquanto estiver ativa.
5. Se o prazo expirar, a solicitação pode voltar para OPEN ou ir para EXPIRED, conforme regra definida.

Para o MVP, preferir:

- Reserva com duração limitada
- Expiração automática
- Regras simples

---

## Imagens

As imagens devem ser armazenadas no Cloudflare R2.

O banco deve salvar apenas:

- image_key
- image_url ou caminho público/assinado
- metadata relevante, se necessário

### Regras para o MVP

- No máximo 1 imagem por solicitação
- Imagem comprimida antes do upload, preferencialmente no app
- Formato WebP ou JPEG
- Tamanho máximo recomendado: 500 KB
- Imagens de solicitações antigas devem poder ser removidas futuramente

Não salvar imagens diretamente no PostgreSQL.

---

## Backend

### Módulos esperados

Organizar o backend em módulos simples:

- AuthModule
- UsersModule
- RequestsModule
- StorageModule
- LocationModule
- HealthModule

### AuthModule

Responsável por:

- Validar token do Firebase
- Extrair o Firebase UID
- Proteger rotas
- Garantir que o usuário existe no banco interno

### UsersModule

Responsável por:

- Criar perfil interno do usuário
- Buscar perfil atual
- Editar dados básicos
- Definir tipo de perfil
- Desativar conta, se necessário

### RequestsModule

Responsável por:

- Criar solicitação
- Listar minhas solicitações
- Listar solicitações disponíveis
- Buscar solicitações próximas
- Reservar solicitação
- Concluir solicitação
- Cancelar solicitação
- Expirar solicitação

### StorageModule

Responsável por:

- Integrar com Cloudflare R2
- Gerar upload
- Validar limites
- Salvar referência da imagem
- Remover imagem quando necessário

### LocationModule

Responsável por:

- Validar latitude e longitude
- Calcular distância aproximada
- Filtrar pedidos próximos
- Ordenar por proximidade, se necessário

### HealthModule

Responsável por:

- Endpoint simples de saúde da API
- Verificação básica de disponibilidade

---

## Mobile

### Perfil: Dono de reciclável

A experiência deve ser extremamente simples.

Tela principal com dois botões:

1. Nova solicitação
2. Minhas solicitações

### Nova solicitação

Formulário simples contendo:

- Tipo de reciclável
- Quantidade aproximada
- Observação opcional
- Foto
- Localização no mapa

Não pedir endereço fixo no cadastro.

### Minhas solicitações

Listar solicitações criadas pelo usuário com status:

- Aberta
- Reservada
- Concluída
- Cancelada
- Expirada

---

### Perfil: Catador

Telas principais:

1. Lista de pedidos
2. Mapa
3. Perfil/configurações

### Lista de pedidos

Exibir solicitações disponíveis próximas.

Cada item deve mostrar:

- Tipo de reciclável
- Quantidade aproximada
- Distância aproximada
- Status
- Imagem, se houver
- Botão para aceitar

### Mapa

Exibir pontos disponíveis.

Ao aceitar uma solicitação, permitir abrir rota externa no app de navegação do celular.

### Perfil/configurações

Manter simples:

- Nome
- E-mail
- Tipo de perfil
- Sair da conta

---

## Fora do escopo do MVP

Não implementar no MVP:

- Pagamentos
- Preço por kg
- Carteira digital
- Chat interno
- Marketplace com sucateiros
- CPF
- Verificação documental
- Ranking complexo
- Gamificação
- IA
- Rota otimizada própria
- Agendamento recorrente
- Postagem pública de recicláveis na rua por qualquer pessoa
- Painel administrativo complexo

---

## Metodologia de desenvolvimento

O projeto deve seguir TDD sempre que possível.

### Ciclo TDD

1. Escrever o teste primeiro.
2. Rodar o teste e confirmar que falha.
3. Implementar o mínimo necessário para passar.
4. Rodar os testes novamente.
5. Refatorar mantendo os testes passando.

### Regra

Nenhuma regra de negócio importante deve ser implementada sem teste.

Exemplos de regras que precisam de teste:

- Usuário não autenticado não acessa rota protegida.
- Usuário só pode criar solicitação se tiver e-mail validado.
- Catador só pode reservar solicitação OPEN.
- Solicitação RESERVED não pode ser reservada por outro catador.
- Apenas o criador pode cancelar sua solicitação.
- Apenas catador reservado pode concluir a solicitação.
- Solicitação expirada não pode ser reservada.
- Imagem acima do limite deve ser rejeitada.
- Localização inválida deve ser rejeitada.

---

## Tipos de teste

### Backend

Usar:

- Testes unitários para services
- Testes de integração para controllers e banco
- Testes e2e para fluxos principais

Fluxos e2e mínimos:

1. Criar usuário interno após autenticação Firebase mockada.
2. Criar solicitação.
3. Catador listar solicitações disponíveis.
4. Catador reservar solicitação.
5. Catador concluir solicitação.
6. Criador listar suas solicitações.
7. Criador cancelar solicitação aberta.

### Mobile

Usar testes para:

- Componentes importantes
- Validação de formulário
- Fluxos principais de tela
- Estados de loading, erro e vazio

Não exagerar em testes visuais no MVP.

Priorizar fluxo e regra.

---

## Agentes de qualidade

Durante o desenvolvimento, usar agentes ou papéis separados para revisar o projeto.

Mesmo que seja uma única IA executando, ela deve simular os seguintes papéis antes de concluir tarefas relevantes.

### 1. Agente de Produto

Responsável por verificar:

- A feature pertence ao MVP?
- A feature adiciona complexidade desnecessária?
- O fluxo continua simples para o usuário?
- A implementação respeita a ideia do Cataí?

### 2. Agente de Backend

Responsável por verificar:

- Regras de negócio estão no backend?
- Permissões estão corretas?
- Services estão simples?
- Controllers não têm regra complexa?
- Banco está modelado de forma clara?

### 3. Agente de Segurança

Responsável por verificar:

- Rotas protegidas validam autenticação?
- Usuário só acessa o que deve acessar?
- Tokens do Firebase são validados corretamente?
- Upload de imagem tem limite?
- Dados sensíveis não são expostos?
- Endereços/localizações são usados apenas quando necessário?

### 4. Agente de Testes

Responsável por verificar:

- Existe teste para a regra criada?
- Teste falha antes da implementação?
- Casos de erro foram cobertos?
- Fluxos principais têm teste e2e?
- Não há teste frágil ou inútil?

### 5. Agente de Simplicidade

Responsável por verificar:

- O código está fácil de entender?
- Há abstração desnecessária?
- Dá para um contributor iniciante entender?
- A solução poderia ser mais direta?
- Há dependência desnecessária?

### 6. Agente de Custo

Responsável por verificar:

- A feature pode gerar custo inesperado?
- Uploads estão limitados?
- Imagens estão comprimidas?
- Recursos externos são usados com moderação?
- Existe risco de abuso?

---

## Checklist obrigatório antes de finalizar uma tarefa

Antes de considerar uma tarefa concluída, verificar:

- A feature está no escopo do MVP.
- O código compila.
- Os testes passam.
- Há testes para a regra principal.
- Não há dados sensíveis desnecessários.
- Não há dependência desnecessária.
- Não há custo externo descontrolado.
- A implementação é simples.
- O comportamento de erro foi considerado.
- O README ou documentação foi atualizado se necessário.

---

## Convenções de código

### Linguagem

Usar TypeScript.

### Clareza

Priorizar código explícito e legível.

Evitar:

- Abstrações prematuras
- Herança desnecessária
- Helpers genéricos sem necessidade
- Código mágico
- Overengineering

### Comentários

Evitar comentários desnecessários.

O código deve ser autoexplicativo por nomes claros de funções, variáveis e módulos.

### Nomes

Preferir nomes em inglês no código:

- User
- CollectionRequest
- Collector
- RequestStatus
- StorageService

No app, exibir textos em português.

---

## Convenções de API

Usar REST simples no MVP.

Exemplos de endpoints esperados:

- GET /health
- GET /me
- PATCH /me
- POST /requests
- GET /requests/my
- GET /requests/available
- GET /requests/:id
- POST /requests/:id/reserve
- POST /requests/:id/complete
- POST /requests/:id/cancel

Evitar GraphQL no MVP.

---

## Banco de dados

### Entidades principais

#### users

Representa o usuário interno do Cataí.

Campos esperados:

- id
- firebase_uid
- name
- email
- role
- created_at
- updated_at
- disabled_at

#### collection_requests

Representa uma solicitação de coleta.

Campos esperados:

- id
- created_by_user_id
- reserved_by_user_id
- material_type
- quantity_estimate
- notes
- latitude
- longitude
- location_reference
- status
- reserved_until
- completed_at
- cancelled_at
- expired_at
- created_at
- updated_at

#### request_images

Representa a imagem de uma solicitação.

Campos esperados:

- id
- request_id
- image_key
- image_url
- content_type
- size_bytes
- created_at

No MVP, pode haver no máximo uma imagem por solicitação.

---

## Segurança e privacidade

Não coletar dados que não são necessários.

No MVP, não coletar:

- CPF
- RG
- Endereço fixo
- Dados bancários
- Dados empresariais completos

A localização deve ser usada apenas para a solicitação de coleta.

O backend deve impedir:

- Catador concluir solicitação de outro catador
- Usuário cancelar solicitação de outro usuário
- Reserva duplicada
- Upload sem autenticação
- Upload acima do limite
- Acesso a dados privados sem permissão

---

## Política de custo

O projeto deve evitar custos recorrentes sempre que possível.

### Firebase

Usar apenas para autenticação.

Não usar:

- Firestore
- Realtime Database
- Storage
- SMS

### Cloudflare R2

Usar apenas para imagens das solicitações.

Aplicar limites:

- 1 imagem por solicitação
- máximo 500 KB
- compressão no app
- limpeza futura de imagens antigas

### Banco

Usar PostgreSQL.

Não salvar imagens no banco.

---

## Critérios de aceite do MVP

O MVP está funcional quando:

1. Usuário consegue criar conta com e-mail/senha.
2. Usuário consegue validar e-mail.
3. Usuário escolhe perfil.
4. Dono de reciclável consegue criar solicitação com localização e imagem.
5. Dono de reciclável consegue ver suas solicitações.
6. Catador consegue ver solicitações disponíveis.
7. Catador consegue reservar uma solicitação.
8. Catador consegue abrir rota externa até o local.
9. Catador consegue marcar como concluída.
10. Criador consegue cancelar solicitação aberta.
11. Backend protege rotas e permissões.
12. Testes principais passam.

---

## Regra final

Sempre que houver dúvida entre uma solução simples e uma solução sofisticada, escolher a simples.

O objetivo inicial não é construir a plataforma definitiva.

O objetivo inicial é validar se estabelecimentos criam solicitações e catadores usam essas solicitações para coletar recicláveis.
