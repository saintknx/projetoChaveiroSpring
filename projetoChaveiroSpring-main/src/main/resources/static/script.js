const API = "/api/chaveiros";
const documentoFields = ["documento", "consultaDocumento"];
const fieldErrorMap = {
  consultaDocumento: "consultaDocumentoError",
  consultaChavePix: "consultaChavePixError",
  documento: "documentoError",
  nome: "nomeError",
  telefone: "telefoneError",
  cidade: "cidadeError",
  chavePix: "chavePixError",
  status: "statusError",
  observacao: "observacaoError"
};
const sharedTableMarkup = `
  <article class="card">
    <div class="table-header">
      <div class="card-header">
        <h3>Chaveiros cadastrados</h3>
        <p>Lista simples para conferencia e manutencao do cadastro.</p>
      </div>
      <button class="btn-secondary" onclick="listar()">Atualizar lista</button>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Documento</th>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Cidade</th>
            <th>Chave Pix</th>
            <th>Status</th>
            <th>Observacao</th>
          </tr>
        </thead>
        <tbody id="lista"></tbody>
      </table>
    </div>
  </article>
`;

function normalizarValor(valor) {
  return valor ? valor.trim() : "";
}

function obterElemento(id) {
  return document.getElementById(id);
}

function existeElemento(id) {
  return Boolean(obterElemento(id));
}

function valorDoCampo(id) {
  const campo = obterElemento(id);
  return campo ? campo.value : "";
}

function definirValorDoCampo(id, valor) {
  const campo = obterElemento(id);
  if (campo) {
    campo.value = valor;
  }
}

function renderizarNavegacao() {
  const nav = obterElemento("pageNav");
  if (!nav) {
    return;
  }

  const paginaAtual = document.body.dataset.page || "";
  nav.className = "page-nav";
  nav.innerHTML = `
    <a class="page-nav-link ${paginaAtual === "consulta" ? "page-nav-link-active" : ""}" href="/index.html">Consulta rapida anti-golpe</a>
    <a class="page-nav-link ${paginaAtual === "admin" ? "page-nav-link-active" : ""}" href="/admin.html">Cadastro administrativo</a>
  `;
}

function renderizarTabelaCompartilhada() {
  const container = obterElemento("sharedTableSection");
  if (!container) {
    return;
  }
  container.innerHTML = sharedTableMarkup;
}

function exibirResultadoConsulta(exibir) {
  const card = obterElemento("resultadoConsultaCard");
  if (!card) {
    return;
  }
  card.classList.toggle("is-hidden", !exibir);
}

function limparResultadoConsulta() {
  [
    "resultadoDocumento",
    "resultadoNome",
    "resultadoTelefone",
    "resultadoCidade",
    "resultadoChavePix",
    "resultadoStatus",
    "resultadoObservacao"
  ].forEach(function (id) {
    definirValorDoCampo(id, "");
  });
  exibirResultadoConsulta(false);
}

function apenasNumeros(valor) {
  return (valor || "").replace(/\D/g, "");
}

function formatarDocumento(valor) {
  const numeros = apenasNumeros(valor).slice(0, 14);

  if (numeros.length <= 11) {
    return numeros
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatarTelefone(valor) {
  const numeros = apenasNumeros(valor).slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function definirErro(fieldId, mensagem) {
  const campo = obterElemento(fieldId);
  const erro = obterElemento(fieldErrorMap[fieldId]);
  if (campo) {
    campo.classList.add("field-error");
  }
  if (erro) {
    erro.textContent = mensagem;
  }
}

function limparErro(fieldId) {
  const campo = obterElemento(fieldId);
  const erro = obterElemento(fieldErrorMap[fieldId]);
  if (campo) {
    campo.classList.remove("field-error");
  }
  if (erro) {
    erro.textContent = "";
  }
}

function limparErrosCampos(ids) {
  ids.forEach(limparErro);
}

function definirMensagem(id, texto, tipo) {
  const el = obterElemento(id);
  if (!el) {
    return;
  }
  el.className = "alert show alert-" + tipo;
  el.textContent = texto;
}

function ocultarMensagem(id) {
  const el = obterElemento(id);
  if (!el) {
    return;
  }
  el.className = "alert alert-info";
  el.textContent = "";
}

function aplicarMascaraDocumento(event) {
  event.target.value = formatarDocumento(event.target.value);
  limparErro(event.target.id);
}

function aplicarMascaraTelefone(event) {
  event.target.value = formatarTelefone(event.target.value);
  limparErro(event.target.id);
}

function validarDocumento(fieldId, mensagemObrigatoria) {
  const valor = normalizarValor(valorDoCampo(fieldId));
  const numeros = apenasNumeros(valor);

  if (!numeros) {
    definirErro(fieldId, mensagemObrigatoria);
    return false;
  }

  if (numeros.length !== 11 && numeros.length !== 14) {
    definirErro(
      fieldId,
      "Documento invalido. Informe um CPF com 11 numeros ou CNPJ com 14 numeros."
    );
    return false;
  }

  limparErro(fieldId);
  return true;
}

function validarTelefone(fieldId) {
  const valor = normalizarValor(valorDoCampo(fieldId));
  const numeros = apenasNumeros(valor);

  if (!numeros) {
    limparErro(fieldId);
    return true;
  }

  if (numeros.length !== 10 && numeros.length !== 11) {
    definirErro(fieldId, "Telefone invalido. Informe DDD + numero.");
    return false;
  }

  limparErro(fieldId);
  return true;
}

function validarTextoObrigatorio(fieldId, mensagem) {
  const valor = normalizarValor(valorDoCampo(fieldId));
  if (!valor) {
    definirErro(fieldId, mensagem);
    return false;
  }

  limparErro(fieldId);
  return true;
}

function validarCadastroCompleto() {
  const validacoes = [
    { id: "documento", ok: validarDocumento("documento", "Informe o CPF ou CNPJ.") },
    { id: "nome", ok: validarTextoObrigatorio("nome", "Informe o nome do chaveiro.") },
    { id: "telefone", ok: validarTelefone("telefone") },
    { id: "status", ok: validarTextoObrigatorio("status", "Selecione o status.") }
  ];

  const primeiroInvalido = validacoes.find(function (item) {
    return !item.ok;
  });

  if (primeiroInvalido) {
    obterElemento(primeiroInvalido.id).focus();
    return false;
  }

  return true;
}

function validarDocumentoAdmin() {
  const documentoValido = validarDocumento("documento", "Informe o CPF ou CNPJ.");
  if (!documentoValido) {
    obterElemento("documento").focus();
    return false;
  }
  return true;
}

function validarConsultaRapida() {
  const documentoValido = validarDocumento("consultaDocumento", "Informe o CPF ou CNPJ para consultar.");
  if (!documentoValido) {
    obterElemento("consultaDocumento").focus();
    return false;
  }
  return true;
}

function montarChaveiro() {
  return {
    documento: apenasNumeros(valorDoCampo("documento")),
    nome: normalizarValor(valorDoCampo("nome")),
    telefone: apenasNumeros(valorDoCampo("telefone")),
    cidade: normalizarValor(valorDoCampo("cidade")),
    chavePix: normalizarValor(valorDoCampo("chavePix")),
    status: valorDoCampo("status"),
    observacao: normalizarValor(valorDoCampo("observacao"))
  };
}

function preencherFormularioAdmin(chaveiro) {
  if (!existeElemento("documento")) {
    return;
  }

  definirValorDoCampo("documento", formatarDocumento(chaveiro.documento || ""));
  definirValorDoCampo("nome", chaveiro.nome || "");
  definirValorDoCampo("telefone", formatarTelefone(chaveiro.telefone || ""));
  definirValorDoCampo("cidade", chaveiro.cidade || "");
  definirValorDoCampo("chavePix", chaveiro.chavePix || "");
  definirValorDoCampo("status", chaveiro.status || "");
  definirValorDoCampo("observacao", chaveiro.observacao || "");
  limparErrosCampos(["documento", "nome", "telefone", "status"]);
}

function preencherResultadoConsulta(chaveiro) {
  if (!existeElemento("resultadoDocumento")) {
    return;
  }

  definirValorDoCampo("resultadoDocumento", formatarDocumento(chaveiro.documento || ""));
  definirValorDoCampo("resultadoNome", chaveiro.nome || "");
  definirValorDoCampo("resultadoTelefone", formatarTelefone(chaveiro.telefone || ""));
  definirValorDoCampo("resultadoCidade", chaveiro.cidade || "");
  definirValorDoCampo("resultadoChavePix", chaveiro.chavePix || "");
  definirValorDoCampo("resultadoStatus", chaveiro.status || "");
  definirValorDoCampo("resultadoObservacao", chaveiro.observacao || "");
  exibirResultadoConsulta(true);
}

function classeStatus(status) {
  if (status === "VERIFICADO") {
    return "status-verificado";
  }
  if (status === "SUSPEITO") {
    return "status-suspeito";
  }
  return "status-nao-verificado";
}

function mensagemConsultaPorStatus(chaveiro) {
  if (chaveiro.status === "VERIFICADO") {
    return {
      texto: "\u2705 Chaveiro verificado. Confira se os dados batem antes de fazer o Pix.",
      tipo: "success"
    };
  }
  if (chaveiro.status === "SUSPEITO") {
    return {
      texto: "\u26A0\uFE0F Atencao: este chaveiro esta marcado como suspeito.",
      tipo: "danger"
    };
  }
  return {
    texto: "\u26A0\uFE0F Chaveiro cadastrado, mas ainda nao verificado.",
    tipo: "warning"
  };
}

async function verificarChaveiro() {
  limparErro("consultaDocumento");
  limparErro("consultaChavePix");

  if (!validarConsultaRapida()) {
    return;
  }

  const documento = apenasNumeros(valorDoCampo("consultaDocumento"));
  const chavePix = normalizarValor(valorDoCampo("consultaChavePix"));
  const resp = await fetch(API + "/" + documento);

  if (!resp.ok) {
    limparResultadoConsulta();
    definirMensagem(
      "mensagemConsulta",
      "\u274C Nenhum chaveiro encontrado para este documento. Tenha cuidado antes de pagar.",
      "danger"
    );
    return;
  }

  const chaveiro = await resp.json();
  preencherResultadoConsulta(chaveiro);
  definirValorDoCampo("consultaDocumento", formatarDocumento(chaveiro.documento || documento));
  definirValorDoCampo("consultaChavePix", chaveiro.chavePix || chavePix);

  const resultado = mensagemConsultaPorStatus(chaveiro);
  definirMensagem("mensagemConsulta", resultado.texto, resultado.tipo);
}

async function incluir() {
  if (!validarCadastroCompleto()) {
    return;
  }

  const chaveiro = montarChaveiro();
  const resp = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chaveiro)
  });

  definirMensagem(
    "mensagemAdmin",
    resp.ok ? "Chaveiro cadastrado com sucesso." : "Erro ao cadastrar chaveiro.",
    resp.ok ? "success" : "danger"
  );

  if (resp.ok) {
    listar();
  }
}

async function atualizar() {
  if (!validarCadastroCompleto()) {
    return;
  }

  const documento = apenasNumeros(valorDoCampo("documento"));
  const chaveiro = montarChaveiro();
  const resp = await fetch(API + "/" + documento, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chaveiro)
  });

  definirMensagem(
    "mensagemAdmin",
    resp.ok ? "Chaveiro atualizado com sucesso." : "Erro ao atualizar chaveiro.",
    resp.ok ? "success" : "danger"
  );

  if (resp.ok) {
    listar();
  }
}

async function excluir() {
  if (!validarDocumentoAdmin()) {
    return;
  }

  const documento = apenasNumeros(valorDoCampo("documento"));
  const resp = await fetch(API + "/" + documento, { method: "DELETE" });

  definirMensagem(
    "mensagemAdmin",
    resp.ok ? "Chaveiro excluido com sucesso." : "Chaveiro nao encontrado.",
    resp.ok ? "success" : "warning"
  );

  if (resp.ok) {
    listar();
  }
}

async function consultar() {
  if (!validarDocumentoAdmin()) {
    return;
  }

  const documento = apenasNumeros(valorDoCampo("documento"));
  const resp = await fetch(API + "/" + documento);

  if (!resp.ok) {
    definirMensagem("mensagemAdmin", "Chaveiro nao encontrado.", "warning");
    return;
  }

  const chaveiro = await resp.json();
  preencherFormularioAdmin(chaveiro);
  definirMensagem("mensagemAdmin", "Chaveiro encontrado.", "success");
}

async function listar() {
  if (!existeElemento("lista")) {
    return;
  }

  const resp = await fetch(API);
  const chaveiros = await resp.json();
  const tbody = obterElemento("lista");
  tbody.innerHTML = "";

  chaveiros.forEach(function (chaveiro) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + formatarDocumento(chaveiro.documento || "") + "</td>" +
      "<td>" + (chaveiro.nome || "") + "</td>" +
      "<td>" + formatarTelefone(chaveiro.telefone || "") + "</td>" +
      "<td>" + (chaveiro.cidade || "") + "</td>" +
      "<td>" + (chaveiro.chavePix || "") + "</td>" +
      "<td><span class=\"status-badge " + classeStatus(chaveiro.status) + "\">" + (chaveiro.status || "NAO_VERIFICADO") + "</span></td>" +
      "<td>" + (chaveiro.observacao || "") + "</td>";
    tbody.appendChild(tr);
  });
}

function registrarEventos() {
  documentoFields.forEach(function (id) {
    if (existeElemento(id)) {
      obterElemento(id).addEventListener("input", aplicarMascaraDocumento);
    }
  });

  if (existeElemento("telefone")) {
    obterElemento("telefone").addEventListener("input", aplicarMascaraTelefone);
  }

  Object.keys(fieldErrorMap).forEach(function (fieldId) {
    const campo = obterElemento(fieldId);
    if (!campo) {
      return;
    }

    campo.addEventListener("input", function () {
      limparErro(fieldId);
      if (fieldId.indexOf("consulta") === 0) {
        ocultarMensagem("mensagemConsulta");
        limparResultadoConsulta();
      } else {
        ocultarMensagem("mensagemAdmin");
      }
    });

    campo.addEventListener("change", function () {
      limparErro(fieldId);
      if (fieldId.indexOf("consulta") === 0) {
        ocultarMensagem("mensagemConsulta");
        limparResultadoConsulta();
      } else {
        ocultarMensagem("mensagemAdmin");
      }
    });
  });
}

renderizarNavegacao();
renderizarTabelaCompartilhada();
registrarEventos();
listar();
