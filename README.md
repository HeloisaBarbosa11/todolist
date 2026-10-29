# Lista de tarefas

Projeto escolar de lista de tarefas. O frontend usa React e Vite; o backend já existente usa Fastify e MySQL.

## Requisitos

- Node.js e npm
- MySQL em execução

## Banco de dados

Inicie o serviço MySQL instalado no computador (o nome do serviço varia conforme a instalação). Configure o arquivo `backend/.env` com os dados do seu MySQL. Os nomes esperados são:

```text
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=
DB_NAME=todolist
```

Abra `backend/.env` em um editor de texto e coloque a senha que você configurou para o usuário `root` do seu MySQL depois de `DB_PASSWORD=`. Não use uma senha de exemplo nem compartilhe esse arquivo. O projeto não define uma senha no código.

Para criar o banco e a tabela, abra o PowerShell na pasta do projeto e execute:

```powershell
Get-Content .\backend\schema.sql | mysql --host=127.0.0.1 --port=3307 --user=root --password
```

O MySQL pedirá a senha do usuário `root`.

## Iniciar o backend

Em um terminal, na pasta do projeto:

```powershell
Set-Location .\backend
npm install
npm run dev
```

A API fica em `http://localhost:3333`. O backend carrega as configurações de `backend/.env` mesmo quando iniciado a partir de outra pasta.

## Iniciar o frontend

Em outro terminal, na pasta do projeto:

```powershell
Set-Location .\frontend
npm install
npm run dev
```

Abra `http://localhost:5173`. O frontend chama a API em `http://localhost:3333`.

## O que dá para fazer

- Criar, editar, concluir e excluir tarefas
- Informar uma data de vencimento opcional
- Pesquisar tarefas e filtrar todas, pendentes ou concluídas
- Ver os totais e identificar tarefas atrasadas

O backend ordena as tarefas pelas datas de vencimento, com as tarefas sem data no final.
