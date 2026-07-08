# 🤖 PROMPT PARA O GEMINI — Construção do AVA (Ambiente Virtual de Aprendizagem)

> **Como usar:** Cole este prompt inteiro no Gemini (dentro do Antigravity, na raiz deste projeto). Ele foi escrito para que o Gemini leia os arquivos existentes, entenda os padrões e produza os materiais SEM quebrar nada do que já existe.

---

## 🎯 CONTEXTO

Você é um engenheiro de conteúdo educacional trabalhando num **AVA para preparação ao concurso de Delegado de Polícia (PC/PF)**. O aluno já estudou a **Semana 01** (Missão 1) e a revisão foi consolidada por um tutor. Agora sua função é **transformar o conteúdo estudado em painéis HTML de alta qualidade + flashcards + um sistema de acompanhamento diário de estudos**, seguindo RIGOROSAMENTE os padrões que já existem no repositório.

## 📖 PASSO 0 — LEITURA OBRIGATÓRIA (faça antes de escrever qualquer coisa)

Leia e absorva TODOS estes arquivos para entender padrões, tom e conteúdo:

1. `CLAUDE.md` — regras de operação do projeto (SEÇÃO 6 é a mais importante: define como gerar painéis HTML e flashcards Atena).
2. `index.html` — a página principal do AVA. Note a estrutura `<details class="materia">`, as tags de matéria (DC, DA, DCV, DP, DPP, DE, DH, LPE, ML, CR), o padrão de `.assunto-row` (linked x placeholder), os contadores `count-active`/`count-empty` e o `hero-meta`.
3. `direito_penal_teoria_do_crime.html` — **TEMPLATE PRINCIPAL** dos painéis. Copie exatamente: variáveis CSS light/dark, header com toggle de tema, barra de busca, e as ABAS de navegação (`Literais`, `Pegadinhas`, `Jurisprudência`, `Apostas 2026`, `Discursivas`). Cada tópico é um `<div class="info-card searchable">` dentro da aba correspondente.
4. `dir-adm-poderes-administracao.html` — segundo exemplo de painel, para referência de estilo.
5. `m_dulo_de_flashcards_atena.tsx` — módulo React de flashcards. Note os arrays `bancoDeQuestoes` (objetos com `id`, `banca`, `ano`, `assunto`, `frente`, `verso`) e `resumoEstrategico` (objetos com `id`, `titulo`, `topicos[]`), e o componente `HighlightText` (palavras como NÃO, EXCEÇÃO, VEDADA, SÚMULA, PROIBIDA, PRAZO são destacadas automaticamente — USE-AS em CAIXA no `verso`).
6. `flashcards/deck.md` — tabela-mãe de flashcards (colunas: ID, Frente, Verso, Matéria, Criado em, Próx. Revisão, Intervalo, Ease, Reps, Lapses).
7. `review/pontos-fracos.md` — **os 8 erros do aluno no diagnóstico** (é a matéria-prima principal dos flashcards e do foco dos painéis).
8. `progress/progress.json` e `logs/INDEX.md` — dados de sessões/tempo já registrados (fonte de verdade do acompanhamento).
9. Opcional: os PDFs em `Dedicação Delta/Trilha - 48 Semanas/Semana 01/` — conteúdo original das aulas (Penal-Princípios, Const-Teoria, Civil-LINDB, Civil-Das Pessoas, Med Legal-Introdução/Perícias).

---

## 📋 TAREFA A — PAINÉIS HTML (RESUMOS) DA SEMANA 01

Crie **4 novos arquivos HTML** de painel, um por bloco abaixo, **clonando a estrutura de `direito_penal_teoria_do_crime.html`** (mesmo CSS, mesmo header com toggle dark/light, mesma busca, MESMAS 5 abas). Nomeie os arquivos em kebab-case:

| Arquivo a criar | Matéria (tag) | Conteúdo mínimo a cobrir |
|---|---|---|
| `direito-penal-nocoes-principios.html` | Penal (DP) | Princípios do Direito Penal (legalidade, intervenção mínima, lesividade, insignificância, etc.), fontes, **bem jurídico (Birnbaum)**, **sucessão de leis penais no tempo (vedação à lex tertia/combinação de leis)**, **teoria da atividade (art. 4º CP)**. |
| `direito-constitucional-teoria.html` | Constitucional (DC) | **Classificação das Constituições (Outorgada x Cesarista x Promulgada x Pactuada)**, poder constituinte, **eficácia e aplicabilidade das normas (plena/contida/limitada — ex. art. 227 CF)**, **limitações ao poder de emenda (circunstanciais: intervenção federal, estado de defesa, estado de sítio — art. 60 §1º)**. |
| `direito-civil-lindb-pessoas.html` | Civil (DCV) | **LINDB (vigência, art. 4º integração: analogia→costumes→princípios; subsunção x integração; equidade NÃO está no rol)**; **Das Pessoas (nascituro e as 3 teorias: natalista/concepcionista/mitigada; personalidade art. 2º; incapacidade absoluta pós-EPD = só menor de 16; desconsideração da PJ art. 50, direta x inversa)**. |
| `medicina-legal-pericias-documentos.html` | Med Legal (ML) | **Introdução, perícias e peritos (art. 159 CPP: 1 oficial basta x 2 não oficiais)**; **documentos médico-legais (atestado, relatório/laudo, parecer, auto)**; **infortunística (acidente típico x atípico/trajeto, NTEP)**; **Trauma x Lesão (causa x efeito; art. 158 e 167 CPP; corpo de delito negativo → vias de fato art. 21 LCP)**. |

**Regras dos painéis (não negociáveis):**
- Distribua o conteúdo pelas 5 abas: `Literais` (letra da lei/artigos), `Pegadinhas` (as confusões clássicas de banca — puxe direto dos 8 erros do `pontos-fracos.md`), `Jurisprudência` (STF/STJ e súmulas pertinentes), `Apostas 2026` (o que é quente pra cair), `Discursivas` (ganchos de prova oral/discursiva).
- Cada tópico = um `<div class="info-card searchable">`.
- Mantenha a identidade Delta: laranja `#ff6b00`, fontes Inter + IBM Plex Mono, dark/light funcionando.

---

## 📋 TAREFA B — ATUALIZAR O `index.html`

Para cada painel criado na Tarefa A:
1. No `<details class="materia">` correspondente (Penal, Constitucional, Civil, Medicina Legal): **remova o `.assunto-row placeholder`** ("Em produção...") e insira um `<a class="assunto-row linked" href="./NOME-DO-ARQUIVO.html">` seguindo EXATAMENTE o padrão do link de Penal/Adm já existente (com `.assunto-dot`, `.assunto-title`, `.assunto-status` tipo "Cebraspe · Semana 01", e `.assunto-arrow` →).
2. Troque o selo `<span class="materia-count count-empty">em breve</span>` por `<span class="materia-count count-active">1 painel</span>`.
3. Atualize o `hero-meta`: o número de "painéis disponíveis" deve subir de **2 para 6**.

---

## 📋 TAREFA C — FLASHCARDS (deck.md + Atena TSX)

Gere flashcards a partir do `review/pontos-fracos.md` (os 8 erros) + do conteúdo dos painéis. **NÃO duplique** os 13 cards que já existem no `deck.md` (IDs 1–13); crie apenas os NOVOS (a partir do ID 14), cobrindo os pontos ainda não cardificados desta Missão 1 (ex.: Outorgada x Cesarista, integração x subsunção, equidade fora do art. 4º, 3 teorias do nascituro, incapacidade pós-EPD, desconsideração direta/inversa, perito oficial x não oficial, atestado/laudo/parecer/auto, acidente de trajeto).

1. **Em `flashcards/deck.md`:** acrescente as novas linhas na tabela, continuando a numeração e o padrão de colunas (data de criação `2026-07-08`, próxima revisão `2026-07-09`, intervalo 1, ease 2.5, reps 0, lapses 0).
2. **Em `m_dulo_de_flashcards_atena.tsx`:** acrescente objetos ao array `bancoDeQuestoes` (continuando `id` a partir de 7) com `banca`, `ano`, `assunto`, `frente`, `verso`. No `verso`, escreva em CAIXA as palavras que o `HighlightText` destaca (NÃO, EXCEÇÃO, VEDADA, SÚMULA, PROIBIDA, PRAZO). Adicione também blocos ao `resumoEstrategico` (continuando `r4`, `r5`...) agrupando por assunto. **Não altere** o componente `HighlightText` nem a lógica da aplicação — só os dados dos arrays.

---

## 📋 TAREFA D — MINI-CALENDÁRIO / TRACKER DE ESTUDO (no `index.html`)

Construa dentro do `index.html` (na página principal do AVA, logo abaixo do `hero` e antes de "Matérias do Edital") um **painel de acompanhamento diário de estudos**, no espírito da plataforma **Estudei**. Requisitos:

1. **Mini-calendário visual** (grade do mês atual) marcando os dias em que houve estudo, com destaque de cor (verde/laranja) e um contador de **ofensiva/streak** (dias seguidos).
2. **Cards de estatística no topo:** total de horas estudadas, nº de sessões, nº de questões resolvidas, % de aproveitamento — leia os valores iniciais de `progress/progress.json` e `logs/INDEX.md`.
3. **Formulário de registro manual** (o coração do "estilo Estudei"): permitir ao aluno lançar uma nova entrada com os campos:
   - Data (default: hoje)
   - Matéria (dropdown com as 10 matérias)
   - Assunto (texto livre)
   - Tempo estudado (minutos)
   - Nº de questões resolvidas
   - Nº de acertos
   - Observação (opcional)
4. **Persistência:** como o `index.html` é estático, use **`localStorage`** para salvar as entradas (chave sugerida: `delta_estudos`). Ao carregar a página, reidrate a lista, o calendário e as estatísticas a partir do `localStorage`. Inclua botões de **exportar/importar JSON** (para backup, já que localStorage é por navegador).
5. **Seed inicial:** pré-carregue as sessões já registradas para o histórico não nascer vazio:
   - `2026-06-30` — Onboarding — 0 min de estudo (marco).
   - `2026-07-08` — Diagnóstico Semana 01 — 62 min — 56 questões — 48 acertos (85.7%).
   - `2026-07-08` — Revisão aprofundada Missão 1 — 45 min — 0 questões.
6. **Estilo:** mesma identidade visual do resto do `index.html` (laranja Delta, fontes, dark/light). Todo o JS inline, sem dependências externas de CDN.
7. **Meta "sem falhas":** deixe visível um aviso/nudge quando o dia atual ainda não tiver registro de estudo (ex.: banner "Você ainda não registrou estudo hoje").

---

## ✅ CHECKLIST FINAL (o Gemini deve confirmar cada item)

- [ ] 4 painéis HTML criados, clonando o template, com as 5 abas preenchidas.
- [ ] `index.html`: 4 matérias agora com painel linkado, contadores e hero-meta (6 painéis) atualizados.
- [ ] `deck.md`: novos flashcards (ID 14+) adicionados sem duplicar os existentes.
- [ ] `m_dulo_de_flashcards_atena.tsx`: novos objetos em `bancoDeQuestoes` (id 7+) e `resumoEstrategico` (r4+), com keywords em CAIXA, sem alterar a lógica.
- [ ] Mini-calendário + tracker de estudo (localStorage, seed, formulário, export/import) funcionando no `index.html`.
- [ ] Nada quebrado: painéis antigos (Penal-Teoria do Crime, Adm-Poderes) continuam abrindo normalmente.

**Fonte da verdade do conteúdo jurídico:** priorize o que está em `review/pontos-fracos.md` e nos PDFs da Semana 01. Não invente jurisprudência — se não tiver certeza de um número de súmula/informativo, marque como "(confirmar)".
