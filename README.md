# 🤖 A.M.E.L.I.A
### Atendimento Médico Eficiente Lenitivo com Inteligência Artificial

> Sistema inteligente de triagem médica que otimiza o atendimento em UBSs e pronto-atendimentos, reduzindo filas e proporcionando uma experiência humanizada via chatbot de triagem assistida.

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias](#-tecnologias)
- [Funcionalidades](#-funcionalidades)
- [Como Rodar Localmente](#-como-rodar-localmente)
- [Deploy na Vercel via GitHub](#-deploy-na-vercel-via-github)
- [Estrutura de Arquivos](#-estrutura-de-arquivos)
- [Aviso de Segurança](#-aviso-de-segurança)
- [Equipe](#-equipe)

---

## 🏥 Sobre o Projeto

A **AMÉLIA** é uma aplicação web de triagem médica que guia o paciente por um chatbot empático, coleta informações sobre seus sintomas e gera automaticamente:

- Uma **classificação de prioridade** (Urgente / Média / Baixa)
- Uma **senha de atendimento** sequencial
- Um **prontuário em PDF** para apresentar no guichê

O projeto foi desenvolvido no âmbito do curso de **Robótica e Inteligência Artificial – 2ª série EM** do Colégio Visconde de Porto Seguro.

---

## 🛠 Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 | Estrutura e semântica |
| CSS3 (Custom Properties) | Estilização e animações |
| JavaScript (ES2020+) | Lógica de negócio, chat, validações |
| Web Crypto API (`crypto.subtle`) | Hash SHA-256 de senhas |
| jsPDF 2.5 | Geração de prontuário em PDF |
| localStorage | Persistência de dados no cliente |

> **Sem frameworks, sem build tools.** O projeto roda com zero dependências instaladas — basta abrir o `index.html`.

---

## ✨ Funcionalidades

- ✅ Cadastro de pacientes com validação de **CPF** (dígitos verificadores) e **Cartão SUS**
- ✅ Login por CPF ou Cartão SUS
- ✅ Hash de senha com **SHA-256** via Web Crypto API
- ✅ Chatbot de triagem com reconhecimento empático
- ✅ Classificação automática: **Urgente / Média / Baixa** prioridade
- ✅ Geração de senha sequencial por prioridade (`u001`, `m001`, `l001`...)
- ✅ Exportação de **prontuário em PDF**
- ✅ Interface responsiva (mobile-first)
- ✅ Animações e feedback visual (toast notifications)

---

## 💻 Como Rodar Localmente

### Pré-requisitos

- Qualquer navegador moderno: **Chrome 80+**, **Firefox 75+**, **Safari 14+** ou **Edge 80+**
- Não requer Node.js, npm ou qualquer servidor de backend

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/amelia-triagem.git

# 2. Acesse a pasta do projeto
cd amelia-triagem
```

**Opção A — Abrir diretamente no navegador:**
```bash
# No macOS
open index.html

# No Linux
xdg-open index.html

# No Windows
start index.html
```

**Opção B — Usar um servidor local simples (recomendado):**
```bash
# Com Python 3
python3 -m http.server 8080

# Com Node.js (npx)
npx serve .

# Com PHP
php -S localhost:8080
```

Acesse em: `http://localhost:8080`

### Limpar dados entre testes

Abra o Console do navegador (`F12`) e execute:
```js
localStorage.clear()
```

---

## 🚀 Deploy na Vercel via GitHub

### Pré-requisitos

- Conta gratuita em [vercel.com](https://vercel.com)
- Conta no [GitHub](https://github.com) com o repositório criado

### Passo 1 — Enviar o código para o GitHub

```bash
git init
git add .
git commit -m "feat: initial commit – sistema de triagem AMÉLIA"
git branch -M main
git remote add origin https://github.com/seu-usuario/amelia-triagem.git
git push -u origin main
```

### Passo 2 — Conectar o repositório à Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e clique em **"Import Git Repository"**
2. Autorize o acesso ao GitHub se solicitado
3. Selecione o repositório `amelia-triagem`
4. Na tela de configuração, **não altere nada** — a Vercel detecta automaticamente que é um site estático:
   - **Framework Preset:** `Other`
   - **Build Command:** *(deixe vazio)*
   - **Output Directory:** *(deixe vazio ou coloque `.`)*
5. Clique em **Deploy**

### Passo 3 — Acesse o site

Após o build (leva menos de 30 segundos), a Vercel fornece uma URL pública como:
```
https://amelia-triagem.vercel.app
```

### Deploy automático (CD)

A partir desse momento, **todo `git push` para a branch `main`** dispara um novo deploy automaticamente. Branches e Pull Requests geram previews independentes.

---

## 📁 Estrutura de Arquivos

```
amelia-triagem/
├── index.html        # Estrutura HTML e telas do app
├── style.css         # Estilos, variáveis CSS e responsividade
├── script.js         # Lógica de negócio, chat e validações
├── AmeliaCVPS.png    # Logo do projeto
└── README.md         # Este arquivo
```

---

## 🔒 Aviso de Segurança

> ⚠️ Esta aplicação foi desenvolvida como **protótipo educacional**.

O armazenamento de dados sensíveis (CPF, Cartão SUS) no `localStorage` do navegador **não é adequado para produção**. Uma versão de produção deveria incluir:

- Backend com banco de dados seguro (PostgreSQL, MongoDB etc.)
- Hash de senhas com **bcrypt** ou **Argon2** no servidor
- Comunicação exclusivamente via **HTTPS**
- Autenticação stateful (**JWT** ou sessões seguras)
- Validação de todos os dados **no servidor**
- Conformidade com a **LGPD** (Lei Geral de Proteção de Dados)

---

## 👥 Equipe

| Nome | Papel |
|---|---|
| Marcelo de Oliveira | Desenvolvimento |
| Marcos Pires | Desenvolvimento |
| Thiago Nascimento | Desenvolvimento |
| Daniel Oliveira | Desenvolvimento |

**Orientador:** Prof. Anderson Borges  
**Instituição:** Colégio Visconde de Porto Seguro  
**Ano:** 2025

---

<p align="center">Feito com ❤️ por alunos do CVPS</p>
