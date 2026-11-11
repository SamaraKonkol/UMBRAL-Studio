# UMBRAL Studio 🖤 — v0.5 (beta)

Estúdio autoral de criação de posts e Stories do motogrupo UMBRAL, inspirado diretamente na arte **A Origem**.

## Recursos presentes

- **Post de feed** 1080×1350, quadrado 1080×1080 e **Story** 1080×1920.
- Fundo oficial em `assets/a-origem-fundo-oficial.jpg`: mesma arte original, otimizada em JPEG para web (941×1672). A cópia PNG integral pode substituí-la mais tarde.
- **Sem escurecimento obrigatório:** overlay desligado por padrão; ative e ajuste somente se desejar.
- **Sem marca-d'água** do UMBRAL Studio nas artes exportadas.
- Texto, título, ornamento e brasão com seleção, movimento e redimensionamento; fonte, cor, alinhamento, opacidade e itálico ajustáveis.
- Arquivo local de projetos (IndexedDB) e exportação PNG.
- Geração assistida de textos e legendas via Nexforce Router (após configurar API).
- Estrutura de login e sincronização com Supabase, quando habilitado.

> Esta é uma **beta de trabalho**, não uma versão publicada e validada em produção. Alterações em texto ocorrem por campos do inspetor, e os elementos editáveis atuais são título, chamada, texto, rodapé, ornamento e brasão. Edição por palavra e movimentação livre do fundo são melhorias futuras.

## Usar localmente

Requer Node.js 22 ou superior.

```bash
git clone https://github.com/SamaraKonkol/UMBRAL-Studio.git
cd UMBRAL-Studio
npm start
```

Abra `http://127.0.0.1:4173`. O editor funciona sem banco e sem IA. Se quiser ativar IA localmente, copie `.env.example` para `.env` e preencha **uma chave nova** e seu modelo Nexforce.

## Preparar Vercel + Supabase

1. Crie um projeto no Supabase e execute `db/schema.sql` no SQL Editor.
2. Em Authentication, crie seu usuário e desative inscrições públicas. No painel da Vercel, defina:
   - `SUPABASE_URL` — URL do projeto
   - `SUPABASE_ANON_KEY` — chave publicável/anon
   - `ALLOWED_EMAIL` — seu e-mail autorizado
   - `NEXFORCE_API_KEY` — nova chave, somente no servidor
   - `NEXFORCE_MODEL` — ID do modelo/roteador escolhido
   - `NEXFORCE_BASE_URL` — `https://router.nexforce.ai/v1` (opcional)
3. Importe este repositório como projeto na Vercel (site estático + rotas `api/`).
4. Teste login, criação de post, salvar projeto e geração de texto após publicar.

## Segurança

**Nunca envie chaves, senhas ou o arquivo `.env` ao GitHub**. A chave Nexforce mostrada anteriormente no chat precisa ser revogada e substituída. O arquivo `.env.example` contém só campos vazios. A API hospedada valida a sessão Supabase e o e-mail permitido; o banco usa RLS por proprietário.

O repositório é público, portanto não coloque nele fotos privadas de integrantes nem dados pessoais.

## Identidade visual

A referência não é o Canva: a arte **A Origem** dita composição, tipografia marfim em serifas, preto e vermelho carmesim. Novos efeitos permanecem opcionais. O sistema não deve criar estilos aleatórios.

## Estado do projeto

**Código no GitHub:** sim. **Deploy Vercel/Supabase configurado e testado:** ainda não.

## Novidades v0.6 — editor com camadas

- **Texto independente:** use `+ TEXTO` para inserir blocos extras que podem ser arrastados e redimensionados.
- **Imagens independentes:** use `+ IMAGEM` para criar objetos sobre o fundo, sem filtro escuro automático.
- **Camadas:** selecione, oculte, duplique, exclua e reordene elementos extras. Os elementos-base podem ser ocultados e reexibidos na lista.
- **Destaques editoriais:** escreva `*sonho*` ou `*pertencimento, apoio e evolução*` para aplicar vermelho e itálico às palavras entre asteriscos, sem alterar o restante do parágrafo.
- **Desfazer/refazer:** botões ↶ e ↷, além de Ctrl+Z/Ctrl+Y quando o foco não está em campos de texto.
- **Compatibilidade:** projetos v0.5 já salvos continuam válidos; camadas extras usam uma nova propriedade opcional `layers`.
- **Exportação:** PNG sem marca-d'água e sem contornos de seleção.

O fundo oficial `A Origem`, os formatos de Instagram e a IA existente foram preservados.

