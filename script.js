// ===== CONFIGURAÇÕES GLOBAIS =====

/**
 * Prefixos de senha por prioridade de atendimento.
 * 'U' = Urgente | 'M' = Média | 'L' = Leve
 */
const PASSWORD_PREFIX = { U: 'u', M: 'm', L: 'l' };

/** Estado global da aplicação */
let currentUser = null;

let chatData = {
    messages: [],
    currentStep: 0,
    answers: {},
    classification: null,
    password: null,
};

// ===== INICIALIZAÇÃO =====

document.addEventListener('DOMContentLoaded', () => {
    const loggedUser = safeLocalStorageGet('currentUser');
    if (loggedUser) {
        // Restaurar apenas dados não-sensíveis
        currentUser = { nome: loggedUser.nome, cpf: loggedUser.cpf, sus: loggedUser.sus };
        updateHeaderForLoggedUser();
    }
    initInputMasks();
    checkLogo();
});

// ===== SEGURANÇA: SANITIZAÇÃO =====

/**
 * Escapa caracteres HTML para prevenir XSS.
 * Use sempre que inserir entrada do usuário no DOM via innerHTML.
 * @param {string} str
 * @returns {string}
 */
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// ===== STORAGE SEGURO =====

function safeLocalStorageGet(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch {
        return null;
    }
}

function safeLocalStorageSet(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        showToast('Erro ao salvar dados locais.', 'error');
        return false;
    }
}

// ===== NAVEGAÇÃO =====

function showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screenName}`);
    if (target) target.classList.add('active');
    if (screenName === 'painel' && currentUser) initChat();
}

function updateHeaderForLoggedUser() {
    const firstName = sanitizeHTML(currentUser.nome.split(' ')[0]);
    document.getElementById('nav-buttons').innerHTML = `
        <span style="color: var(--primary-blue); font-weight: 600;">Olá, ${firstName}</span>
        <button class="btn btn-primary" onclick="showScreen('painel')">Painel</button>
        <button class="btn btn-secondary" onclick="showScreen('sobre')">Sobre</button>
        <button class="btn btn-secondary" onclick="logout()">Sair</button>
    `;
}

function logout() {
    currentUser = null;
    try { localStorage.removeItem('currentUser'); } catch { /* ok */ }
    location.reload();
}

// ===== MÁSCARAS DE INPUT =====

function applyMask(input, maskFn) {
    input.addEventListener('input', (e) => {
        const digits = e.target.value.replace(/\D/g, '');
        e.target.value = maskFn(digits);
    });
}

function maskCPFInput(digits) {
    if (digits.length > 11) digits = digits.slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function maskSUSInput(digits) {
    if (digits.length > 15) digits = digits.slice(0, 15);
    return digits
        .replace(/(\d{3})(\d)/, '$1 $2')
        .replace(/(\d{4})(\d)/, '$1 $2')
        .replace(/(\d{4})(\d)/, '$1 $2');
}

function maskPhoneInput(digits) {
    if (digits.length > 11) digits = digits.slice(0, 11);
    return digits
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
}

function initInputMasks() {
    const cpfInput = document.getElementById('cad-cpf');
    if (cpfInput) applyMask(cpfInput, maskCPFInput);

    const susInput = document.getElementById('cad-sus');
    if (susInput) applyMask(susInput, maskSUSInput);

    const telInput = document.getElementById('cad-telefone');
    if (telInput) applyMask(telInput, maskPhoneInput);

    // O campo de login aceita CPF *ou* SUS — sem máscara automática
    // para não corromper a entrada de SUS.
}

// ===== VALIDAÇÕES =====

function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    const calcDigit = (slice, factor) =>
        (11 - (slice.split('').reduce((acc, d, i) => acc + Number(d) * (factor - i), 0) % 11)) % 11;

    const d1 = calcDigit(cpf.slice(0, 9), 10) > 9 ? 0 : calcDigit(cpf.slice(0, 9), 10);
    const d2 = calcDigit(cpf.slice(0, 10), 11) > 9 ? 0 : calcDigit(cpf.slice(0, 10), 11);

    return Number(cpf[9]) === d1 && Number(cpf[10]) === d2;
}

function validateSUS(sus) {
    const clean = sus.replace(/\D/g, '');
    return clean.length === 15;
}

// ===== HASH DE SENHA =====
// ATENÇÃO: SHA-256 no cliente é adequado apenas para demonstração.
// Em produção, use bcrypt/argon2 no backend com HTTPS.

async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ===== CADASTRO =====

async function handleCadastro(event) {
    event.preventDefault();

    const nome      = document.getElementById('cad-nome').value.trim();
    const cpf       = document.getElementById('cad-cpf').value;
    const sus       = document.getElementById('cad-sus').value;
    const nascimento = document.getElementById('cad-nascimento').value;
    const telefone  = document.getElementById('cad-telefone').value;
    const senha     = document.getElementById('cad-senha').value;
    const confirm   = document.getElementById('cad-senha-confirm').value;

    if (!validateCPF(cpf)) {
        showToast('CPF inválido! Verifique os dígitos.', 'error');
        return;
    }
    if (!validateSUS(sus)) {
        showToast('Cartão SUS inválido! Deve conter 15 dígitos.', 'error');
        return;
    }
    if (senha !== confirm) {
        showToast('As senhas não coincidem!', 'error');
        return;
    }

    const cpfClean = cpf.replace(/\D/g, '');
    const susClean = sus.replace(/\D/g, '');
    const users    = safeLocalStorageGet('users') || [];

    if (users.some(u => u.cpf === cpfClean || u.sus === susClean)) {
        showToast('CPF ou Cartão SUS já cadastrado!', 'error');
        return;
    }

    const senhaHash = await hashPassword(senha);
    users.push({ nome, cpf: cpfClean, sus: susClean, nascimento, telefone: telefone.replace(/\D/g, ''), senhaHash });
    safeLocalStorageSet('users', users);

    showToast('Cadastro realizado com sucesso! Faça login.', 'success');
    document.getElementById('form-cadastro').reset();
    setTimeout(() => showScreen('login'), 1500);
}

// ===== LOGIN =====

async function handleLogin(event) {
    event.preventDefault();

    const id       = document.getElementById('login-id').value.replace(/\D/g, '');
    const senha    = document.getElementById('login-senha').value;
    const users    = safeLocalStorageGet('users') || [];
    const senhaHash = await hashPassword(senha);

    const user = users.find(u =>
        (u.cpf === id || u.sus === id) && u.senhaHash === senhaHash
    );

    if (!user) {
        showToast('CPF/SUS ou senha incorretos!', 'error');
        return;
    }

    // Armazenar apenas dados não-sensíveis na sessão
    currentUser = { nome: user.nome, cpf: user.cpf, sus: user.sus };
    safeLocalStorageSet('currentUser', currentUser);

    showToast('Login realizado com sucesso!', 'success');
    updateHeaderForLoggedUser();
    setTimeout(() => showScreen('painel'), 1000);
}

// ===== PERGUNTAS DO CHAT =====

const CHAT_QUESTIONS = [
    {
        id: 'greeting',
        text: 'Olá! Eu sou a AMÉLIA 🤖. É um prazer ajudá-lo hoje. Como você está se sentindo?',
        type: 'text',
    },
    {
        id: 'pain_level',
        text: 'De 1 a 10, qual o seu nível de dor ou desconforto? (1 = muito leve, 10 = insuportável)',
        type: 'number',
        validate: (v) => {
            const n = Number(v);
            return Number.isInteger(n) && n >= 1 && n <= 10;
        },
        errorMessage: 'Por favor, insira um número inteiro entre 1 e 10.',
    },
    {
        id: 'symptoms',
        text: 'Você está com febre, falta de ar ou outro sintoma grave?',
        type: 'text',
    },
    {
        id: 'duration',
        text: 'Há quanto tempo os sintomas começaram? (Ex: 2 dias, 1 semana, algumas horas)',
        type: 'text',
    },
    {
        id: 'additional',
        text: 'Há mais alguma informação importante que você gostaria de compartilhar?',
        type: 'text',
    },
];

const ACK_MESSAGES = [
    'Entendo. Obrigada por compartilhar isso comigo.',
    'Sinto muito que esteja passando por isso.',
    'Agradeço pela sua confiança em relatar isso.',
    'Compreendo sua situação.',
];

// ===== SISTEMA DE CHAT =====

function initChat() {
    chatData = { messages: [], currentStep: 0, answers: {}, classification: null, password: null };

    document.getElementById('chat-messages').innerHTML = '';
    document.getElementById('chat-input-area').style.display = 'flex';
    document.getElementById('chat-actions').style.display = 'none';

    setTimeout(() => {
        addBotMessage(CHAT_QUESTIONS[0].text);
        enableChatInput();
    }, 500);
}

function addBotMessage(htmlText) {
    const container = document.getElementById('chat-messages');

    const typing = document.createElement('div');
    typing.className = 'message message-bot';
    typing.innerHTML = `
        <div class="avatar">🤖</div>
        <div class="typing-indicator"><span></span><span></span><span></span></div>
    `;
    container.appendChild(typing);
    scrollToBottom();

    setTimeout(() => {
        typing.remove();
        const msg = document.createElement('div');
        msg.className = 'message message-bot';
        // htmlText vem apenas de strings internas controladas — nunca de entrada do usuário
        msg.innerHTML = `<div class="avatar">🤖</div><div class="message-content">${htmlText}</div>`;
        container.appendChild(msg);
        scrollToBottom();
    }, 1000 + Math.random() * 500);
}

function addUserMessage(text) {
    const container = document.getElementById('chat-messages');
    const msg = document.createElement('div');
    msg.className = 'message message-user';
    // sanitizeHTML previne XSS: a entrada do usuário é tratada como texto puro
    msg.innerHTML = `<div class="message-content">${sanitizeHTML(text)}</div>`;
    container.appendChild(msg);
    scrollToBottom();
}

function enableChatInput() {
    const input  = document.getElementById('chat-input');
    const button = document.getElementById('chat-send');
    input.disabled  = false;
    button.disabled = false;
    input.focus();

    // keydown substitui o depreciado onkeypress
    input.onkeydown = (e) => {
        if (e.key === 'Enter' && !button.disabled) sendMessage();
    };
}

function disableChatInput() {
    document.getElementById('chat-input').disabled  = true;
    document.getElementById('chat-send').disabled   = true;
}

function sendMessage() {
    const input   = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    const question = CHAT_QUESTIONS[chatData.currentStep];

    // Executar validação customizada se existir
    if (question.validate && !question.validate(message)) {
        showToast(question.errorMessage || 'Resposta inválida. Tente novamente.', 'warning');
        return;
    }

    addUserMessage(message);
    input.value = '';
    disableChatInput();

    chatData.answers[question.id] = message;
    chatData.currentStep++;

    if (chatData.currentStep < CHAT_QUESTIONS.length) {
        setTimeout(() => {
            const ack = ACK_MESSAGES[Math.floor(Math.random() * ACK_MESSAGES.length)];
            addBotMessage(ack);
            setTimeout(() => {
                addBotMessage(CHAT_QUESTIONS[chatData.currentStep].text);
                enableChatInput();
            }, 1500);
        }, 800);
    } else {
        finishChat();
    }
}

// ===== CLASSIFICAÇÃO DE TRIAGEM =====

const URGENT_KEYWORDS = [
    'febre', 'falta de ar', 'respirar', 'grave', 'desmaio',
    'convulsão', 'sangrando', 'sangramento', 'vômito', 'peito',
];

function classifyPatient(painLevel, symptomsText) {
    const symptoms = symptomsText.toLowerCase();
    const hasUrgentSymptom = URGENT_KEYWORDS.some(kw => symptoms.includes(kw));
    if (painLevel >= 8 || hasUrgentSymptom) return 'U';
    if (painLevel >= 5) return 'M';
    return 'L';
}

function finishChat() {
    setTimeout(() => {
        addBotMessage('Obrigada pelas informações! Vou analisar seus dados e gerar sua senha de atendimento.');

        setTimeout(() => {
            const painLevel = parseInt(chatData.answers.pain_level, 10) || 0;
            const symptoms  = chatData.answers.symptoms || '';

            chatData.classification = classifyPatient(painLevel, symptoms);
            chatData.password       = generatePassword(chatData.classification);

            const labelMap = {
                U: 'URGENTE - Você será atendido em breve',
                M: 'MÉDIA PRIORIDADE - Aguarde na fila de atendimento',
                L: 'BAIXA PRIORIDADE - Aguarde ser chamado',
            };

            addBotMessage(`
                Sua triagem foi concluída com sucesso!<br><br>
                <strong>Classificação:</strong><br>
                <span class="priority-${chatData.classification} priority-badge">${labelMap[chatData.classification]}</span><br><br>
                <strong>Sua senha:</strong>
                <span style="font-size:1.5em; font-weight:bold; color:var(--primary-blue);">${sanitizeHTML(chatData.password)}</span><br><br>
                Por favor, baixe seu prontuário em PDF e apresente-o no guichê de atendimento.
            `);

            document.getElementById('chat-input-area').style.display = 'none';
            document.getElementById('chat-actions').style.display    = 'flex';
        }, 2000);
    }, 1000);
}

// ===== GERAÇÃO DE SENHA =====

function generatePassword(classification) {
    const prefix   = PASSWORD_PREFIX[classification] ?? 'l';
    const counters = safeLocalStorageGet('passwordCounters') || {};
    counters[prefix] = (counters[prefix] || 0) + 1;
    safeLocalStorageSet('passwordCounters', counters);
    return prefix + String(counters[prefix]).padStart(3, '0');
}

// ===== GERAÇÃO DE PDF =====

function generatePDF() {
    if (typeof window.jspdf === 'undefined') {
        showToast('Erro ao carregar biblioteca de PDF. Recarregue a página.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc  = new jsPDF();
    const now  = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR');

    // Cabeçalho
    doc.setFontSize(20).setTextColor(0, 102, 204);
    doc.text('PRONTUÁRIO DE TRIAGEM', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('A.M.E.L.I.A', 105, 30, { align: 'center' });
    doc.setDrawColor(0, 102, 204).line(20, 35, 190, 35);

    // Dados do paciente
    doc.setFontSize(12).setTextColor(0, 0, 0).setFont(undefined, 'bold');
    doc.text('DADOS DO PACIENTE', 20, 45);
    doc.setFont(undefined, 'normal');
    doc.text(`Nome: ${currentUser.nome}`, 20, 55);
    doc.text(`CPF: ${maskCPF(currentUser.cpf)}`, 20, 62);
    doc.text(`Cartão SUS: ${maskSUS(currentUser.sus)}`, 20, 69);
    doc.text(`Data: ${dateStr}`, 20, 76);
    doc.text(`Hora: ${timeStr}`, 20, 83);
    doc.line(20, 88, 190, 88);

    // Respostas da triagem
    doc.setFont(undefined, 'bold');
    doc.text('INFORMAÇÕES DA TRIAGEM', 20, 98);
    doc.setFont(undefined, 'normal');

    let y = 108;
    CHAT_QUESTIONS.forEach((q, i) => {
        if (q.id === 'greeting') return;
        const answer = chatData.answers[q.id] || '';
        const qLines = doc.splitTextToSize(`${i}. ${q.text}`, 170);
        doc.setFont(undefined, 'bold').text(qLines, 20, y);
        y += qLines.length * 7;
        const aLines = doc.splitTextToSize(`R: ${answer}`, 170);
        doc.setFont(undefined, 'normal').text(aLines, 20, y);
        y += aLines.length * 7 + 5;
        if (y > 250) { doc.addPage(); y = 20; }
    });

    // Classificação e senha
    y += 5;
    doc.line(20, y, 190, y);
    y += 10;

    const classLabel = { U: 'URGENTE', M: 'MÉDIA PRIORIDADE', L: 'BAIXA PRIORIDADE' };
    doc.setFont(undefined, 'bold').setFontSize(14).setTextColor(0, 0, 0);
    doc.text(`CLASSIFICAÇÃO: ${classLabel[chatData.classification]}`, 20, y);
    y += 10;
    doc.setFontSize(16).setTextColor(0, 102, 204);
    doc.text(`SENHA: ${chatData.password}`, 20, y);

    // Rodapé
    doc.setFontSize(10).setTextColor(100, 100, 100).setFont(undefined, 'italic');
    doc.text('Leve este prontuário ao guichê de atendimento.', 105, 280, { align: 'center' });

    const filename = `Prontuario_${currentUser.nome.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`;
    doc.save(filename);
    showToast('Prontuário baixado com sucesso!', 'success');
}

// ===== UTILITÁRIOS =====

function maskCPF(cpf) {
    return `${cpf.slice(0,3)}.${cpf.slice(3,6)}.${cpf.slice(6,9)}-${cpf.slice(9,11)}`;
}

function maskSUS(sus) {
    return `${sus.slice(0,3)} ${sus.slice(3,7)} ${sus.slice(7,11)} ${sus.slice(11,15)}`;
}

function scrollToBottom() {
    const el = document.getElementById('chat-messages');
    el.scrollTop = el.scrollHeight;
}

function resetChat() {
    showToast('Iniciando nova triagem...', 'success');
    setTimeout(initChat, 500);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className   = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function checkLogo() {
    // Definir onerror antes do src para evitar race condition
    const logo = document.getElementById('logo-img');
    if (!logo) return;
    logo.addEventListener('error', function onError() {
        logo.removeEventListener('error', onError);
        logo.style.display = 'none';
        const logoText = document.querySelector('.logo-text');
        if (logoText) logoText.textContent = '🏥 A.M.E.L.I.A';
    });
}

// ===== NOTAS PARA DESENVOLVEDORES =====
/*
CONFIGURAÇÃO:

1. SEQUÊNCIA DE SENHAS:
   - Edite PASSWORD_PREFIX no topo para alterar os prefixos por prioridade.

2. LIMPAR DADOS PARA TESTES (console do navegador):
   > localStorage.clear()

3. SEGURANÇA (PRODUÇÃO):
   - Nunca armazene dados sensíveis no frontend.
   - Use backend com banco de dados, bcrypt, HTTPS e JWT.

4. PERSONALIZAÇÃO DO CHAT:
   - Edite CHAT_QUESTIONS para alterar as perguntas.
   - Edite URGENT_KEYWORDS para refinar a classificação de urgência.
*/
