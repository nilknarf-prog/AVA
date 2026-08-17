# 📝 Registro de Sessão — 17 de Agosto de 2026

## 🎯 Objetivo
Manutenção técnica, expansão do banco de dados de flashcards do ecossistema **Atena**, compilação da aplicação frontend e deploy em produção via GitHub/Vercel.

---

## 📚 1. Conteúdo Jurídico Implementado

Foram incorporados 3 novos flashcards ao deck de **Direito Penal** (`flashcards-src/src/data.ts`):

### 🔹 Card 1: Funcionalismo Penal (ID: `dp11`)
- **Assunto:** Funcionalismo Penal (Teoria do Delito / Escolas Penais).
- **Frente:** *No Funcionalismo, qual a diferença entre a finalidade do Direito Penal para Roxin e para Jakobs?*
- **Verso:** 
  - **ROXIN (Funcionalismo Teleológico / Moderado / Dualista):** A finalidade é a **Proteção Subsidiária de Bens Jurídicos** concretos.
  - **JAKOBS (Funcionalismo Sistêmico / Radical / Monista):** A finalidade é **Assegurar a Vigência da Norma** e a estabilidade do sistema social (fundamento do *Direito Penal do Inimigo*).
  - **Mnemônico/Macete de Fixação:** 
    - *Roxin* = **R**espeita os bens jurídicos (moderado).
    - *Jakobs* = **J**ustiça para o sistema / **J**udoca radical.

### 🔹 Card 2: Interpretação Restritiva da Lei Penal (ID: `dp12`)
- **Assunto:** Hermenêutica e Aplicação da Lei Penal.
- **Frente:** *Na interpretação restritiva da lei penal, qual é a premissa sobre o texto legal e a vontade da lei?*
- **Verso:** A premissa fundamental é que a lei disse MAIS do que pretendia dizer (*"lex dixit plus quam voluit"*). O papel do intérprete/magistrado é restringir e delimitar o alcance literal da norma para adequá-la à sua real finalidade.

### 🔹 Card 3: Princípio da Consunção e Quantum de Pena (ID: `dp13`)
- **Assunto:** Conflito Aparente de Normas.
- **Frente:** *Para a aplicação do princípio da consunção, é obrigatório que o crime absorvido (meio) tenha pena menor que o crime continente (fim)?*
- **Verso:** **NÃO.** É pacífico na doutrina e jurisprudência que o crime-meio (absorvido) pode ter pena abstrata MAIOR que o crime-fim (absorvente). O critério essencial é a relação funcional e cronológica de meio e fim (dependência necessária ou normal fase de execução), e não a dosimetria abstrata da pena.

---

## 🧠 2. Metodologia de Estudo Empregada

1. **Repetição Espaçada (SRS - Spaced Repetition System):**
   - Os cards alimentam o algoritmo SM-2 integrado ao Atena, programando revisões progressivas baseadas na retenção do candidato.
2. **Destaque Visual para Fixação (Highlighting Semântico):**
   - No app Atena, palavras-chave como `NÃO`, `MAIOR`, `ROXIN`, `JAKOBS` e termos em latim são automaticamente destacados visualmente para ancoragem na memória de longo prazo.
3. **Mnemônicos e Neutralização de Pegadinhas:**
   - Inclusão direta de mnemônicos práticos para distinguir autores que as bancas (Cebraspe/Vunesp/FGV) rotineiramente trocam em enunciados.
   - Combate a armadilhas clássicas (ex: a falsa premissa de que consunção exige pena menor no crime absorvido).

---

## 💻 3. Arquitetura Web e Implementação Técnica

1. **Estrutura de Código:**
   - Fonte única dos dados: `flashcards-src/src/data.ts`.
   - Componentes React com TypeScript, renderização de cards com flip 3D, suporte a temas Claro/Escuro (`delta-theme`).
2. **Pipeline de Build:**
   - Execução de `npm run build` (`tsc -b && vite build`) no diretório `flashcards-src/`.
   - Geração e empacotamento dos bundles estáticos otimizados (HTML, CSS e JS minificados com gzip) diretamente na pasta `/atena/`.
3. **Deploy e Entrega Contínua (CI/CD):**
   - Versionamento das alterações via Git na branch `main`.
   - Integração com Vercel: Deploy automático para a URL de produção **`https://ava-zeta-one.vercel.app/`** (com acesso ao módulo em `/atena/`).

---

## 📊 4. Estado do Projeto
- **Total de Flashcards Ativos:** 16 cards (13 anteriores + 3 novos).
- **Ambiente em Produção:** Atualizado e funcional.
