# Python-MG

Site estático de página única da comunidade Python de Minas Gerais. Usa apenas
HTML, CSS e JavaScript vanilla — não há dependências, etapa de build ou gerador
de site.

## Rodar localmente

```sh
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Também funciona em qualquer hospedagem de
arquivos estáticos, incluindo GitHub Pages.

## Atualizar conteúdo

Os arquivos abaixo são copiados para o site sem transformação. Não é preciso
editar HTML, CSS ou JavaScript para alterar as listas:

- `data/members.json` — pessoas colaboradoras;
- `data/posts.json` — posts do blog (opcional);
- `data/projects.json` — projetos da comunidade (opcional);
- `data/site.json` — textos institucionais, links e código de conduta.

Depois de mudar um JSON, valide a sintaxe:

```sh
python3 -m json.tool data/members.json >/dev/null
python3 -m json.tool data/projects.json >/dev/null
```

### Membro

```json
{
  "name": "Nome da pessoa",
  "github": "usuario-github",
  "twitter": "@usuario",
  "instagram": "usuario",
  "linkedin": "usuario",
  "telegram": "usuario",
  "bluesky": "usuario.bsky.social",
  "threads": "usuario",
  "mastodon": "@usuario@mastodon.social",
  "email": "pessoa@exemplo.org",
  "site": { "nome": "Meu site", "href": "https://exemplo.org" }
}
```

Todos os campos, exceto `name`, são opcionais. Com `github`, o cartão usa o
avatar público do GitHub. Sem `github`, um perfil `linkedin` é usado como
fallback de avatar. Também é possível informar `"avatar"` com uma URL de imagem,
que sempre tem prioridade. Os campos de rede social aceitam um usuário (com ou
sem `@`) ou a URL completa do perfil. Para `mastodon`, use a URL completa ou o
formato `@usuario@servidor`.

### Projeto

`data/projects.json` começa como uma lista vazia. Adicione um objeto para cada
projeto; os campos `name` e `description` são obrigatórios. Ambos podem ser um
texto simples ou um objeto com traduções `pt` e `en`. `url` é opcional e torna
o card clicável; `image` é opcional e aceita uma URL HTTPS ou um caminho em
`assets/` para exibir uma imagem de capa.

```json
{
  "name": { "pt": "Nome do projeto", "en": "Project name" },
  "description": { "pt": "Descrição do projeto.", "en": "Project description." },
  "url": "https://exemplo.org/projeto",
  "image": "assets/images/projetos/capa.png"
}
```

Sem projetos na lista, a seção Projetos e seus links de navegação não são
exibidos.

## Eventos e GitHub Actions

O workflow `.github/workflows/sync-meetup-events.yml` executa toda segunda-feira
às 12:17 UTC e também pode ser disparado em **Actions → Sync Meetup events → Run
workflow**. O Meetup é a fonte de verdade: o workflow coleta a agenda, atualiza
`data/events.json` no ambiente de execução e abre — ou atualiza — o PR
`automation/meetup-events` somente quando houver diferença. Revise e faça merge
desse PR para publicar os novos eventos.

Antes do primeiro uso, habilite em **Settings → Actions → General → Workflow
permissions** a opção de leitura e escrita e permita que o GitHub Actions crie
pull requests. Não há segredo ou credencial do Meetup no workflow.

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` publica `index.html`, `assets/`
e `data/` quando mudanças desses arquivos chegam à `main`; ele também pode ser
executado manualmente. O JSON aprovado no PR de eventos, portanto, é publicado
no próximo merge sem exigir uma cópia local do repositório.

Antes da primeira publicação, configure em **Settings → Pages → Build and
deployment** a origem como **GitHub Actions**. Para este repositório, a URL
padrão será `https://pythonmg.github.io/site-pythonmg/`. O domínio
`pythonmg.github.io` exige uma configuração de domínio personalizado ou um
repositório de usuário/organização com esse nome.
