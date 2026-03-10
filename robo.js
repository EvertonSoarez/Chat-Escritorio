const { Client, LocalAuth } = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")

// Armazena timestamp do último atendimento por cliente
const clientesAtendidos = new Map()

// Armazena sessões ativas dos clientes
const sessoesClientes = new Map()

// Cria o cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
})

// Quando o QR Code é gerado
client.on("qr", (qr) => {
  console.log("Escaneie o QR Code abaixo:")
  qrcode.generate(qr, { small: true })
})

// Quando o cliente está pronto
client.on("ready", () => {
  console.log("Bot conectado e pronto!")
})

// Função para obter saudação baseada no horário
function obterSaudacao() {
  const hora = new Date().getHours()
  if (hora >= 6 && hora < 12) return "Bom dia"
  if (hora >= 12 && hora < 18) return "Boa tarde"
  return "Boa noite"
}

// Função para gerar menu principal
function gerarMenuPrincipal() {
  return `Por favor, escolha uma opção:

1️⃣ Direito Previdenciário
2️⃣ Direito Trabalhista
3️⃣ Direito de Família
4️⃣ Links Úteis
5️⃣ Perguntas Frequentes
6️⃣ Relatar meu problema
7️⃣ Agendar atendimento
8️⃣ Falar com um advogado

Digite o número da opção desejada.`
}

// Mapeamento das opções de qualificação
const opcoesQualificacao = {
  previdenciario: {
    'a': 'Quero me aposentar',
    'b': 'Tive benefício negado', 
    'c': 'Quero fazer revisão',
    'd': 'Outro'
  },
  trabalhista: {
    'a': 'Fui demitido',
    'b': 'Sofri acidente de trabalho',
    'c': 'Não recebi verbas rescisórias',
    'd': 'Sofri assédio moral ou sexual',
    'e': 'Outro'
  },
  familia: {
    'a': 'Quero me divorciar',
    'b': 'Questões de pensão alimentícia',
    'c': 'Guarda de filhos', 
    'd': 'Partilha de bens',
    'e': 'Outro'
  }
}

// Função para obter texto da opção selecionada
function obterTextoOpcao(area, letra) {
  const areaOpcoes = opcoesQualificacao[area]
  if (areaOpcoes && areaOpcoes[letra.toLowerCase()]) {
    return areaOpcoes[letra.toLowerCase()]
  }
  return letra // Retorna a letra original se não encontrar mapeamento
}

// Links úteis por área
function gerarLinksUteis(area) {
  const links = {
    previdenciario: `📚 *Links Úteis - Direito Previdenciário*

🔗 Meu INSS: https://meu.inss.gov.br
🔗 Consultar benefícios: https://meu.inss.gov.br/#/beneficios
🔗 Simular aposentadoria: https://meu.inss.gov.br/#/simular
🔗 Portal Gov.br: https://www.gov.br/pt-br

Digite *MENU* para voltar ao menu principal.`,

    trabalhista: `📚 *Links Úteis - Direito Trabalhista*

🔗 Consultar CTPS Digital: https://www.gov.br/trabalho-e-previdencia/pt-br/assuntos/carteira-de-trabalho
🔗 Portal e-Social: https://login.esocial.gov.br
🔗 Consultar FGTS: https://www.fgts.gov.br
🔗 Justiça do Trabalho: https://www.tst.jus.br

Digite *MENU* para voltar ao menu principal.`,

    familia: `📚 *Links Úteis - Direito de Família*

🔗 Certidões Online: https://www.cnj.jus.br/certidoes-online/
🔗 Portal de Pensão Alimentícia: https://www.cnj.jus.br/poder-judiciario/portais-e-sistemas/pensao-alimenticia/
🔗 Registro Civil: https://www.registrocivil.org.br
🔗 Portal CNJ: https://www.cnj.jus.br

Digite *MENU* para voltar ao menu principal.`,
  }
  return links[area] || "Área não encontrada."
}

// Perguntas frequentes por área
function gerarPerguntasFrequentes(area) {
  const faqs = {
    previdenciario: `❓ *Perguntas Frequentes - Direito Previdenciário*

*1. Quando posso me aposentar?*
Depende da sua idade, tempo de contribuição e da regra de transição aplicável ao seu caso.

*2. Meu benefício foi negado, o que fazer?*
Você pode entrar com recurso administrativo ou ação judicial.

*3. Quanto tempo demora um processo no INSS?*
Na esfera administrativa, em média 45 a 90 dias, mas pode variar.

*4. Posso continuar trabalhando aposentado?*
Sim, é permitido pela legislação.

*5. Como funciona a revisão da vida toda?*
É uma ação para recalcular o benefício incluindo contribuições anteriores a 1994.

Digite *MENU* para voltar ao menu principal.`,

    trabalhista: `❓ *Perguntas Frequentes - Direito Trabalhista*

*1. Fui demitido sem justa causa, tenho direitos?*
Sim! Aviso prévio, férias proporcionais, 13º, FGTS e multa de 40%.

*2. Quanto tempo tenho para entrar com ação?*
2 anos após o fim do contrato para ações trabalhistas.

*3. Trabalhei sem carteira assinada, o que fazer?*
Pode entrar com ação de reconhecimento de vínculo empregatício.

*4. Como funciona o acordo trabalhista?*
É uma negociação entre empregado e empregador com homologação judicial.

*5. O que é assédio moral no trabalho?*
Conduta abusiva, repetitiva que atenta contra a dignidade do trabalhador.

Digite *MENU* para voltar ao menu principal.`,

    familia: `❓ *Perguntas Frequentes - Direito de Família*

*1. Como funciona a pensão alimentícia?*
É calculada com base nas necessidades do alimentando e possibilidades do alimentante (normalmente 30% do salário).

*2. Quanto custa um divórcio?*
Varia conforme complexidade. Divórcios consensuais são mais rápidos e baratos.

*3. Guarda compartilhada é obrigatória?*
É a regra, salvo se prejudicar a criança.

*4. Como funciona a partilha de bens?*
Depende do regime de casamento (comunhão, separação total ou parcial).

*5. Quanto tempo demora um processo de divórcio?*
Consensual: 30-60 dias. Litigioso: 6 meses a 2 anos.

Digite *MENU* para voltar ao menu principal.`,
  }
  return faqs[area] || "Área não encontrada."
}

// Iniciar qualificação de demanda
function iniciarQualificacao(area) {
  const mensagens = {
    previdenciario: `📋 *Qualificação de Demanda - Previdenciário*

Vou fazer algumas perguntas para entender melhor sua situação:

*1. Qual é a sua situação?*
a) Quero me aposentar
b) Tive benefício negado
c) Quero fazer revisão
d) Outro

Digite a letra da sua resposta.`,

    trabalhista: `📋 *Qualificação de Demanda - Trabalhista*

Vou fazer algumas perguntas para entender melhor sua situação:

*1. Qual é a sua situação?*
a) Fui demitido
b) Sofri acidente de trabalho
c) Não recebi verbas rescisórias
d) Sofri assédio moral ou sexual
e) Outro

Digite a letra da sua resposta.`,

    familia: `📋 *Qualificação de Demanda - Família*

Vou fazer algumas perguntas para entender melhor sua situação:

*1. Qual é a sua situação?*
a) Quero me divorciar
b) Questões de pensão alimentícia
c) Guarda de filhos
d) Partilha de bens
e) Outro

Digite a letra da sua resposta.`,
  }
  return mensagens[area] || "Área não encontrada."
}

// Processar resposta da qualificação
function processarQualificacao(sessao, resposta) {
  if (!sessao.etapaQualificacao) {
    sessao.etapaQualificacao = 1
  }

  if (sessao.etapaQualificacao === 1) {
    // Converte a letra para o texto completo
    const textoCompleto = obterTextoOpcao(sessao.areaQualificacao, resposta)
    sessao.situacao = textoCompleto
    sessao.etapaQualificacao = 2
    return `Entendi que sua situação é: *${textoCompleto}*

Agora me conte com mais detalhes sobre sua situação:

Por favor, descreva brevemente o que aconteceu e suas principais dúvidas.`
  }

  if (sessao.etapaQualificacao === 2) {
    sessao.detalhes = resposta
    sessao.etapaQualificacao = 3
    return `Obrigado pelas informações! Por fim:

*Qual é o seu nome completo e telefone para contato?*

(Essas informações serão repassadas para um de nossos advogados que entrará em contato em breve.)`
  }

  if (sessao.etapaQualificacao === 3) {
    sessao.contato = resposta
    const resumo = `✅ *Qualificação Concluída!*

Suas informações foram registradas:
📌 Área: ${sessao.areaQualificacao}
📌 Situação: ${sessao.situacao}
📌 Detalhes: ${sessao.detalhes}
📌 Contato: ${sessao.contato}

Um de nossos advogados analisará seu caso e entrará em contato em até 24 horas úteis.

Digite *MENU* para voltar ao menu principal ou aguarde nosso contato.`

    // Limpa a sessão de qualificação
    delete sessao.emQualificacao
    delete sessao.etapaQualificacao
    delete sessao.areaQualificacao

    return resumo
  }
}

// Função para verificar gatilhos
function verificarGatilho(mensagem) {
  const gatilhos = [
    'teste robo',
    'teste robô',
    'robo teste', 
    'robô teste',
    'bot',
    'Bot',
    'teste bot',
    'teste bot'
  ]
  
  return gatilhos.some(gatilho => 
    mensagem.toLowerCase().includes(gatilho.toLowerCase())
  )
}

// Quando recebe mensagem
client.on("message", async (msg) => {
  try {
    // Ignora mensagens de grupos
    const chat = await msg.getChat()
    if (chat.isGroup) {
      console.log("[v0] Mensagem de grupo ignorada")
      return
    }

    const mensagemTexto = msg.body.toLowerCase().trim()
    const clienteId = msg.from

    console.log(`[v0] Mensagem recebida de ${clienteId}: "${msg.body}"`)

    // Verifica se é uma mensagem de menu
    if (mensagemTexto === "menu") {
      const sessao = sessoesClientes.get(clienteId) || {}
      sessao.emMenu = true
      sessao.emQualificacao = false
      sessoesClientes.set(clienteId, sessao)
      await msg.reply(gerarMenuPrincipal())
      return
    }

    // Se está em processo de qualificação
    const sessao = sessoesClientes.get(clienteId)
    if (sessao && sessao.emQualificacao) {
      const resposta = processarQualificacao(sessao, msg.body)
      sessoesClientes.set(clienteId, sessao)
      await msg.reply(resposta)
      return
    }

    // Se está no menu, processa opções
    if (sessao && sessao.emMenu) {
      const opcao = mensagemTexto

      // Opções do menu principal
      if (opcao === "1" || mensagemTexto.includes("previdenci")) {
        sessao.areaAtual = "previdenciario"
        sessao.emMenu = false
        sessoesClientes.set(clienteId, sessao)
        await msg.reply(`⚖️ *Direito Previdenciário*

Atuamos em:
✅ Aposentadorias (idade, tempo de contribuição, especial)
✅ Pensão por morte
✅ Auxílio-doença e acidente
✅ BPC/LOAS
✅ Revisão de benefícios
✅ Recursos e ações contra o INSS

O que você deseja saber?
1️⃣ Links úteis
2️⃣ Perguntas frequentes
3️⃣ Relatar meu problema

Digite *MENU* para voltar.`)
        return
      }

      if (opcao === "2" || mensagemTexto.includes("trabalhista")) {
        sessao.areaAtual = "trabalhista"
        sessao.emMenu = false
        sessoesClientes.set(clienteId, sessao)
        await msg.reply(`⚖️ *Direito Trabalhista*

Atuamos em:
✅ Demissões sem justa causa
✅ Verbas rescisórias
✅ Horas extras
✅ Acidente de trabalho
✅ Assédio moral e sexual
✅ Reconhecimento de vínculo

O que você deseja saber?
1️⃣ Links úteis
2️⃣ Perguntas frequentes
3️⃣ Relatar meu problema

Digite *MENU* para voltar.`)
        return
      }

      if (opcao === "3" || mensagemTexto.includes("família")) {
        sessao.areaAtual = "familia"
        sessao.emMenu = false
        sessoesClientes.set(clienteId, sessao)
        await msg.reply(`⚖️ *Direito de Família*

Atuamos em:
✅ Divórcio consensual e litigioso
✅ Pensão alimentícia
✅ Guarda de filhos
✅ Partilha de bens
✅ União estável
✅ Inventário

O que você deseja saber?
1️⃣ Links úteis
2️⃣ Perguntas frequentes
3️⃣ Relatar meu problema

Digite *MENU* para voltar.`)
        return
      }

      if (opcao === "4") {
        await msg.reply(`📚 *Links Úteis por Área*

Escolha a área para ver os links:
1️⃣ Direito Previdenciário
2️⃣ Direito Trabalhista
3️⃣ Direito de Família

Digite *MENU* para voltar.`)
        return
      }

      if (opcao === "5") {
        await msg.reply(`❓ *Perguntas Frequentes por Área*

Escolha a área:
1️⃣ Direito Previdenciário
2️⃣ Direito Trabalhista
3️⃣ Direito de Família

Digite *MENU* para voltar.`)
        return
      }

      if (opcao === "6") {
        await msg.reply(`📋 *Qualificação de Demanda*

Escolha a área da sua demanda:
1️⃣ Direito Previdenciário
2️⃣ Direito Trabalhista
3️⃣ Direito de Família

Digite *MENU* para voltar.`)
        return
      }

      if (opcao === "7") {
        await msg.reply(`📅 *Agendamento de Atendimento*

Para agendar um atendimento presencial ou online, entre em contato:

📞 Telefone: (55) 98475789
📧 Email: everton.soarez@hotmail.com
📍 Endereço: Rua Tiradentes, 2634, Uruguaiana - RS
📍 Endereço: Rua 7 de Setembro, 885, Galeria Pujol, Sala 15, 2634, Quaraí - RS

Horário de atendimento:
Segunda a Sexta: 9h às 18h

Digite *MENU* para voltar ao menu principal.`)
        return
      }

      if (opcao === "8") {
        await msg.reply(`👨‍⚖️ *Falar com um Advogado*

Nossa equipe está disponível para atendimento personalizado:

📞 Telefone: (55) 98475789
📧 Email: everton.soarez@hotmail.com
📍 Endereço: Rua Tiradentes, 2634, Uruguaiana - RS
📍 Endereço: Rua 7 de Setembro, 885, Galeria Pujol, Sala 15, 2634, Quaraí - RS

Ou aguarde que um de nossos advogados entrará em contato em breve!

Digite *MENU* para voltar ao menu principal.`)
        return
      }
    }

    // Se tem área selecionada, processa subopções
    if (sessao && sessao.areaAtual) {
      const area = sessao.areaAtual

      if (mensagemTexto === "1") {
        await msg.reply(gerarLinksUteis(area))
        return
      }

      if (mensagemTexto === "2") {
        await msg.reply(gerarPerguntasFrequentes(area))
        return
      }

      if (mensagemTexto === "3") {
        sessao.emQualificacao = true
        sessao.areaQualificacao = area
        sessoesClientes.set(clienteId, sessao)
        await msg.reply(iniciarQualificacao(area))
        return
      }
    }

    // Verifica gatilhos iniciais (incluindo os novos)
    if (verificarGatilho(mensagemTexto) || mensagemTexto === "teste robo" || mensagemTexto === "robo teste") {
      const agora = Date.now()
      const ultimoAtendimento = clientesAtendidos.get(clienteId)

      console.log(`[v0] Gatilho detectado! Cliente: ${clienteId}`)

      // Verifica se já atendeu nas últimas 24 horas
      if (ultimoAtendimento) {
        const diferencaHoras = (agora - ultimoAtendimento) / (1000 * 60 * 60)
        if (diferencaHoras < 24) {
          console.log(
            `[v0] Cliente ${clienteId} já foi atendido há ${diferencaHoras.toFixed(1)} horas. Aguardando 24h para responder novamente.`,
          )
          return
        }
      }

      console.log(`[v0] Enviando resposta inicial para ${clienteId}`)

      // Registra o atendimento
      clientesAtendidos.set(clienteId, agora)

      // Cria sessão para o cliente
      const novaSessao = {
        emMenu: true,
        iniciado: agora,
      }
      sessoesClientes.set(clienteId, novaSessao)

      const saudacao = obterSaudacao()
      const mensagemInicial = `${saudacao}! 👋

Seja bem-vindo(a) ao Escritório de Advocacia

Somos especializados em:
⚖️ Direito Previdenciário
⚖️ Direito Trabalhista  
⚖️ Direito de Família

${gerarMenuPrincipal()}`

      await msg.reply(mensagemInicial)
      console.log(`[v0] Resposta enviada com sucesso para ${clienteId}`)
    }
  } catch (error) {
    console.error("[v0] Erro ao processar mensagem:", error)
  }
})

// Inicializa o cliente
client.initialize()


console.log("Iniciando bot do WhatsApp...")
