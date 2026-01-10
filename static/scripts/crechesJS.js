document.addEventListener("DOMContentLoaded", async () => {

    /* =========================
       OVERLAY DE NOME
    ========================= */
    const overlay = document.getElementById("overlayNome");
    const btnSalvar = document.getElementById("salvarNome");
    const inputNome = document.getElementById("nomeUsuario");
    const erroNome = document.getElementById("erroNome");

    if (overlay && btnSalvar && inputNome && erroNome) {
        try {
            const res = await fetch("/api/usuario/status", {
                credentials: "include"
            });

            if (res.ok) {
                const data = await res.json();
                if (data.nome_pendente === true) {
                    overlay.classList.remove("hidden");
                    document.body.style.overflow = "hidden";
                }
            }
        } catch (err) {
            console.error("Erro ao verificar status do usuário:", err);
        }

        btnSalvar.addEventListener("click", async () => {
            const nome = inputNome.value.trim();
            erroNome.textContent = "";

            if (nome.length < 3) {
                erroNome.textContent = "O nome deve ter pelo menos 3 caracteres";
                return;
            }

            if (!/^[A-Za-zÀ-ÿ ]+$/.test(nome)) {
                erroNome.textContent = "Use apenas letras e espaços";
                return;
            }

            const csrfToken = document.cookie
                .split("; ")
                .find(c => c.startsWith("csrf_token="))
                ?.split("=")[1];

            if (!csrfToken) {
                erroNome.textContent = "Erro de segurança. Recarregue a página.";
                return;
            }

            try {
                const res = await fetch("/api/completar-nome", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken
                    },
                    credentials: "include",
                    body: JSON.stringify({ nome })
                });

                const data = await res.json();

                if (!res.ok) {
                    erroNome.textContent = data.erro || "Erro ao salvar nome";
                    return;
                }

                overlay.classList.add("hidden");
                document.body.style.overflow = "auto";

            } catch (err) {
                erroNome.textContent = "Erro de conexão com o servidor";
            }
        });
    }

    /* =========================
       CRECHES — ELEMENTOS
    ========================= */
    const entreguesEl = document.getElementById("entregues");
    const prometidasEl = document.getElementById("prometidas");
    const percentualEl = document.getElementById("percentual");
    const barraProgresso = document.getElementById("barraProgresso");

    if (!entreguesEl || !prometidasEl || !percentualEl || !barraProgresso) return;

    /* =========================
       FUNÇÃO CENTRAL
    ========================= */
    function atualizarProgresso() {
        const entregues = Number(entreguesEl.textContent) || 0;
        const prometidas = Number(prometidasEl.textContent) || 0;

        let percentual = 0;
        if (prometidas > 0) {
            percentual = (entregues / prometidas) * 100;
        }

        percentual = Math.min(percentual, 100);

        percentualEl.textContent = `${percentual.toFixed(2)}%`;
        barraProgresso.style.width = `${percentual}%`;
    }

    /* =========================
       BUSCA DADOS INICIAIS
    ========================= */
    try {
        const res = await fetch("/api/creches", {
            credentials: "include"
        });

        if (!res.ok) throw new Error();

        const data = await res.json();

        entreguesEl.textContent = data.entregues;
        prometidasEl.textContent = data.prometidas;

        atualizarProgresso();
    } catch (err) {
        console.error("Erro ao carregar dados:", err);
    }

    /* =========================
       MENU ADMIN
    ========================= */
    const btnAdm = document.querySelector(".btn-adm");
    const admMenu = document.getElementById("admMenu");

    if (btnAdm && admMenu) { btnAdm.addEventListener("click", (e) => { e.stopPropagation(); admMenu.classList.toggle("open"); }); admMenu.addEventListener("click", (e) => { const item = e.target.closest("li"); if (!item) return; const action = item.dataset.action; switch (action) { case "home": window.location.href = "/admin"; break; case "info": window.location.href = "/informacoes"; break; case "logout": window.location.href = "/logout"; break; } admMenu.classList.remove("open"); });
    }

    /* =========================
       EDITAR VALORES
    ========================= */
    const editIcons = document.querySelectorAll(".edit-icon");
    const overlayEditar = document.getElementById("overlayEditar");
    const inputValor = document.getElementById("inputValor");
    const salvarValor = document.getElementById("salvarValor");
    const cancelarValor = document.getElementById("cancelarValor");
    const erroEditar = document.getElementById("erroEditar");
    const labelCampo = document.getElementById("labelCampo");

    let campoAtual = null;

    editIcons.forEach(icon => {
        icon.addEventListener("click", () => {
            campoAtual = icon.dataset.campo;
            inputValor.value = "";
            erroEditar.textContent = "";

            labelCampo.textContent =
                campoAtual === "entregues"
                    ? "Editar creches entregues"
                    : "Editar creches prometidas";

            overlayEditar.classList.remove("hidden");
            document.body.style.overflow = "hidden";
        });
    });

    cancelarValor.addEventListener("click", () => {
        overlayEditar.classList.add("hidden");
        document.body.style.overflow = "auto";
    });

    salvarValor.addEventListener("click", async () => {
        const valor = Number(inputValor.value.trim());

        if (!Number.isInteger(valor) || valor < 0) {
            erroEditar.textContent = "Digite um número válido";
            return;
        }

        const entreguesAtual = Number(entreguesEl.textContent);
        const prometidasAtual = Number(prometidasEl.textContent);

        if (campoAtual === "entregues" && valor > prometidasAtual) {
            erroEditar.textContent =
                "Entregues não pode ser maior que prometidas";
            return;
        }

        if (campoAtual === "prometidas" && valor < entreguesAtual) {
            erroEditar.textContent =
                "Prometidas não pode ser menor que entregues";
            return;
        }

        const csrfToken = document.cookie
            .split("; ")
            .find(c => c.startsWith("csrf_token="))
            ?.split("=")[1];

        try {
            const res = await fetch("/api/creches", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken
                },
                credentials: "include",
                body: JSON.stringify({
                    campo: campoAtual,
                    valor
                })
            });

            const data = await res.json();

            if (!res.ok) {
                erroEditar.textContent = data.erro || "Erro ao salvar";
                return;
            }

            if (campoAtual === "entregues") {
                entreguesEl.textContent = valor;
            } else {
                prometidasEl.textContent = valor;
            }

            atualizarProgresso();

            overlayEditar.classList.add("hidden");
            document.body.style.overflow = "auto";

        } catch (err) {
            erroEditar.textContent = "Erro de conexão";
        }
    });
});
