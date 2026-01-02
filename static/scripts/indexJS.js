document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("consultaForm");
  const nomeInput = document.getElementById("nome");
  const cpfInput = document.getElementById("cpf");
  const telInput = document.getElementById("numero"); // ok
  const erroMsg = document.getElementById("erroMsg");

  if (!form) return;

  /* =========================
     🔐 VERIFICA SE JÁ AUTORIZADO
  ========================= */

  const autorizado = localStorage.getItem("consulta_autorizada");
  if (autorizado === "true") {
    window.location.href = "/home";
    return;
  }

  /* =========================
     🆔 DEVICE ID
  ========================= */

  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = gerarDeviceId();
    localStorage.setItem("device_id", deviceId);
  }

  /* =========================
     MÁSCARAS
  ========================= */

  cpfInput.addEventListener("input", () => {
    cpfInput.value = mascaraCPF(cpfInput.value);
    limparErro();
  });

  telInput.addEventListener("input", () => {
    telInput.value = mascaraTelefone(telInput.value);
    limparErro();
  });

  /* =========================
     SUBMIT
  ========================= */

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    limparErro();

    const cpf = cpfInput.value.replace(/\D/g, ""); // enviar só números
    const telefone = telInput.value.replace(/\D/g, ""); // enviar só números

    if (!validaCPF(cpf)) {
      mostrarErro("CPF inválido.", cpfInput);
      return;
    }

    if (!validaCelular(telefone)) {
      mostrarErro("Telefone inválido.", telInput);
      return;
    }

    try {
      const response = await fetch("/api/informacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          cpf: cpf,
          telefone: telefone,
          device_id: deviceId // 🔐 NOVO
        })
      });

      const data = await response.json();

      if (!response.ok) {
        mostrarErro(data.erro || "Erro no servidor");
        return;
      }

      localStorage.setItem("consulta_autorizada", "true");
      window.location.href = "/home";

    } catch (error) {
      mostrarErro("Erro de conexão com o servidor.");
      console.error(error);
    }
  });

  /* =========================
     ERROS
  ========================= */

  function mostrarErro(msg, input) {
    erroMsg.textContent = msg;
    erroMsg.style.display = "block";
    if (input) input.classList.add("input-erro");
  }

  function limparErro() {
    erroMsg.style.display = "none";
    erroMsg.textContent = "";
    cpfInput.classList.remove("input-erro");
    telInput.classList.remove("input-erro");
  }
});

/* =========================
   🆔 GERAR DEVICE ID
========================= */

function gerarDeviceId() {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset()
  ].join("|");

  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = (hash << 5) - hash + data.charCodeAt(i);
    hash |= 0;
  }

  return "dev_" + Math.abs(hash);
}

/* =========================
   MÁSCARA CPF
========================= */

function mascaraCPF(valor) {
  valor = valor.replace(/\D/g, "").substring(0, 11);
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d)/, "$1.$2");
  valor = valor.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return valor;
}

/* =========================
   MÁSCARA TELEFONE
========================= */

function mascaraTelefone(valor) {
  valor = valor.replace(/\D/g, "").substring(0, 11);

  if (valor.length >= 2) {
    valor = valor.replace(/^(\d{2})(\d)/, "($1) $2");
  }
  if (valor.length >= 7) {
    valor = valor.replace(/(\d{1})(\d{4})(\d)/, "$1 $2-$3");
  }

  return valor;
}

/* =========================
   VALIDA TELEFONE
========================= */

function validaCelular(telefone) {
  telefone = telefone.replace(/\D/g, "");

  if (telefone.length !== 11) return false;

  const ddd = telefone.substring(0, 2);
  const primeiroNumero = telefone.substring(2, 3);

  const dddsValidos = [
    "11","12","13","14","15","16","17","18","19",
    "21","22","24","27","28",
    "31","32","33","34","35","37","38",
    "41","42","43","44","45","46",
    "47","48","49",
    "51","53","54","55",
    "61","62","63","64","65","66",
    "67","68","69",
    "71","73","74","75","77",
    "79",
    "81","82","83","84","85","86","87","88","89",
    "91","92","93","94","95","96","97","98","99"
  ];

  if (!dddsValidos.includes(ddd)) return false;
  if (primeiroNumero !== "9") return false;

  return true;
}

/* =========================
   VALIDA CPF
========================= */

function validaCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }

  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;

  return resto === parseInt(cpf.charAt(10));
}