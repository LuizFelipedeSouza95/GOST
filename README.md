## GOST – Estatuto (Vite + React + Tailwind)

Projeto criado a partir do `index.html` original, convertido em componentes React e estilizado com Tailwind.

### Rodar localmente

1. Instalar dependências:
   ```bash
   npm install
   ```
2. Rodar em desenvolvimento:
   ```bash
   npm run dev
   ```
3. Build de produção:
   ```bash
   npm run build
   ```
4. Preview:
   ```bash
   npm run preview
   ```

### Estrutura
- `src/components/Sidebar.tsx` – Navegação lateral (desktop)
- `src/components/MobileHeader.tsx` – Cabeçalho com menu (mobile)
- `src/components/sections/*` – Cada seção do estatuto como componente
- `src/App.tsx` – Layout, estado da seção ativa e roteamento por hash
- `tailwind.config.js` / `postcss.config.js` – Configuração do Tailwind


