let chave = "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";

let endereco = "https://api.groq.com/openai/v1/chat/completions";

let codigoGerado = "";


// ========================================
// VERIFICAÇÃO DO LOGIN
// ========================================

async function verificarSessao() {

    try {

        let resposta = await fetch("/api/usuario");

        if (!resposta.ok) {

            window.location.href = "login.html";

            return;
        }

        let dados = await resposta.json();

        console.log("Usuário logado:", dados.usuario);

    } catch (erro) {

        console.error("Erro ao verificar sessão:", erro);

        window.location.href = "login.html";
    }
}


// Verifica o login quando a página é carregada
verificarSessao();


// ========================================
// PROMPT PARA GERAR O SITE
// ========================================

let prompt = `Você é um designer web premiado e Programador. 
Crie uma landing page COMPLETA e VISUALMENTE IMPRESSIONANTE para o negócio descrito.

Regras de resposta:
- Responda SOMENTE com HTML e CSS puros
- Não use crases, markdown ou explicações
- Não use tags <img>

Identidade visual:
- Invente uma paleta de cores única que combine com a essência do negócio pesquisando quais cores são mais utilizadas para o negocio descrito
- Escolha uma Google Font marcante via @import
- Use emojis grandes no lugar de imagens
- Use CSS moderno: gradientes, sombras, animações sutis, layout generoso, tipografia forte

Estrutura da página:
- Header com nome do negócio e menu
- Hero impactante com título, subtítulo e botão CTA
- Seção de diferenciais com emojis
- Depoimento de cliente
- Footer com contato

Todo o conteúdo em português, criativo e específico para o negócio descrito.`;


// ========================================
// GERAR CÓDIGO
// ========================================

async function gerarCodigo() {

    let textarea = document.querySelector(".texto-pagina");
    let botaoGerar = document.querySelector(".botao-gerar");

    let texto = textarea.value.trim();

    // Evita gerar um site sem descrição
    if (!texto) {

        alert("Digite uma descrição para o site.");

        return;
    }

    // Desativa o botão durante a geração
    botaoGerar.disabled = true;

    // Altera o texto do botão
    botaoGerar.textContent = "⏳ Gerando site...";


    try {

        let resposta = await fetch(endereco, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${chave}`
            },

            body: JSON.stringify({

                "model": "openai/gpt-oss-120b",

                messages: [

                    {
                        role: "system",
                        content: prompt
                    },

                    {
                        role: "user",
                        content: texto
                    }

                ]

            })

        });


        let dados = await resposta.json();

        console.log("Resposta da Groq:", dados);


        // Verifica se a API retornou erro
        if (!resposta.ok) {

            console.error("Erro da API:", dados);

            alert(
                "Erro ao gerar o site:\n\n" +
                (dados.error?.message || "Erro desconhecido.")
            );

            return;
        }


        // Verifica se a resposta possui o formato esperado
        if (!dados.choices || !dados.choices[0]?.message?.content) {

            console.error("Resposta inesperada:", dados);

            alert("A IA não retornou o código esperado. Veja o Console (F12).");

            return;
        }


        let resultado = dados.choices[0].message.content;

        codigoGerado = resultado;


        // Libera o botão de explicar
        document.querySelector(".botao-explicacao").disabled = false;


        let espacoCodigo = document.querySelector(".bloco-codigo");
        let espacoSite = document.querySelector(".bloco-site");


        // Mostra o código gerado
        espacoCodigo.textContent = resultado;

        // Mostra o site gerado
        espacoSite.srcdoc = resultado;


    } catch (erro) {

        console.error("Erro na requisição:", erro);

        alert(
            "Não foi possível conectar à API da Groq.\n\n" +
            erro.message
        );

    } finally {

        // Reativa o botão depois que a geração terminar
        botaoGerar.disabled = false;

        // Volta o texto original do botão
        botaoGerar.textContent = "Gerar site";
    }
}


// ========================================
// ENTER PARA GERAR O SITE
// ========================================

const campoTexto = document.querySelector(".texto-pagina");

campoTexto.addEventListener("keydown", function (evento) {

    // Enter sozinho gera o site
    if (evento.key === "Enter" && !evento.shiftKey) {

        evento.preventDefault();

        gerarCodigo();
    }

    // Shift + Enter continua permitindo uma nova linha
});


// ========================================
// EXPLICAR CÓDIGO
// ========================================

async function explicarCodigo() {

    if (!codigoGerado) {

        alert("Primeiro gere um site para poder explicar o código.");

        return;
    }


    let areaExplicacao = document.querySelector(".texto-explicacao");

    let botaoExplicacao = document.querySelector(".botao-explicacao");


    botaoExplicacao.disabled = true;

    botaoExplicacao.textContent = "⏳ Explicando...";


    areaExplicacao.textContent =
        "Estou analisando o código e preparando uma explicação...";


    let promptExplicacao = `Você é um professor de programação especializado em ensinar estudantes iniciantes.

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
OBS: mande a explicação de forma formatada e dando um distanciamendo de duas linhas cada paragrafo para que não fique tudo grudado

Código que deve ser explicado:

${codigoGerado}`;


    try {

        let resposta = await fetch(endereco, {

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
                        content: promptExplicacao
                    },

                    {
                        role: "user",
                        content: "Explique o código fornecido."
                    }

                ]

            })

        });


        let dados = await resposta.json();

        console.log("Resposta da explicação:", dados);


        if (!resposta.ok) {

            console.error("Erro da API:", dados);

            areaExplicacao.textContent =
                "Erro ao gerar a explicação:\n\n" +
                (dados.error?.message || "Erro desconhecido.");

            return;
        }


        if (!dados.choices || !dados.choices[0]?.message?.content) {

            console.error("Resposta inesperada:", dados);

            areaExplicacao.textContent =
                "A IA não retornou uma explicação válida.";

            return;
        }


        let explicacao = dados.choices[0].message.content;

        areaExplicacao.textContent = explicacao;


    } catch (erro) {

        console.error("Erro ao explicar o código:", erro);

        areaExplicacao.textContent =
            "Não foi possível conectar à IA.\n\n" +
            erro.message;


    } finally {

        botaoExplicacao.disabled = false;

        botaoExplicacao.textContent = "💡 Explicar código";

    }
}