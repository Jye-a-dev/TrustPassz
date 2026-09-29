```text
📂 cl_user
├── 📁 public
│   └── 📁 img
│       └── 📄 img.md
├── 📁 src
│   ├── 📁 __tests__
│   │   ├── 📄 bargain-slider.test.tsx
│   │   ├── 📄 countdown-timer.test.ts
│   │   └── 📄 crypto.test.ts
│   ├── 📁 abi
│   │   ├── 📄 DigitalEscrow.json
│   │   ├── 📄 DigitalEscrowABI.ts
│   │   └── 📄 index.ts
│   ├── 📁 app
│   │   ├── 📁 (auth)
│   │   │   ├── 📁 login
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📁 register
│   │   │       └── 📄 page.tsx
│   │   ├── 📁 api
│   │   │   └── 📁 health
│   │   │       └── 📄 route.ts
│   │   ├── 📁 dashboard
│   │   │   └── 📄 route.ts
│   │   ├── 📁 deals
│   │   │   ├── 📁 [id]
│   │   │   │   └── 📄 page.tsx
│   │   │   └── 📁 demo
│   │   │       └── 📄 page.tsx
│   │   ├── 📁 explore
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 user
│   │   │   ├── 📁 deals
│   │   │   │   ├── 📁 [id]
│   │   │   │   │   ├── 📁 checkout
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📁 vault
│   │   │   │   │       └── 📄 page.tsx
│   │   │   │   ├── 📁 create
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 disputes
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 orders
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 settings
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 layout.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📄 error.tsx
│   │   ├── 📄 layout.tsx
│   │   ├── 📄 loading.tsx
│   │   ├── 📄 not-found.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 components
│   │   ├── 📁 auth
│   │   │   ├── 📄 auth-guard.tsx
│   │   │   ├── 📄 login-email-form.tsx
│   │   │   ├── 📄 login-web3-tab.tsx
│   │   │   ├── 📄 register-fast-tab.tsx
│   │   │   ├── 📄 register-form.tsx
│   │   │   └── 📄 unauth-screen.tsx
│   │   ├── 📁 checkout
│   │   │   ├── 📄 checkout-payment-details.tsx
│   │   │   ├── 📄 checkout-qr-card.tsx
│   │   │   ├── 📄 checkout-sandbox-bar.tsx
│   │   │   └── 📄 checkout.types.ts
│   │   ├── 📁 deals
│   │   │   ├── 📁 services
│   │   │   │   └── 📄 create-deal.service.ts
│   │   │   ├── 📄 ai-suggestion-panel.tsx
│   │   │   ├── 📄 asset-type-selector.tsx
│   │   │   ├── 📄 bargain-slider.tsx
│   │   │   ├── 📄 countdown-timer.tsx
│   │   │   ├── 📄 create-deal-form.tsx
│   │   │   ├── 📄 create-deal.types.ts
│   │   │   ├── 📄 digital-vault-section.tsx
│   │   │   └── 📄 escrow-terms-section.tsx
│   │   ├── 📁 layout
│   │   │   ├── 📄 user-footer.tsx
│   │   │   ├── 📄 user-mobile-nav.tsx
│   │   │   ├── 📄 user-navbar.tsx
│   │   │   └── 📄 user-sidebar.tsx
│   │   ├── 📁 shared
│   │   │   ├── 📄 empty-state.tsx
│   │   │   ├── 📄 footer.tsx
│   │   │   ├── 📄 header-mobile-drawer.tsx
│   │   │   ├── 📄 header-nav-links.tsx
│   │   │   ├── 📄 header-user-menu.tsx
│   │   │   ├── 📄 header.tsx
│   │   │   ├── 📄 providers.tsx
│   │   │   └── 📄 theme-toggle.tsx
│   │   ├── 📁 ui
│   │   │   ├── 📄 badge.tsx
│   │   │   ├── 📄 button.tsx
│   │   │   ├── 📄 card.tsx
│   │   │   ├── 📄 dialog.tsx
│   │   │   ├── 📄 dropdown-menu.tsx
│   │   │   ├── 📄 input.tsx
│   │   │   ├── 📄 popover.tsx
│   │   │   ├── 📄 sheet.tsx
│   │   │   └── 📄 skeleton.tsx
│   │   └── 📁 vault
│   │       ├── 📄 vault-actions.tsx
│   │       ├── 📄 vault-content-viewer.tsx
│   │       ├── 📄 vault-header.tsx
│   │       ├── 📄 vault-unlock-form.tsx
│   │       └── 📄 vault.types.ts
│   ├── 📁 features
│   │   └── 📁 items
│   │       ├── 📁 actions
│   │       │   └── 📄 item-actions.ts
│   │       ├── 📁 components
│   │       │   ├── 📄 item-card.tsx
│   │       │   ├── 📄 item-form-dialog.tsx
│   │       │   ├── 📄 item-list.tsx
│   │       │   └── 📄 item-search-filter.tsx
│   │       ├── 📁 hooks
│   │       │   └── 📄 use-items.ts
│   │       ├── 📁 types
│   │       │   └── 📄 item.ts
│   │       └── 📁 utils
│   │           └── 📄 item-helpers.ts
│   ├── 📁 hooks
│   │   ├── 📄 use-debounce.ts
│   │   ├── 📄 use-media-query.ts
│   │   └── 📄 use-mounted.ts
│   ├── 📁 lib
│   │   ├── 📄 api-client.ts
│   │   ├── 📄 auth-api.ts
│   │   ├── 📄 auth-store.ts
│   │   ├── 📄 crypto.ts
│   │   ├── 📄 env.ts
│   │   ├── 📄 jwt-edge.ts
│   │   ├── 📄 query-client.ts
│   │   ├── 📄 store.ts
│   │   ├── 📄 supabase-client.ts
│   │   └── 📄 utils.ts
│   ├── 📁 providers
│   │   └── 📄 solana-provider.tsx
│   ├── 📁 styles
│   │   └── 📄 globals.css
│   └── 📄 proxy.ts
├── 📄 .env.example
├── 📄 .env.local
├── 📄 .gitignore
├── 📄 eslint.config.mjs
├── 📄 next-env.d.ts
├── 📄 next.config.ts
├── 📄 package.json
├── 📄 postcss.config.mjs
├── 📄 README.md
├── 📄 tsconfig.json
└── 📄 tsconfig.tsbuildinfo
```

