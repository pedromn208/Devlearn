
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
// GERAR CÓDIGO
// ========================================

async function gerarCodigo() {

    let textarea = document.querySelector(".texto-pagina");
    let botaoGerar = document.querySelector(".botao-gerar");

    let texto = textarea.value.trim();

    if (!texto) {
        alert("Digite uma descrição para o site.");
        return;
    }

    botaoGerar.disabled = true;
    botaoGerar.textContent = "⏳ Gerando site...";

    try {

        let resposta = await fetch("/api/gerar", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                texto: texto
            })

        });

        let dados = await resposta.json();

        console.log("Resposta da geração:", dados);

        if (!resposta.ok) {

            console.error("Erro:", dados);

            alert(
                "Erro ao gerar o site:\n\n" +
                (dados.erro || "Erro desconhecido.")
            );

            return;
        }

        if (!dados.codigo) {

            alert("A IA não retornou o código esperado.");

            return;
        }

        codigoGerado = dados.codigo;

        document.querySelector(".botao-explicacao").disabled = false;

        let espacoCodigo = document.querySelector(".bloco-codigo");
        let espacoSite = document.querySelector(".bloco-site");

        // Mostra o código gerado
        espacoCodigo.textContent = codigoGerado;

        // Mostra a pré-visualização
        espacoSite.srcdoc = codigoGerado;

    } catch (erro) {

        console.error("Erro na requisição:", erro);

        alert(
            "Não foi possível conectar ao servidor.\n\n" +
            erro.message
        );

    } finally {

        botaoGerar.disabled = false;
        botaoGerar.textContent = "Gerar site";

    }
}


// ========================================
// ENTER PARA GERAR O SITE
// ========================================

const campoTexto = document.querySelector(".texto-pagina");

campoTexto.addEventListener("keydown", function (evento) {

    if (evento.key === "Enter" && !evento.shiftKey) {

        evento.preventDefault();

        gerarCodigo();

    }

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

    try {

        let resposta = await fetch("/api/explicar", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                codigo: codigoGerado
            })

        });

        let dados = await resposta.json();

        console.log("Resposta da explicação:", dados);

        if (!resposta.ok) {

            console.error("Erro:", dados);

            areaExplicacao.textContent =
                "Erro ao gerar a explicação:\n\n" +
                (dados.erro || "Erro desconhecido.");

            return;
        }

        if (!dados.explicacao) {

            areaExplicacao.textContent =
                "A IA não retornou uma explicação válida.";

            return;
        }

        areaExplicacao.textContent = dados.explicacao;

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
