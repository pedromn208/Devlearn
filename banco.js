const sqlite3 = require("sqlite3").verbose();

// Cria ou abre o banco de dados
const banco = new sqlite3.Database("./banco.db", (erro) => {
    if (erro) {
        console.error("Erro ao abrir o banco:", erro.message);
    } else {
        console.log("Banco de dados conectado!");
    }
});

// Cria a tabela de usuários
banco.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        senha TEXT NOT NULL
    )
`, (erro) => {
    if (erro) {
        console.error("Erro ao criar tabela:", erro.message);
    } else {
        console.log("Tabela de usuários criada!");
    }
});

banco.all("SELECT * FROM usuarios", (erro, usuarios) => {
    if (erro) {
        console.error("Erro ao buscar usuários:", erro.message);
    } else {
        console.log("Usuários cadastrados:");
        console.log(usuarios);
    }
});

module.exports = banco;