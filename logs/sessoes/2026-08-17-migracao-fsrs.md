# 🧠 Relatório de Engenharia e Metodologia — Migração para o Algoritmo FSRS

**Data:** 17 de Agosto de 2026  
**Módulo:** Atena Flashcards (AVA Delta)  
**Objetivo:** Substituição do modelo heurístico SM-2 pelo motor científico **FSRS (Free Spaced Repetition Scheduler)** v4.5/5.

---

## 🔬 1. Justificativa Teórica e Pedagógica

Para a preparação de alto rendimento para o cargo de **Delegado de Polícia**, com escala de trabalho no Tribunal de Justiça (plantões 2x2) e carga disponível de 2 a 3 horas líquidas diárias, o tempo gasto com memorização deve ter o maior retorno cognitivo possível por minuto investido.

O algoritmo clássico **SM-2 (1987)** apresentava duas vulnerabilidades críticas:
1. **O Efeito *Ease Hell*:** Queda irreversível no fator de facilidade de cartões densos de doutrina e jurisprudência, resultando em revisões hiperfrequentes desnecessárias.
2. **Incapacidade de Parametrizar a Retenção Alvo:** Falta de controle direto sobre a taxa percentual de recall desejada para a prova objetiva.

A adoção do **FSRS (2022-2026)** resolve essas limitações, proporcionando uma **redução comprovada de 20% a 30% na carga diária de revisões** para o mesmo índice de retenção de 90%.

---

## 📐 2. Formulação Matemática do Modelo DSR Implementado

O motor em TypeScript (`flashcards-src/src/fsrs.ts`) opera sobre as 3 variáveis de estado da memória:

### 1. Dificuldade ($D \in [1, 10]$)
Mensura a complexidade inerente do item. É atualizada dinamicamente com *regressão à média* (*mean reversion*):
$$D' = w_7 \cdot D_0(3) + (1 - w_7) \cdot (D - w_6 \cdot (G - 3))$$
Isso impede que cartões difíceis fiquem presos para sempre em penalidades de facilidade.

### 2. Estabilidade ($S$, em dias)
Representa o intervalo de tempo necessário para que a probabilidade de lembrar caia de 100% para 90%.
- **No acerto ($G \ge 2$):** A estabilidade é multiplicada com base na dificuldade do card, na estabilidade prévia e no esforço de recuperação:
  $$S'_r = S \cdot \left(1 + \exp(w_8) \cdot (11 - D) \cdot S^{-w_9} \cdot (\exp(w_{10} \cdot (1 - R)) - 1) \cdot h(G) \cdot e(G)\right)$$
- **Na falha ($G = 1$):** A estabilidade é reduzida de forma controlada sem aniquilar completamente o histórico acumulado:
  $$S'_f = \text{clamp}\left(w_{11} \cdot D^{-w_{12}} \cdot ((S + 1)^{w_{13}} - 1) \cdot \exp(w_{14} \cdot (1 - R)), 0.1, S\right)$$

### 3. Recuperabilidade ($R \in [0, 1]$)
A probabilidade instantânea de retenção decorrido o tempo $t$ desde o último estudo:
$$R(t, S) = \left(1 + \frac{19}{81} \cdot \frac{t}{S}\right)^{-0.5}$$

### 4. Cálculo do Próximo Intervalo ($I$)
Dado um alvo de retenção desejada $r$ (padrão: $0.90$):
$$I(r, S) = \max\left(1, \text{round}\left( \frac{S}{19/81} \cdot (r^{-2} - 1) \right)\right)$$

---

## 💻 3. Melhorias Implementadas na Interface (Atena)

1. **4 Graus de Avaliação com Previsão em Tempo Real:**
   - 🔴 **Errei (Again):** Programa revisão imediata / 1 dia.
   - 🟡 **Difícil (Hard):** Avança com multiplicador prudente.
   - 🟢 **Bom (Good):** Avança com intervalo ótimo para 90% de retenção.
   - 🔵 **Fácil (Easy):** Projeta expansão rápida para conceitos plenamente dominados.
   - *Cada botão exibe a previsão exata de dias antes do clique.*

2. **Indicador DSR Dinâmico:**
   - O verso do cartão exibe em tempo real a **Estabilidade ($S$)**, a **Dificuldade ($D$)** e a **Taxa de Retenção Atual ($R$)**.

3. **Seletor de Retenção Desejada (*Desired Retention*):**
   - Ajustável no topo da tela entre:
     - **85% (Mais Rápido):** Menor volume diário de revisões.
     - **90% (Padrão Otimizado):** Equilíbrio ideal entre carga e fixação de longo prazo.
     - **95% (Reta Final):** Revisões mais frequentes para véspera de prova.

4. **Migração Transparente de Dados Legados:**
   - Conversor automático embutido que traduz registros legados do SM-2 (`atena_srs`) para estruturas DSR completas sem resetar o progresso do usuário.

---

## 🚀 4. Deploy e Integração Contínua
- **Build:** `tsc -b && vite build` concluído com sucesso.
- **Ambiente de Produção:** [https://ava-zeta-one.vercel.app/atena/](https://ava-zeta-one.vercel.app/atena/)
- **Tracker Central:** Sessões FSRS agora gravam distribuição detalhada de ratings no `delta_estudos` do AVA.
