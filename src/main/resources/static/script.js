const AUTH_API = "/api/auth";
const CHAVEIRO_API = "/api/chaveiros";
const documentoFields = ["documento", "consultaDocumento", "registerCnpj"];
const fieldErrorMap = {
  loginEmail: "loginEmailError",
  loginSenha: "loginSenhaError",
  registerNome: "registerNomeError",
  registerTelefone: "registerTelefoneError",
  registerEmail: "registerEmailError",
  registerSenha: "registerSenhaError",
  registerConfirmarSenha: "registerConfirmarSenhaError",
  registerCnpj: "registerCnpjError",
  consultaDocumento: "consultaDocumentoError",
  consultaChavePix: "consultaChavePixError",
  documento: "documentoError",
  nome: "nomeError",
  telefone: "telefoneError",
  cidade: "cidadeError",
  chavePix: "chavePixError",
  status: "statusError",
  tiposTrabalho: "tiposTrabalhoError",
  observacao: "observacaoError"
};
const sharedTableMarkup = `
  <article class="card">
    <div class="table-header">
      <div class="card-header">
        <h3>Chaveiros cadastrados</h3>
        <p>Lista simples para consulta e conferencia dos profissionais ativos.</p>
      </div>
      <button class="btn-secondary" onclick="listar()">Atualizar lista</button>
    </div>

    <div class="table-filters">
      <div class="form-group">
        <label for="filtroCidade">Filtrar por cidade</label>
        <input type="text" id="filtroCidade" list="filtroCidadeLista" placeholder="Digite ou escolha uma cidade">
        <datalist id="filtroCidadeLista"></datalist>
      </div>
      <div class="form-group">
        <label for="filtroTipoTrabalhoTabela">Filtrar por tipo de trabalho</label>
        <input type="text" id="filtroTipoTrabalhoTabela" list="filtroTipoTrabalhoLista" placeholder="Digite ou escolha um tipo de trabalho">
        <datalist id="filtroTipoTrabalhoLista"></datalist>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Documento</th>
            <th>Nome</th>
            <th>Telefone</th>
            <th>Cidade</th>
            <th>Tipos de trabalho</th>
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

let usuarioAutenticado = null;
let tiposTrabalhoCatalogo = [];
let todosChaveiros = [];
let meusCadastros = [];
let modoAdminAtual = "inclusao";
let cadastroSelecionadoId = null;

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

function obterPaginaAtual() {
  return document.body.dataset.page || "";
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

function aplicarMascaraDocumento(event) {
  event.target.value = formatarDocumento(event.target.value);
  limparErro(event.target.id);
}

function aplicarMascaraTelefone(event) {
  event.target.value = formatarTelefone(event.target.value);
  limparErro(event.target.id);
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

function validarTextoObrigatorio(fieldId, mensagem) {
  const valor = normalizarValor(valorDoCampo(fieldId));
  if (!valor) {
    definirErro(fieldId, mensagem);
    return false;
  }

  limparErro(fieldId);
  return true;
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

function validarCnpj(fieldId) {
  const valor = normalizarValor(valorDoCampo(fieldId));
  const numeros = apenasNumeros(valor);

  if (!numeros) {
    definirErro(fieldId, "Informe o CNPJ da empresa.");
    return false;
  }

  if (numeros.length !== 14) {
    definirErro(fieldId, "CNPJ invalido. Informe 14 numeros.");
    return false;
  }

  limparErro(fieldId);
  return true;
}

function validarTelefone(fieldId, obrigatorio) {
  const valor = normalizarValor(valorDoCampo(fieldId));
  const numeros = apenasNumeros(valor);

  if (!numeros) {
    if (obrigatorio) {
      definirErro(fieldId, "Informe o telefone.");
      return false;
    }
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

function validarEmail(fieldId) {
  const valor = normalizarValor(valorDoCampo(fieldId));
  if (!valor) {
    definirErro(fieldId, "Informe o email.");
    return false;
  }

  if (!valor.includes("@") || valor.startsWith("@") || valor.endsWith("@")) {
    definirErro(fieldId, "Informe um email valido.");
    return false;
  }

  limparErro(fieldId);
  return true;
}

function validarSenha(fieldId) {
  const valor = valorDoCampo(fieldId);
  if (!valor) {
    definirErro(fieldId, "Informe a senha.");
    return false;
  }

  if (valor.length < 6) {
    definirErro(fieldId, "A senha deve ter pelo menos 6 caracteres.");
    return false;
  }

  limparErro(fieldId);
  return true;
}

function validarConfirmacaoSenha() {
  const senha = valorDoCampo("registerSenha");
  const confirmacao = valorDoCampo("registerConfirmarSenha");

  if (!confirmacao) {
    definirErro("registerConfirmarSenha", "Confirme a senha.");
    return false;
  }

  if (senha !== confirmacao) {
    definirErro("registerConfirmarSenha", "As senhas nao coincidem.");
    return false;
  }

  limparErro("registerConfirmarSenha");
  return true;
}

function tipoUsuarioSelecionado() {
  const ativo = document.querySelector("[data-role-option].role-switch-btn-active");
  return ativo ? ativo.dataset.roleOption : "COMUM";
}

function normalizarComparacao(valor) {
  return normalizarValor(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function obterTiposTrabalhoSelecionados() {
  return Array.from(document.querySelectorAll('input[name="tiposTrabalho"]:checked')).map(function (input) {
    return input.value;
  });
}

function validarTiposTrabalho() {
  const selecionados = obterTiposTrabalhoSelecionados();
  if (!selecionados.length) {
    definirErro("tiposTrabalho", "Selecione ao menos um tipo de trabalho.");
    return false;
  }

  if (selecionados.length > 1) {
    definirErro("tiposTrabalho", "Selecione somente 1 tipo de trabalho.");
    return false;
  }

  limparErro("tiposTrabalho");
  return true;
}

function atualizarVisibilidadeCnpj() {
  const tipo = tipoUsuarioSelecionado();
  const cnpjGroup = obterElemento("registerCnpjGroup");
  const nomeLabel = document.querySelector('label[for="registerNome"]');
  const nomeInput = obterElemento("registerNome");
  if (!cnpjGroup || !nomeLabel || !nomeInput) {
    return;
  }

  const isEmpresa = tipo === "EMPRESA";
  cnpjGroup.classList.toggle("is-hidden", !isEmpresa);
  nomeLabel.textContent = isEmpresa ? "Nome da empresa" : "Nome";
  nomeInput.placeholder = isEmpresa ? "Razao social ou nome fantasia" : "Nome completo";

  if (!isEmpresa) {
    definirValorDoCampo("registerCnpj", "");
    limparErro("registerCnpj");
  }
}

function renderizarUserBar() {
  const container = obterElemento("userBar");
  if (!container || !usuarioAutenticado) {
    return;
  }

  const tipoLabel = usuarioAutenticado.tipoUsuario === "EMPRESA" ? "Usuario empresa" : "Usuario comum";
  container.innerHTML = `
    <article class="user-bar">
      <div>
        <strong>${usuarioAutenticado.nome}</strong>
        <span class="user-bar-meta">${usuarioAutenticado.email}</span>
      </div>
      <div class="user-bar-actions">
        <span class="role-badge">${tipoLabel}</span>
        <button class="btn-secondary" type="button" onclick="logout()">Sair</button>
      </div>
    </article>
  `;
}

function alternarModoAuth(modo) {
  const loginPanel = obterElemento("loginPanel");
  const registerPanel = obterElemento("registerPanel");
  if (!loginPanel || !registerPanel) {
    return;
  }

  const loginAtivo = modo === "login";
  loginPanel.classList.toggle("is-hidden", !loginAtivo);
  registerPanel.classList.toggle("is-hidden", loginAtivo);

  document.querySelectorAll("[data-auth-mode]").forEach(function (botao) {
    botao.classList.toggle("auth-mode-btn-active", botao.dataset.authMode === modo);
  });
}

function renderizarNavegacao() {
  const nav = obterElemento("pageNav");
  if (!nav || !usuarioAutenticado) {
    return;
  }

  if (usuarioAutenticado.tipoUsuario !== "EMPRESA") {
    nav.className = "";
    nav.innerHTML = "";
    return;
  }

  const paginaAtual = obterPaginaAtual();
  const links = [
    {
      href: "/consulta.html",
      label: "Consulta e chaveiros",
      ativo: paginaAtual === "consulta"
    }
  ];

  if (usuarioAutenticado.tipoUsuario === "EMPRESA") {
    links.push({
      href: "/admin.html",
      label: "Cadastro administrativo",
      ativo: paginaAtual === "admin"
    });
  }

  nav.className = "page-nav";
  nav.innerHTML = links.map(function (link) {
    return `<a class="page-nav-link ${link.ativo ? "page-nav-link-active" : ""}" href="${link.href}">${link.label}</a>`;
  }).join("");
}

function renderizarTabelaCompartilhada() {
  const container = obterElemento("sharedTableSection");
  if (!container) {
    return;
  }
  container.innerHTML = sharedTableMarkup;
  registrarEventosFiltrosTabela();
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
    "resultadoTiposTrabalho",
    "resultadoObservacao"
  ].forEach(function (id) {
    definirValorDoCampo(id, "");
  });
  exibirResultadoConsulta(false);
}

function formatarTiposTrabalho(tipos) {
  if (!Array.isArray(tipos) || !tipos.length) {
    return "-";
  }

  return tipos.map(function (codigo) {
    const encontrado = tiposTrabalhoCatalogo.find(function (tipo) {
      return tipo.codigo === codigo;
    });
    return encontrado ? encontrado.descricao : codigo;
  }).join(", ");
}

function extrairCidadesDisponiveis() {
  return Array.from(new Set(
    todosChaveiros
      .map(function (chaveiro) {
        return normalizarValor(chaveiro.cidade);
      })
      .filter(Boolean)
  )).sort(function (a, b) {
    return a.localeCompare(b, "pt-BR");
  });
}

function extrairTiposDisponiveis() {
  return Array.from(new Set(
    todosChaveiros.flatMap(function (chaveiro) {
      return (chaveiro.tiposTrabalho || []).map(function (tipo) {
        return formatarTiposTrabalho([tipo]);
      });
    }).filter(Boolean)
  )).sort(function (a, b) {
    return a.localeCompare(b, "pt-BR");
  });
}

function atualizarSugestoesFiltros() {
  const listaCidades = obterElemento("filtroCidadeLista");
  const listaTipos = obterElemento("filtroTipoTrabalhoLista");
  if (!listaCidades || !listaTipos) {
    return;
  }

  listaCidades.innerHTML = extrairCidadesDisponiveis().map(function (cidade) {
    return `<option value="${cidade}"></option>`;
  }).join("");

  listaTipos.innerHTML = extrairTiposDisponiveis().map(function (tipo) {
    return `<option value="${tipo}"></option>`;
  }).join("");
}

function obterChaveirosFiltrados() {
  const filtroCidade = normalizarComparacao(valorDoCampo("filtroCidade"));
  const filtroTipo = normalizarComparacao(valorDoCampo("filtroTipoTrabalhoTabela"));

  return todosChaveiros.filter(function (chaveiro) {
    const cidade = normalizarComparacao(chaveiro.cidade || "");
    const tipos = normalizarComparacao(formatarTiposTrabalho(chaveiro.tiposTrabalho || []));
    const cidadeOk = !filtroCidade || cidade.includes(filtroCidade);
    const tipoOk = !filtroTipo || tipos.includes(filtroTipo);
    return cidadeOk && tipoOk;
  });
}

function renderizarLinhasTabela(chaveiros) {
  const tbody = obterElemento("lista");
  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";

  chaveiros.forEach(function (chaveiro) {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + formatarDocumento(chaveiro.documento || "") + "</td>" +
      "<td>" + (chaveiro.nome || "") + "</td>" +
      "<td>" + formatarTelefone(chaveiro.telefone || "") + "</td>" +
      "<td>" + (chaveiro.cidade || "") + "</td>" +
      "<td>" + formatarTiposTrabalho(chaveiro.tiposTrabalho || []) + "</td>" +
      "<td>" + (chaveiro.chavePix || "") + "</td>" +
      "<td><span class=\"status-badge " + classeStatus(chaveiro.status) + "\">" + (chaveiro.status || "NAO_VERIFICADO") + "</span></td>" +
      "<td>" + (chaveiro.observacao || "") + "</td>";
    tbody.appendChild(tr);
  });
}

function aplicarFiltrosTabela() {
  renderizarLinhasTabela(obterChaveirosFiltrados());
}

function registrarEventosFiltrosTabela() {
  ["filtroCidade", "filtroTipoTrabalhoTabela"].forEach(function (id) {
    const campo = obterElemento(id);
    if (!campo || campo.dataset.bound === "true") {
      return;
    }

    campo.addEventListener("input", aplicarFiltrosTabela);
    campo.addEventListener("change", aplicarFiltrosTabela);
    campo.dataset.bound = "true";
  });
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
  marcarTiposTrabalho(chaveiro.tiposTrabalho || []);
  limparErrosCampos(["documento", "nome", "telefone", "status", "tiposTrabalho"]);
}

function preencherCamposEmpresaLogada() {
  if (!usuarioAutenticado || usuarioAutenticado.tipoUsuario !== "EMPRESA" || !existeElemento("documento")) {
    return;
  }

  definirValorDoCampo("documento", formatarDocumento(usuarioAutenticado.cnpj || ""));
  definirValorDoCampo("nome", usuarioAutenticado.nome || "");
}

function limparCamposCadastroAdmin() {
  if (!existeElemento("documento")) {
    return;
  }

  preencherCamposEmpresaLogada();
  definirValorDoCampo("telefone", "");
  definirValorDoCampo("cidade", "");
  definirValorDoCampo("chavePix", "");
  definirValorDoCampo("status", "");
  definirValorDoCampo("observacao", "");
  marcarTiposTrabalho([]);
  limparErrosCampos(["telefone", "cidade", "chavePix", "status", "tiposTrabalho", "observacao"]);
}

function definirCamposSomenteLeitura(ids, readonly) {
  ids.forEach(function (id) {
    const campo = obterElemento(id);
    if (!campo) {
      return;
    }

    if (campo.tagName === "SELECT") {
      campo.disabled = readonly;
    } else {
      campo.readOnly = readonly;
    }

    campo.classList.toggle("read-only-field", readonly);
  });
}

function definirTipoTrabalhoSomenteLeitura(readonly) {
  document.querySelectorAll('input[name="tiposTrabalho"]').forEach(function (input) {
    input.disabled = readonly;
  });
}

function configurarModoAdmin(modo) {
  modoAdminAtual = modo;

  const defaultActions = obterElemento("defaultAdminActions");
  const editActions = obterElemento("editAdminActions");
  const deleteActions = obterElemento("deleteAdminActions");

  if (defaultActions) {
    defaultActions.classList.toggle("is-hidden", modo !== "inclusao");
  }
  if (editActions) {
    editActions.classList.toggle("is-hidden", modo !== "alteracao");
  }
  if (deleteActions) {
    deleteActions.classList.toggle("is-hidden", modo !== "exclusao");
  }

  definirCamposSomenteLeitura(["documento", "nome"], true);
  definirCamposSomenteLeitura(
    ["telefone", "cidade", "chavePix", "observacao"],
    modo === "exclusao"
  );
  definirCamposSomenteLeitura(["status"], modo === "exclusao");
  definirTipoTrabalhoSomenteLeitura(modo === "exclusao");

  if (modo === "inclusao") {
    cadastroSelecionadoId = null;
    limparCamposCadastroAdmin();
  }
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
  definirValorDoCampo("resultadoTiposTrabalho", formatarTiposTrabalho(chaveiro.tiposTrabalho || []));
  definirValorDoCampo("resultadoObservacao", chaveiro.observacao || "");
  exibirResultadoConsulta(true);
}

function descricaoCadastro(chaveiro) {
  const partes = [];
  if (chaveiro.cidade) {
    partes.push(chaveiro.cidade);
  }
  if (chaveiro.tiposTrabalho && chaveiro.tiposTrabalho.length) {
    partes.push(formatarTiposTrabalho(chaveiro.tiposTrabalho));
  }
  if (chaveiro.chavePix) {
    partes.push(chaveiro.chavePix);
  }
  return partes.length ? partes.join(" | ") : "Sem detalhes adicionais";
}

async function carregarMeusCadastros() {
  const resp = await requisicaoJson(CHAVEIRO_API + "/meus");
  if (!resp.ok) {
    meusCadastros = [];
    return [];
  }

  meusCadastros = await resp.json();
  return meusCadastros;
}

function abrirModalCadastro() {
  const modal = obterElemento("cadastroPickerModal");
  if (modal) {
    modal.classList.remove("is-hidden");
  }
}

function fecharSeletorCadastro() {
  const modal = obterElemento("cadastroPickerModal");
  if (modal) {
    modal.classList.add("is-hidden");
  }
}

async function abrirSeletorCadastro(acao) {
  ocultarMensagem("mensagemAdmin");
  const cadastros = await carregarMeusCadastros();

  if (!cadastros.length) {
    definirMensagem("mensagemAdmin", "Voce ainda nao possui cadastros para esta acao.", "warning");
    return;
  }

  const titulo = obterElemento("cadastroPickerTitle");
  const subtitulo = obterElemento("cadastroPickerSubtitle");
  const lista = obterElemento("cadastroPickerList");
  if (!titulo || !subtitulo || !lista) {
    return;
  }

  titulo.textContent = acao === "excluir" ? "Escolher cadastro para excluir" : "Escolher cadastro para alterar";
  subtitulo.textContent = "Selecione um cadastro da sua empresa.";
  lista.innerHTML = cadastros.map(function (chaveiro) {
    return `
      <button type="button" class="modal-list-item" onclick="selecionarCadastroParaAcao(${chaveiro.id}, '${acao}')">
        <strong>Cadastro #${chaveiro.id}</strong>
        <span>${descricaoCadastro(chaveiro)}</span>
      </button>
    `;
  }).join("");

  abrirModalCadastro();
}

function selecionarCadastroParaAcao(id, acao) {
  const chaveiro = meusCadastros.find(function (item) {
    return item.id === id;
  });
  if (!chaveiro) {
    return;
  }

  cadastroSelecionadoId = id;
  preencherFormularioAdmin(chaveiro);
  configurarModoAdmin(acao === "excluir" ? "exclusao" : "alteracao");
  fecharSeletorCadastro();

  if (acao === "excluir") {
    definirMensagem("mensagemAdmin", "Revise os dados e conclua a exclusao do cadastro selecionado.", "warning");
  } else {
    definirMensagem("mensagemAdmin", "Edite os campos permitidos e salve a alteracao.", "info");
  }
}

function cancelarFluxoAdmin(limparMensagem = true) {
  fecharSeletorCadastro();
  if (limparMensagem) {
    ocultarMensagem("mensagemAdmin");
  }
  configurarModoAdmin("inclusao");
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
      texto: "Chaveiro verificado. Confira se os dados batem antes de fazer o Pix.",
      tipo: "success"
    };
  }
  if (chaveiro.status === "SUSPEITO") {
    return {
      texto: "Atencao: este chaveiro esta marcado como suspeito.",
      tipo: "danger"
    };
  }
  return {
    texto: "Chaveiro cadastrado, mas ainda nao verificado.",
    tipo: "warning"
  };
}

function montarChaveiro() {
  return {
    documento: apenasNumeros(valorDoCampo("documento")),
    nome: normalizarValor(valorDoCampo("nome")),
    telefone: apenasNumeros(valorDoCampo("telefone")),
    cidade: normalizarValor(valorDoCampo("cidade")),
    chavePix: normalizarValor(valorDoCampo("chavePix")),
    status: valorDoCampo("status"),
    tiposTrabalho: obterTiposTrabalhoSelecionados(),
    observacao: normalizarValor(valorDoCampo("observacao"))
  };
}

async function obterMensagemErro(resp, fallback) {
  try {
    const body = await resp.json();
    return body.message || fallback;
  } catch (error) {
    return fallback;
  }
}

async function requisicaoJson(url, options) {
  const resp = await fetch(url, options);
  if (resp.status === 401) {
    window.location.href = "/index.html";
    throw new Error("Sessao expirada");
  }
  return resp;
}

async function carregarSessao() {
  const resp = await fetch(AUTH_API + "/me");
  if (!resp.ok) {
    return null;
  }
  return resp.json();
}

function redirecionarPorPerfil(usuario) {
  if (!usuario) {
    return;
  }
  window.location.href = usuario.tipoUsuario === "EMPRESA" ? "/consulta.html" : "/consulta.html";
}

async function inicializarLogin() {
  const sessao = await carregarSessao();
  if (sessao) {
    redirecionarPorPerfil(sessao);
    return;
  }

  document.querySelectorAll("[data-auth-mode]").forEach(function (botao) {
    botao.addEventListener("click", function () {
      alternarModoAuth(botao.dataset.authMode);
    });
  });

  const botoes = document.querySelectorAll("[data-role-option]");
  botoes.forEach(function (botao) {
    botao.addEventListener("click", function () {
      botoes.forEach(function (item) {
        item.classList.remove("role-switch-btn-active");
      });
      botao.classList.add("role-switch-btn-active");
      atualizarVisibilidadeCnpj();
      ocultarMensagem("mensagemRegister");
    });
  });

  atualizarVisibilidadeCnpj();
  alternarModoAuth("login");
}

async function exigirAutenticacao(perfilEmpresaObrigatorio) {
  usuarioAutenticado = await carregarSessao();
  if (!usuarioAutenticado) {
    window.location.href = "/index.html";
    return false;
  }

  if (perfilEmpresaObrigatorio && usuarioAutenticado.tipoUsuario !== "EMPRESA") {
    window.location.href = "/consulta.html";
    return false;
  }

  renderizarUserBar();
  renderizarNavegacao();
  renderizarTabelaCompartilhada();
  preencherCamposEmpresaLogada();
  if (obterPaginaAtual() === "admin") {
    configurarModoAdmin("inclusao");
  }
  return true;
}

async function carregarTiposTrabalho() {
  if (!existeElemento("tiposTrabalhoOptions") && obterPaginaAtual() !== "consulta") {
    return;
  }

  const resp = await requisicaoJson(CHAVEIRO_API + "/tipos-trabalho");
  if (!resp.ok) {
    return;
  }

  tiposTrabalhoCatalogo = await resp.json();
  renderizarTiposTrabalho();
}

function renderizarTiposTrabalho() {
  const container = obterElemento("tiposTrabalhoOptions");
  if (!container) {
    return;
  }

  container.innerHTML = tiposTrabalhoCatalogo.map(function (tipo) {
    return `
      <label class="checkbox-card">
        <input type="checkbox" name="tiposTrabalho" value="${tipo.codigo}">
        <span>${tipo.descricao}</span>
      </label>
    `;
  }).join("");

  container.querySelectorAll('input[name="tiposTrabalho"]').forEach(function (input) {
    input.addEventListener("change", function () {
      if (input.checked) {
        container.querySelectorAll('input[name="tiposTrabalho"]').forEach(function (outroInput) {
          if (outroInput !== input) {
            outroInput.checked = false;
          }
        });
      }
      limparErro("tiposTrabalho");
      ocultarMensagem("mensagemAdmin");
    });
  });
}

function marcarTiposTrabalho(tiposSelecionados) {
  const tipos = new Set(tiposSelecionados || []);
  document.querySelectorAll('input[name="tiposTrabalho"]').forEach(function (input) {
    input.checked = tipos.has(input.value);
  });
}

function validarCadastroCompleto() {
  const validacoes = [
    { id: "documento", ok: validarDocumento("documento", "Informe o CPF ou CNPJ.") },
    { id: "nome", ok: validarTextoObrigatorio("nome", "Informe o nome do chaveiro.") },
    { id: "telefone", ok: validarTelefone("telefone", false) },
    { id: "status", ok: validarTextoObrigatorio("status", "Selecione o status.") },
    { id: "tiposTrabalho", ok: validarTiposTrabalho() }
  ];

  const primeiroInvalido = validacoes.find(function (item) {
    return !item.ok;
  });

  if (primeiroInvalido && existeElemento(primeiroInvalido.id)) {
    obterElemento(primeiroInvalido.id).focus();
    return false;
  }

  if (primeiroInvalido && primeiroInvalido.id === "tiposTrabalho") {
    const primeiroCheckbox = document.querySelector('input[name="tiposTrabalho"]');
    if (primeiroCheckbox) {
      primeiroCheckbox.focus();
    }
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
  const documento = apenasNumeros(valorDoCampo("consultaDocumento"));
  const chavePix = normalizarValor(valorDoCampo("consultaChavePix"));

  limparErro("consultaDocumento");
  limparErro("consultaChavePix");

  if (!documento && !chavePix) {
    definirErro("consultaDocumento", "Informe um documento ou uma chave Pix.");
    definirErro("consultaChavePix", "Informe um documento ou uma chave Pix.");
    obterElemento("consultaDocumento").focus();
    return false;
  }

  if (documento && documento.length !== 11 && documento.length !== 14) {
    definirErro(
      "consultaDocumento",
      "Documento invalido. Informe um CPF com 11 numeros ou CNPJ com 14 numeros."
    );
    obterElemento("consultaDocumento").focus();
    return false;
  }

  return true;
}

async function login() {
  limparErrosCampos(["loginEmail", "loginSenha"]);
  ocultarMensagem("mensagemLogin");

  const emailOk = validarEmail("loginEmail");
  const senhaOk = validarTextoObrigatorio("loginSenha", "Informe a senha.");

  if (!emailOk || !senhaOk) {
    return;
  }

  const resp = await fetch(AUTH_API + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: normalizarValor(valorDoCampo("loginEmail")),
      senha: valorDoCampo("loginSenha")
    })
  });

  if (!resp.ok) {
    definirMensagem(
      "mensagemLogin",
      await obterMensagemErro(resp, "Nao foi possivel entrar."),
      "danger"
    );
    return;
  }

  const usuario = await resp.json();
  redirecionarPorPerfil(usuario);
}

async function registrar() {
  limparErrosCampos([
    "registerNome",
    "registerTelefone",
    "registerEmail",
    "registerSenha",
    "registerConfirmarSenha",
    "registerCnpj"
  ]);
  ocultarMensagem("mensagemRegister");

  const tipoUsuario = tipoUsuarioSelecionado();
  const validacoes = [
    validarTextoObrigatorio("registerNome", "Informe o nome."),
    validarTelefone("registerTelefone", true),
    validarEmail("registerEmail"),
    validarSenha("registerSenha"),
    validarConfirmacaoSenha()
  ];

  if (tipoUsuario === "EMPRESA") {
    validacoes.push(validarCnpj("registerCnpj"));
  }

  if (validacoes.some(function (ok) { return !ok; })) {
    return;
  }

  const resp = await fetch(AUTH_API + "/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: normalizarValor(valorDoCampo("registerNome")),
      telefone: apenasNumeros(valorDoCampo("registerTelefone")),
      email: normalizarValor(valorDoCampo("registerEmail")),
      senha: valorDoCampo("registerSenha"),
      tipoUsuario: tipoUsuario,
      cnpj: tipoUsuario === "EMPRESA" ? apenasNumeros(valorDoCampo("registerCnpj")) : null
    })
  });

  if (!resp.ok) {
    definirMensagem(
      "mensagemRegister",
      await obterMensagemErro(resp, "Nao foi possivel criar a conta."),
      "danger"
    );
    return;
  }

  const usuario = await resp.json();
  redirecionarPorPerfil(usuario);
}

async function logout() {
  await fetch(AUTH_API + "/logout", { method: "POST" });
  window.location.href = "/index.html";
}

async function verificarChaveiro() {
  ocultarMensagem("mensagemConsulta");
  limparResultadoConsulta();

  if (!validarConsultaRapida()) {
    return;
  }

  const documento = apenasNumeros(valorDoCampo("consultaDocumento"));
  const chavePix = encodeURIComponent(normalizarValor(valorDoCampo("consultaChavePix")));
  const url = `${CHAVEIRO_API}/busca?documento=${documento}&chavePix=${chavePix}`;
  const resp = await requisicaoJson(url);

  if (!resp.ok) {
    definirMensagem(
      "mensagemConsulta",
      await obterMensagemErro(resp, "Nenhum chaveiro encontrado para os dados informados."),
      "danger"
    );
    return;
  }

  const chaveiro = await resp.json();
  preencherResultadoConsulta(chaveiro);
  definirValorDoCampo("consultaDocumento", formatarDocumento(chaveiro.documento || documento));
  definirValorDoCampo("consultaChavePix", chaveiro.chavePix || normalizarValor(valorDoCampo("consultaChavePix")));

  const resultado = mensagemConsultaPorStatus(chaveiro);
  definirMensagem("mensagemConsulta", resultado.texto, resultado.tipo);
}

async function incluir() {
  ocultarMensagem("mensagemAdmin");
  if (!validarCadastroCompleto()) {
    return;
  }

  const chaveiro = montarChaveiro();
  const resp = await requisicaoJson(CHAVEIRO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chaveiro)
  });

  definirMensagem(
    "mensagemAdmin",
    resp.ok ? "Chaveiro cadastrado com sucesso." : await obterMensagemErro(resp, "Erro ao cadastrar chaveiro."),
    resp.ok ? "success" : "danger"
  );

  if (resp.ok) {
    cancelarFluxoAdmin(false);
    listar();
  }
}

async function salvarAlteracaoSelecionada() {
  ocultarMensagem("mensagemAdmin");
  if (!cadastroSelecionadoId) {
    definirMensagem("mensagemAdmin", "Selecione um cadastro para alterar.", "warning");
    return;
  }

  if (!validarCadastroCompleto()) {
    return;
  }

  const chaveiro = montarChaveiro();
  const resp = await requisicaoJson(CHAVEIRO_API + "/id/" + cadastroSelecionadoId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chaveiro)
  });

  definirMensagem(
    "mensagemAdmin",
    resp.ok ? "Chaveiro atualizado com sucesso." : await obterMensagemErro(resp, "Erro ao atualizar chaveiro."),
    resp.ok ? "success" : "danger"
  );

  if (resp.ok) {
    cancelarFluxoAdmin(false);
    listar();
  }
}

async function concluirExclusaoSelecionada() {
  ocultarMensagem("mensagemAdmin");
  if (!cadastroSelecionadoId) {
    definirMensagem("mensagemAdmin", "Selecione um cadastro para excluir.", "warning");
    return;
  }

  const resp = await requisicaoJson(CHAVEIRO_API + "/id/" + cadastroSelecionadoId, { method: "DELETE" });

  definirMensagem(
    "mensagemAdmin",
    resp.ok ? "Chaveiro excluido com sucesso." : await obterMensagemErro(resp, "Chaveiro nao encontrado."),
    resp.ok ? "success" : "warning"
  );

  if (resp.ok) {
    cancelarFluxoAdmin(false);
    listar();
  }
}

async function listar() {
  if (!existeElemento("lista")) {
    return;
  }

  const resp = await requisicaoJson(CHAVEIRO_API);
  if (!resp.ok) {
    return;
  }

  todosChaveiros = await resp.json();
  atualizarSugestoesFiltros();
  aplicarFiltrosTabela();
}

function registrarEventos() {
  documentoFields.forEach(function (id) {
    if (existeElemento(id)) {
      obterElemento(id).addEventListener("input", aplicarMascaraDocumento);
    }
  });

  ["telefone", "registerTelefone"].forEach(function (id) {
    if (existeElemento(id)) {
      obterElemento(id).addEventListener("input", aplicarMascaraTelefone);
    }
  });

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
      }
      if (fieldId.indexOf("login") === 0) {
        ocultarMensagem("mensagemLogin");
      }
      if (fieldId.indexOf("register") === 0) {
        ocultarMensagem("mensagemRegister");
      }
      if (["documento", "nome", "telefone", "cidade", "chavePix", "status", "observacao"].includes(fieldId)) {
        ocultarMensagem("mensagemAdmin");
      }
    });

    campo.addEventListener("change", function () {
      limparErro(fieldId);
    });
  });

  if (existeElemento("registerSenha")) {
    obterElemento("registerSenha").addEventListener("input", function () {
      if (valorDoCampo("registerConfirmarSenha")) {
        validarConfirmacaoSenha();
      }
    });
  }

  if (existeElemento("registerConfirmarSenha")) {
    obterElemento("registerConfirmarSenha").addEventListener("input", function () {
      validarConfirmacaoSenha();
    });
  }
}

async function inicializarAplicacao() {
  registrarEventos();

  if (obterPaginaAtual() === "login") {
    await inicializarLogin();
    return;
  }

  const precisaEmpresa = obterPaginaAtual() === "admin";
  const autorizado = await exigirAutenticacao(precisaEmpresa);
  if (!autorizado) {
    return;
  }

  await carregarTiposTrabalho();
  await listar();
}

inicializarAplicacao();
