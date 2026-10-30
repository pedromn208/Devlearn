
const express = require("express");
const banco = require("./banco");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// Permite receber dados em JSON
app.use(express.json({ limit: "2mb" }));

// Configuração da sessão
app.use(session({
    secret: process.env.SESSION_SECRET || "devlearn-segredo",
    resave: false,
    saveUninitialized: false
}));

// Define a pasta do site
app.use(express.static(__dirname));


// ========================================
// VERIFICAÇÃO DO LOGIN
// ========================================

function verificarLogin(req, res, next) {

    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Você precisa estar logado."
        });
    }

    next();
}


// ========================================
// CONFIGURAÇÃO DA GROQ
// ========================================

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

async function consultarGroq(promptSistema, mensagemUsuario) {

    const chave = process.env.GROQ_API_KEY;

    if (!chave) {
        throw new Error("A chave da API da Groq não foi configurada no servidor.");
    }

    const resposta = await fetch(GROQ_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${chave}`
        },

        body: JSON.stringify({

            model: "openai/gpt-oss-120b",

            messages: [
                {
                    role: "system",
                    content: promptSistema
                },
                {
                    role: "user",
                    content: mensagemUsuario
                }
            ]

        })

    });

    const dados = await resposta.json();

    if (!resposta.ok) {

        console.error("Erro retornado pela Groq:", dados);

        throw new Error(
            dados.error?.message || "Erro ao consultar a API da Groq."
        );
    }

    const resultado = dados.choices?.[0]?.message?.content;

    if (!resultado) {
        throw new Error("A Groq não retornou um conteúdo válido.");
    }

    return resultado;
}


// ========================================
// ROTA PARA GERAR O SITE
// ========================================

app.post("/api/gerar", verificarLogin, async (req, res) => {

    try {

        const { texto } = req.body;

        if (!texto || !texto.trim()) {
            return res.status(400).json({
                erro: "Digite uma descrição para o site."
            });
        }

        const promptGeracao = `Você é um designer web premiado e programador.

Crie uma landing page COMPLETA e VISUALMENTE IMPRESSIONANTE para o negócio descrito.

Regras de resposta:
- Responda SOMENTE com HTML e CSS puros.
- Não use crases, markdown ou explicações.
- Não use tags <img>.

Identidade visual:
- Invente uma paleta de cores única que combine com a essência do negócio.
- Escolha uma Google Font marcante via @import.
- Use emojis grandes no lugar de imagens.
- Use CSS moderno: gradientes, sombras, animações sutis, layout generoso e tipografia forte.

Estrutura da página:
- Header com nome do negócio e menu.
- Hero impactante com título, subtítulo e botão CTA.
- Seção de diferenciais com emojis.
- Depoimento de cliente.
- Footer com contato.

Todo o conteúdo em português, criativo e específico para o negócio descrito.`;

        const codigo = await consultarGroq(
            promptGeracao,
            texto
        );

        res.json({
            codigo: codigo
        });

    } catch (erro) {

        console.error("Erro ao gerar site:", erro);

        res.status(502).json({
            erro: erro.message
        });

    }

});


// ========================================
// ROTA PARA EXPLICAR O CÓDIGO
// ========================================

app.post("/api/explicar", verificarLogin, async (req, res) => {

    try {

        const { codigo } = req.body;

        if (!codigo || !codigo.trim()) {
            return res.status(400).json({
                erro: "Nenhum código foi enviado para explicação."
            });
        }

        const promptExplicacao = `Você é um professor de programação especializado em ensinar estudantes iniciantes.

Sua função é explicar o código HTML e CSS de um site gerado por inteligência artificial.

Explique o código de forma MUITO DIDÁTICA e simples, como se estivesse ensinando uma criança que nunca programou antes.

O objetivo é fazer o estudante realmente ENTENDER como o site funciona.

Siga estas regras:

- Comece explicando de forma simples o que o site faz.
- Explique a estrutura geral do HTML.
- Explique as principais tags HTML utilizadas.
- Explique as classes e como elas são utilizadas no CSS.
- Explique as principais propriedades CSS utilizadas.
- Explique como o HTML e o CSS trabalham juntos.
- Explique conceitos difíceis usando exemplos simples do dia a dia.
- Não presuma que o estudante já conhece programação.
- Explique termos técnicos usando palavras fáceis.
- Explique flexbox, grid, margin, padding, position, animações e outros conceitos quando eles aparecerem no código.
- Mostre pequenos trechos do código quando isso ajudar na explicação.
- Organize a explicação em títulos e tópicos.
- Explique somente o que realmente existe no código.
- Não invente funcionalidades.
- Ao final, faça um pequeno resumo do que o estudante aprendeu.

Responda somente com a explicação.
Não utilize crases ou markdown.

OBS: mande a explicação de forma formatada e dando um distanciamento de duas linhas cada parágrafo para que não fique tudo grudado.

Código que deve ser explicado:`;

        const explicacao = await consultarGroq(
            promptExplicacao,
            codigo
        );

        res.json({
            explicacao: explicacao
        });

    } catch (erro) {

        console.error("Erro ao explicar código:", erro);

        res.status(502).json({
            erro: erro.message
        });

    }

});


// ========================================
// ROTA DE TESTE
// ========================================

app.get("/api/teste", (req, res) => {

    res.json({
        mensagem: "Servidor funcionando!"
    });

});


// ========================================
// ROTA DE CADASTRO
// ========================================

app.post("/api/cadastro", async (req, res) => {

    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({
            erro: "Preencha todos os campos."
        });
    }

    try {

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

    } catch (erro) {

        console.error("Erro no cadastro:", erro);

        res.status(500).json({
            erro: "Erro ao cadastrar usuário."
        });

    }

});


// ========================================
// ROTA DE LOGIN
// ========================================

app.post("/api/login", (req, res) => {

    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({
            erro: "Preencha o e-mail e a senha."
        });
    }

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

        if (!usuario) {
            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });
        }

        try {

            const senhaCorreta = await bcrypt.compare(
                senha,
                usuario.senha
            );

            if (!senhaCorreta) {
                return res.status(401).json({
                    erro: "E-mail ou senha incorretos."
                });
            }

            req.session.usuario = {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email
            };

            res.json({
                mensagem: "Login realizado com sucesso!",
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email
                }
            });

        } catch (erro) {

            console.error("Erro no login:", erro);

            res.status(500).json({
                erro: "Erro ao realizar login."
            });

        }

    });

});


// ========================================
// VERIFICAR USUÁRIO LOGADO
// ========================================

app.get("/api/usuario", (req, res) => {

    if (!req.session.usuario) {
        return res.status(401).json({
            erro: "Usuário não está logado."
        });
    }

    res.json({
        usuario: req.session.usuario
    });

});


// ========================================
// ROTA PROTEGIDA
// ========================================

app.get("/api/protegida", verificarLogin, (req, res) => {

    res.json({
        mensagem: "Você está logado e pode acessar esta área!",
        usuario: req.session.usuario
    });

});


// ========================================
// ROTA DE LOGOUT
// ========================================

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


// ========================================
// INICIA O SERVIDOR
// ========================================

app.listen(PORT, () => {

    console.log(`Servidor funcionando na porta ${PORT}`);

});
