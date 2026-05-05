# Frontend — Fisioterapia PUC

Interface web do sistema de gestão fisioterapêutica da PUC. Desenvolvida com React 19 e Vite, segue o padrão MVVM com ViewModels responsáveis pela lógica de estado e views focadas na apresentação.

## Tecnologias

| Pacote          | Uso                                        |
|-----------------|--------------------------------------------|
| React 19        | Biblioteca de UI                           |
| Vite            | Bundler e servidor de desenvolvimento      |
| JavaScript (JSX)| Linguagem principal                        |
| Lucide React    | Ícones                                     |
| ESLint          | Linting e qualidade de código              |

## Estrutura de Pastas

```
frontend/src/
├── App.jsx                        # Componente raiz
├── main.jsx                       # Ponto de entrada React
├── assets/                        # Imagens e recursos estáticos
├── constants/
│   └── relatorio.constants.js     # Constantes de status e configurações de relatório
├── contexts/
│   └── ModalContext.jsx           # Contexto global para controle de modais
├── services/
│   ├── cifApi.ts                  # Chamadas à API de referências CIF
│   └── relatorioService.js        # Chamadas à API de relatórios
├── utils/
│   ├── formatadores.js            # Funções de formatação (datas, textos)
│   ├── permissoes.js              # Helpers de controle de permissão por papel
│   └── regrascif.js               # Regras de negócio para preenchimento da CIF
├── viewmodels/
│   ├── useFormularioRelatorioViewModel.js   # Estado e lógica do formulário CIF
│   ├── useHomeViewModel.js                  # Estado da tela principal
│   ├── useListaRelatoriosViewModel.js       # Estado da listagem de relatórios
│   ├── useModalViewModel.js                 # Estado e ações dos modais
│   └── useVisualizacaoRelatorioViewModel.js # Estado da visualização de relatório
└── views/
    ├── geral/
    │   ├── Modal.jsx              # Componente de modal genérico
    │   └── Separador.jsx          # Separador visual
    ├── home/
    │   ├── Home.jsx               # Tela principal / dashboard
    │   ├── BarraLateral.jsx       # Menu lateral de navegação
    │   └── ItemMenu.jsx           # Item individual do menu
    └── relatorio/
        ├── FormularioRelatorio.jsx      # Formulário de criação/edição de relatório
        ├── FormularioHeaderSection.jsx  # Cabeçalho do formulário
        ├── ListaRelatorios.jsx          # Listagem de relatórios
        ├── VisualizacaoRelatorio.jsx    # Visualização detalhada de relatório
        ├── ModalAvaliacaoRelatorio.jsx  # Modal de aprovação/negação (professor)
        ├── ModalItemCIF.jsx             # Modal de seleção de item CIF
        └── CartaoItemCIF.jsx            # Card de exibição de item CIF
```

## Instalação e Execução

```bash
# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento
npm run dev

# Build para produção
npm run build

# Pré-visualizar o build
npm run preview
```

O servidor de desenvolvimento estará disponível em `http://localhost:5173` por padrão.

## Scripts Disponíveis

| Comando           | Descrição                              |
|-------------------|----------------------------------------|
| `npm run dev`     | Servidor de desenvolvimento com HMR   |
| `npm run build`   | Build otimizado para produção          |
| `npm run preview` | Serve o build de produção localmente   |
| `npm run lint`    | Verifica problemas com ESLint          |

## Arquitetura

A aplicação adota o padrão **MVVM**:

- **View** (`views/`) — componentes React focados exclusivamente em renderização
- **ViewModel** (`viewmodels/`) — hooks customizados que encapsulam estado, efeitos e lógica de apresentação
- **Service** (`services/`) — módulos responsáveis pela comunicação com a API REST do backend
- **Context** (`contexts/`) — estado global compartilhado (ex.: controle de modais)

## Integração com o Backend

As chamadas à API apontam para a URL base do backend (`/api/v1`). Configure a URL no arquivo de serviços caso o endereço do backend seja diferente do padrão `http://localhost:3000`.
