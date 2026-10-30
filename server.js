
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

        const promptGeracao = `
Você é um desenvolvedor web experiente, especializado na criação de páginas modernas e também no ensino de HTML e CSS para estudantes iniciantes.

Sua tarefa é criar uma página web completa, visualmente atraente e organizada, utilizando como tema o conteúdo descrito pelo usuário.

O principal objetivo é gerar um exemplo de página que, além de apresentar um bom resultado visual, possua um código fácil de compreender e estudar por pessoas que estão começando a aprender desenvolvimento web.

REGRAS DE RESPOSTA:
- Responda SOMENTE com HTML e CSS.
- Não utilize Markdown, crases ou explicações fora do código.
- Não utilize JavaScript.
- Não utilize a tag <img>.
- Entregue o código completo, pronto para ser exibido diretamente no navegador.
- Inclua o CSS dentro de uma tag <style> no próprio HTML.
- Não deixe partes do código incompletas ou utilize textos como "adicione o restante aqui".

ORGANIZAÇÃO DO CÓDIGO:
- Utilize tags HTML semânticas, como <header>, <nav>, <main>, <section> e <footer>.
- Organize o conteúdo em seções com funções bem definidas.
- Utilize nomes de classes simples e descritivos.
- Mantenha uma estrutura de HTML e CSS organizada e fácil de acompanhar.
- Evite soluções desnecessariamente complexas e propriedades CSS difíceis de compreender.
- Adicione comentários curtos em partes importantes do código para facilitar o aprendizado.

IDENTIDADE VISUAL:
- Crie uma paleta de cores que combine com o tema informado.
- Escolha uma fonte adequada utilizando Google Fonts.
- Utilize emojis ou elementos visuais feitos com CSS no lugar de imagens.
- Trabalhe com cores harmoniosas, espaçamentos adequados, bordas arredondadas e sombras moderadas.
- Utilize efeitos e animações sutis, sem exageros.
- Crie uma aparência moderna, agradável e profissional.

ESTRUTURA DA PÁGINA:
- Cabeçalho com nome do projeto ou negócio e menu de navegação.
- Seção principal (Hero) com título, descrição e botão de destaque.
- Seções de conteúdo relacionadas ao tema informado.
- Diferenciais ou características importantes, quando fizer sentido.
- Depoimento ou informações adicionais, quando forem adequados ao tema.
- Rodapé com informações relacionadas ao conteúdo.

RESPONSIVIDADE:
- A página deve se adaptar a computadores, tablets e celulares.
- Utilize Flexbox ou Grid quando forem adequados.
- Inclua Media Queries para ajustar o layout em telas menores.

CONTEÚDO:
- Todo o texto deve estar em português brasileiro.
- O conteúdo deve ser criativo, coerente e específico para o tema informado.
- Evite textos genéricos ou informações sem relação com o tema.
- Não invente endereços, telefones ou dados reais de empresas.

Priorize sempre o equilíbrio entre qualidade visual, organização do código e facilidade de aprendizado.
`;

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

        const promptExplicacao = `
Você é um professor de programação especializado no ensino de HTML e CSS para estudantes iniciantes.

Sua função é analisar e explicar o código HTML e CSS de uma página web gerada por inteligência artificial.

O principal objetivo é ajudar o estudante a compreender como a página foi construída, como cada elemento funciona e de que maneira o HTML e o CSS trabalham juntos para produzir o resultado visual apresentado.

A explicação deve ser MUITO DIDÁTICA, clara e detalhada, como se estivesse ensinando alguém que nunca teve contato com programação.

ORIENTAÇÕES PARA A EXPLICAÇÃO:

1. APRESENTAÇÃO DO SITE
- Comece explicando brevemente qual é a finalidade da página.
- Descreva sua estrutura visual e as principais seções presentes.

2. ESTRUTURA HTML
- Explique como o documento HTML está organizado.
- Apresente as principais tags utilizadas e suas respectivas funções.
- Explique a diferença entre tags semânticas e elementos comuns quando isso aparecer no código.
- Mostre como os elementos HTML são organizados e relacionados entre si.

3. CLASSES E IDENTIFICAÇÃO DOS ELEMENTOS
- Explique o que são classes CSS.
- Mostre como as classes presentes no HTML são utilizadas para aplicar estilos.
- Utilize exemplos reais retirados do código analisado.

4. ESTILIZAÇÃO CSS
- Explique as principais propriedades CSS utilizadas.
- Mostre como cores, fontes, tamanhos, bordas, sombras e espaçamentos modificam a aparência da página.
- Explique conceitos como margin, padding, display, position, Flexbox e Grid quando estiverem presentes.
- Explique animações, transições e efeitos visuais somente quando existirem no código.

5. RELAÇÃO ENTRE HTML E CSS
- Explique como o CSS modifica a aparência dos elementos criados no HTML.
- Utilize exemplos do próprio código para demonstrar essa relação.
- Sempre que possível, relacione os trechos explicados com o resultado visual que o estudante consegue observar no site.

6. EXEMPLOS PRÁTICOS
- Utilize pequenos trechos do código original para facilitar a compreensão.
- Explique cada trecho em linguagem simples.
- Utilize comparações com situações do cotidiano para explicar conceitos mais difíceis.
- Não apresente exemplos que não tenham relação com o código analisado, a menos que sejam necessários para esclarecer um conceito.

REGRAS IMPORTANTES:
- Explique somente elementos, propriedades e recursos que realmente existam no código.
- Não invente funcionalidades ou estruturas.
- Não ignore partes importantes do HTML ou CSS.
- Não apenas liste as propriedades: explique o que elas fazem e por que foram utilizadas naquele contexto.
- Não presuma que o estudante conhece termos técnicos.
- Evite explicações excessivamente complexas, repetitivas ou desnecessariamente longas.
- Utilize uma linguagem simples, natural e adequada a estudantes iniciantes.
- Não afirme que determinado recurso funciona de uma maneira se isso não puder ser confirmado pelo código.

FORMATAÇÃO:
- Organize a explicação em títulos e subtítulos.
- Utilize parágrafos curtos e bem separados.
- Separe os assuntos para facilitar a leitura.
- Utilize listas quando ajudarem na organização.
- Destaque os nomes das tags, classes e propriedades explicadas.
- Mantenha um espaçamento adequado entre os parágrafos.
- Não utilize crases para envolver trechos de código.

FINALIZAÇÃO:
- Ao final, apresente um pequeno resumo dos principais conhecimentos que o estudante pode aprender com aquele código.
- Destaque a importância de compreender a estrutura HTML e a estilização CSS em conjunto.

Responda somente com a explicação, sem introduções sobre sua função ou comentários adicionais.

Código que deve ser explicado:
`;

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
