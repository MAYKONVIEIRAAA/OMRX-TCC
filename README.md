# OMRX-TCC

### Para rodar o projeto na sua maquina

- Clone o projeto em sua maquina:
````git clone https://github.com/OMRX-TCC/OMRX-TCC.git```

- Dentro da pasta clonada do projeto, em seu terminal, rode:
```npm install```

- Configure as variaveis de ambiente de acordo com o seu ambiente, use como exemplo o `.env_example`
- Ao final para iniciar o servidor, use `npm start`

## Front-end

Para rodar as ferramentas do front-end, entre na pasta frontend e instale as dependências.

```
cd frontend
npm install
````

Comandos disponíveis dentro da pasta frontend.

````
npm run lint         verifica erros e más práticas no código
npm run lint:fix      corrige automaticamente o que for possível
npm run format        formata o código seguindo as regras do .prettierrc
npm run format:check  confere se o código já está formatado, sem alterar nada
````