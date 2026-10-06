const express = require("express");
const path = require("path");
const banco = require("./banco");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = 3000;

// Permite receber dados em JSON
app.use(express.json());

// Configuração da sessão
app.use(session({
    secret: "devlearn-segredo",
    resave: false,
    saveUninitialized: false
}));

// Define a pasta do site
app.use(express.static(__dirname));

// Verifica se o usuário está logado
function verificarLogin(req, res, next) {

    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    next();
}

// Rota de teste
app.get("/api/teste", (req, res) => {
    res.json({
        mensagem: "Servidor funcionando!"
    });
});

// Rota de cadastro
app.post("/api/cadastro", async (req, res) => {

    const { nome, email, senha } = req.body;

    // Verifica se todos os campos foram preenchidos
    if (!nome || !email || !senha) {
        return res.status(400).json({
            erro: "Preencha todos os campos."
        });
    }

    // Criptografa a senha
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const sql = `
        INSERT INTO usuarios (nome, email, senha)
        VALUES (?, ?, ?)
    `;

    banco.run(
        sql,
        [nome, email, senhaCriptografada],
        function (erro) {

            if (erro) {
                return res.status(400).json({
                    erro: "Este e-mail já está cadastrado."
                });
            }

            res.json({
                mensagem: "Usuário cadastrado com sucesso!",
                id: this.lastID
            });
        }
    );
});

// Rota de login
app.post("/api/login", (req, res) => {

    const { email, senha } = req.body;

    // Verifica se os campos foram preenchidos
    if (!email || !senha) {
        return res.status(400).json({
            erro: "Preencha o e-mail e a senha."
        });
    }

    // Procura o usuário pelo e-mail
    const sql = `
        SELECT * FROM usuarios
        WHERE email = ?
    `;

    banco.get(sql, [email], async (erro, usuario) => {

        if (erro) {
            return res.status(500).json({
                erro: "Erro ao consultar o banco de dados."
            });
        }

        // Verifica se o usuário existe
        if (!usuario) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        // Compara a senha digitada com a senha criptografada
        const senhaCorreta = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        // Salva o usuário na sessão
        req.session.usuario = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        };

        // Login realizado
        res.json({
            mensagem: "Login realizado com sucesso!",
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            }
        });
    });
});

// Verifica se existe um usuário logado
app.get("/api/usuario", (req, res) => {

    console.log("A rota /api/usuario foi acessada!");

    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Usuário não está logado."
        });
    }

    res.json({
        usuario: req.session.usuario
    });
});

console.log("Rota /api/usuario foi registrada!");

// Rota protegida para testar o login
app.get("/api/protegida", verificarLogin, (req, res) => {

    res.json({
        mensagem: "Você está logado e pode acessar esta área!",
        usuario: req.session.usuario
    });
});

// Rota de logout
app.get("/api/logout", (req, res) => {

    req.session.destroy((erro) => {

        if (erro) {
            return res.status(500).json({
                erro: "Erro ao sair da conta."
            });
        }

        res.json({
            mensagem: "Logout realizado com sucesso!"
        });
    });
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor funcionando em http://localhost:${PORT}`);
});