```text
📂 TrustPassz
├── 📁 .backup_task_a11
│   ├── 📄 apps_cl_admin_tsconfig.json
│   ├── 📄 apps_cl_user_tsconfig.json
│   ├── 📄 apps_server_tsconfig.build.json
│   ├── 📄 apps_server_tsconfig.json
│   ├── 📄 payments_controller_spec.ts
│   ├── 📄 root_package.json
│   ├── 📄 tests_e2e_tsconfig.json
│   └── 📄 vscode_settings.json
├── 📁 .github
│   └── 📁 workflows
│       ├── 📄 ci.yml
│       ├── 📄 deploy-contracts.yml
│       ├── 📄 oracle-balance-alert.yml
│       └── 📄 pre-release-deploy.yml
├── 📁 .vscode
│   └── 📄 settings.json
├── 📁 apps
│   ├── 📁 ai_pipeline
│   │   ├── 📁 constraints
│   │   │   └── 📄 schemas.py
│   │   ├── 📁 core
│   │   │   ├── 📄 factory.py
│   │   │   ├── 📄 interfaces.py
│   │   │   └── 📄 outlines_engine.py
│   │   ├── 📁 engines
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 arbitrator_engine.py
│   │   ├── 📁 models
│   │   ├── 📁 routers
│   │   │   ├── 📄 __init__.py
│   │   │   └── 📄 arbitration.py
│   │   ├── 📁 schemas
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 arbitration.py
│   │   │   └── 📄 deal_suggestion.py
│   │   ├── 📁 services
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 arbitration_service.py
│   │   │   └── 📄 suggestion_service.py
│   │   ├── 📁 tests
│   │   │   ├── 📁 components
│   │   │   │   ├── 📄 __init__.py
│   │   │   │   ├── 📄 arbitration_engine_component.py
│   │   │   │   └── 📄 arbitration_routes_component.py
│   │   │   ├── 📁 fixtures
│   │   │   │   ├── 📄 __init__.py
│   │   │   │   └── 📄 arbitration_fixtures.py
│   │   │   ├── 📄 __init__.py
│   │   │   ├── 📄 benchmark_ai_pipeline.py
│   │   │   └── 📄 test_arbitration.py
│   │   ├── 📄 .dockerignore
│   │   ├── 📄 .env
│   │   ├── 📄 .env.deploy
│   │   ├── 📄 .env.example
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 engine.py
│   │   ├── 📄 main.py
│   │   ├── 📄 package.json
│   │   ├── 📄 pytest.ini
│   │   ├── 📄 requirements.txt
│   │   ├── 📄 run.js
│   │   └── 📄 test_suggestion.py
│   ├── 📁 cl_admin
│   │   ├── 📁 public
│   │   │   └── 📁 img
│   │   │       └── 📄 img.md
│   │   ├── 📁 src
│   │   │   ├── 📁 app
│   │   │   │   ├── 📁 (auth)
│   │   │   │   │   ├── 📁 login
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 register
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📄 layout.tsx
│   │   │   │   ├── 📁 (dashboard)
│   │   │   │   │   ├── 📁 ai-lab
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 api-explorer
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 dashboard
│   │   │   │   │   │   ├── 📄 loading.tsx
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 deals
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 disputes
│   │   │   │   │   │   ├── 📁 [id]
│   │   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 system-status
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 users
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📄 layout.tsx
│   │   │   │   ├── 📁 api
│   │   │   │   │   └── 📁 health
│   │   │   │   │       └── 📄 route.ts
│   │   │   │   ├── 📄 error.tsx
│   │   │   │   ├── 📄 layout.tsx
│   │   │   │   ├── 📄 loading.tsx
│   │   │   │   ├── 📄 not-found.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 components
│   │   │   │   ├── 📁 ai-lab
│   │   │   │   │   ├── 📄 ai-benchmark-tester.tsx
│   │   │   │   │   ├── 📄 contrast-slider-panel.tsx
│   │   │   │   │   └── 📄 prompt-scenario-editor.tsx
│   │   │   │   ├── 📁 auth
│   │   │   │   │   ├── 📄 admin-auth-guard.tsx
│   │   │   │   │   ├── 📄 auth-error-banner.tsx
│   │   │   │   │   ├── 📄 sandbox-quick-login-tab.tsx
│   │   │   │   │   ├── 📄 standard-login-tab.tsx
│   │   │   │   │   ├── 📄 use-admin-auth-handlers.ts
│   │   │   │   │   └── 📄 web3-passkey-tab.tsx
│   │   │   │   ├── 📁 dashboard
│   │   │   │   │   ├── 📄 kpi-metrics-grid.tsx
│   │   │   │   │   └── 📄 system-health-banner.tsx
│   │   │   │   ├── 📁 deals
│   │   │   │   │   ├── 📄 deal-details-drawer.tsx
│   │   │   │   │   └── 📄 deal-override-dialog.tsx
│   │   │   │   ├── 📁 disputes
│   │   │   │   │   ├── 📄 ai-verdict-card.tsx
│   │   │   │   │   ├── 📄 dispute-evidence-viewer.tsx
│   │   │   │   │   └── 📄 override-action-dialog.tsx
│   │   │   │   ├── 📁 layout
│   │   │   │   │   ├── 📄 admin-footer.tsx
│   │   │   │   │   ├── 📄 admin-navbar.tsx
│   │   │   │   │   └── 📄 admin-sidebar.tsx
│   │   │   │   ├── 📁 shared
│   │   │   │   │   ├── 📄 empty-state.tsx
│   │   │   │   │   ├── 📄 footer.tsx
│   │   │   │   │   ├── 📄 header.tsx
│   │   │   │   │   ├── 📄 providers.tsx
│   │   │   │   │   └── 📄 theme-toggle.tsx
│   │   │   │   ├── 📁 status
│   │   │   │   │   └── 📄 service-health-card.tsx
│   │   │   │   └── 📁 ui
│   │   │   │       ├── 📄 badge.tsx
│   │   │   │       ├── 📄 button.tsx
│   │   │   │       ├── 📄 card.tsx
│   │   │   │       ├── 📄 dialog.tsx
│   │   │   │       ├── 📄 dropdown-menu.tsx
│   │   │   │       ├── 📄 input.tsx
│   │   │   │       ├── 📄 popover.tsx
│   │   │   │       ├── 📄 sheet.tsx
│   │   │   │       ├── 📄 skeleton.tsx
│   │   │   │       ├── 📄 slider.tsx
│   │   │   │       └── 📄 table.tsx
│   │   │   ├── 📁 hooks
│   │   │   │   ├── 📄 use-debounce.ts
│   │   │   │   ├── 📄 use-media-query.ts
│   │   │   │   └── 📄 use-mounted.ts
│   │   │   ├── 📁 lib
│   │   │   │   ├── 📄 admin-auth-store.ts
│   │   │   │   ├── 📄 api-client.ts
│   │   │   │   ├── 📄 audit-logger.ts
│   │   │   │   ├── 📄 auth-api.ts
│   │   │   │   ├── 📄 auth-redirect.ts
│   │   │   │   ├── 📄 env.ts
│   │   │   │   ├── 📄 query-client.ts
│   │   │   │   ├── 📄 store.ts
│   │   │   │   ├── 📄 system-monitor.ts
│   │   │   │   └── 📄 utils.ts
│   │   │   ├── 📁 providers
│   │   │   │   └── 📄 solana-provider.tsx
│   │   │   ├── 📁 styles
│   │   │   │   └── 📄 globals.css
│   │   │   ├── 📁 types
│   │   │   │   └── 📄 index.ts
│   │   │   └── 📄 proxy.ts
│   │   ├── 📄 .env.deploy
│   │   ├── 📄 .env.example
│   │   ├── 📄 .env.local
│   │   ├── 📄 .gitignore
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 eslint.config.mjs
│   │   ├── 📄 netlify.toml
│   │   ├── 📄 next-env.d.ts
│   │   ├── 📄 next.config.mjs
│   │   ├── 📄 package.json
│   │   ├── 📄 postcss.config.mjs
│   │   ├── 📄 README.md
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 tsconfig.tsbuildinfo
│   │   └── 📄 vercel.json
│   ├── 📁 cl_user
│   │   ├── 📁 public
│   │   │   ├── 📁 img
│   │   │   │   └── 📄 img.md
│   │   │   ├── 📄 landingpage_1.png
│   │   │   └── 📄 logo.png
│   │   ├── 📁 src
│   │   │   ├── 📁 __tests__
│   │   │   │   ├── 📄 bargain-slider.test.tsx
│   │   │   │   ├── 📄 countdown-timer.test.ts
│   │   │   │   ├── 📄 crypto.test.ts
│   │   │   │   ├── 📄 secure-clipboard.test.ts
│   │   │   │   └── 📄 session-lifecycle.test.ts
│   │   │   ├── 📁 abi
│   │   │   │   ├── 📄 DigitalEscrow.json
│   │   │   │   ├── 📄 DigitalEscrowABI.ts
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📁 app
│   │   │   │   ├── 📁 (auth)
│   │   │   │   │   ├── 📁 login
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📁 register
│   │   │   │   │       └── 📄 page.tsx
│   │   │   │   ├── 📁 api
│   │   │   │   │   ├── 📁 health
│   │   │   │   │   │   └── 📄 route.ts
│   │   │   │   │   └── 📁 session
│   │   │   │   │       └── 📄 route.ts
│   │   │   │   ├── 📁 dashboard
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 deals
│   │   │   │   │   ├── 📁 [id]
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   └── 📁 demo
│   │   │   │   │       └── 📄 page.tsx
│   │   │   │   ├── 📁 explore
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📁 user
│   │   │   │   │   ├── 📁 deals
│   │   │   │   │   │   ├── 📁 [id]
│   │   │   │   │   │   │   ├── 📁 checkout
│   │   │   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   │   │   └── 📁 vault
│   │   │   │   │   │   │       └── 📄 page.tsx
│   │   │   │   │   │   ├── 📁 create
│   │   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 disputes
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 orders
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📁 settings
│   │   │   │   │   │   └── 📄 page.tsx
│   │   │   │   │   ├── 📄 layout.tsx
│   │   │   │   │   └── 📄 page.tsx
│   │   │   │   ├── 📄 error.tsx
│   │   │   │   ├── 📄 layout.tsx
│   │   │   │   ├── 📄 loading.tsx
│   │   │   │   ├── 📄 not-found.tsx
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 assets
│   │   │   │   ├── 📄 landingpage_1.png
│   │   │   │   └── 📄 logo.png
│   │   │   ├── 📁 components
│   │   │   │   ├── 📁 auth
│   │   │   │   │   ├── 📄 auth-guard.tsx
│   │   │   │   │   ├── 📄 login-email-form.tsx
│   │   │   │   │   ├── 📄 login-web3-tab.tsx
│   │   │   │   │   ├── 📄 register-fast-tab.tsx
│   │   │   │   │   ├── 📄 register-form.tsx
│   │   │   │   │   ├── 📄 unauth-screen.tsx
│   │   │   │   │   └── 📄 use-auth-handlers.ts
│   │   │   │   ├── 📁 checkout
│   │   │   │   │   ├── 📄 checkout-payment-details.tsx
│   │   │   │   │   ├── 📄 checkout-qr-card.tsx
│   │   │   │   │   ├── 📄 checkout-sandbox-bar.tsx
│   │   │   │   │   ├── 📄 checkout-seller-warning.tsx
│   │   │   │   │   └── 📄 checkout.types.ts
│   │   │   │   ├── 📁 deals
│   │   │   │   │   ├── 📁 services
│   │   │   │   │   │   └── 📄 create-deal.service.ts
│   │   │   │   │   ├── 📄 ai-suggestion-panel.tsx
│   │   │   │   │   ├── 📄 asset-type-selector.tsx
│   │   │   │   │   ├── 📄 bargain-slider.tsx
│   │   │   │   │   ├── 📄 countdown-timer.tsx
│   │   │   │   │   ├── 📄 create-deal-form.tsx
│   │   │   │   │   ├── 📄 create-deal.types.ts
│   │   │   │   │   ├── 📄 deal-edit-dialog.tsx
│   │   │   │   │   ├── 📄 deal-header-overview.tsx
│   │   │   │   │   ├── 📄 deal-room-cta.tsx
│   │   │   │   │   ├── 📄 deal-room.types.ts
│   │   │   │   │   ├── 📄 deal-seller-panel.tsx
│   │   │   │   │   ├── 📄 deal-vault-status-card.tsx
│   │   │   │   │   ├── 📄 digital-vault-section.tsx
│   │   │   │   │   └── 📄 escrow-terms-section.tsx
│   │   │   │   ├── 📁 landing
│   │   │   │   │   ├── 📄 brand-showcase.tsx
│   │   │   │   │   ├── 📄 comparison-section.tsx
│   │   │   │   │   ├── 📄 cta-banner.tsx
│   │   │   │   │   ├── 📄 escrow-simulation-preview.tsx
│   │   │   │   │   ├── 📄 faq-section.tsx
│   │   │   │   │   ├── 📄 index.ts
│   │   │   │   │   ├── 📄 landing-background.tsx
│   │   │   │   │   ├── 📄 landing-hero.tsx
│   │   │   │   │   ├── 📄 landing.data.ts
│   │   │   │   │   ├── 📄 pillars-section.tsx
│   │   │   │   │   ├── 📄 use-cases-section.tsx
│   │   │   │   │   └── 📄 workflow-section.tsx
│   │   │   │   ├── 📁 layout
│   │   │   │   │   ├── 📄 sidebar-telemetry-badge.tsx
│   │   │   │   │   ├── 📄 sidebar-vault-card.tsx
│   │   │   │   │   ├── 📄 user-footer.tsx
│   │   │   │   │   ├── 📄 user-mobile-nav.tsx
│   │   │   │   │   ├── 📄 user-navbar.tsx
│   │   │   │   │   └── 📄 user-sidebar.tsx
│   │   │   │   ├── 📁 shared
│   │   │   │   │   ├── 📄 empty-state.tsx
│   │   │   │   │   ├── 📄 footer.tsx
│   │   │   │   │   ├── 📄 header-mobile-drawer.tsx
│   │   │   │   │   ├── 📄 header-nav-links.tsx
│   │   │   │   │   ├── 📄 header-user-menu.tsx
│   │   │   │   │   ├── 📄 header.tsx
│   │   │   │   │   ├── 📄 providers.tsx
│   │   │   │   │   └── 📄 theme-toggle.tsx
│   │   │   │   ├── 📁 ui
│   │   │   │   │   ├── 📄 badge.tsx
│   │   │   │   │   ├── 📄 button.tsx
│   │   │   │   │   ├── 📄 card.tsx
│   │   │   │   │   ├── 📄 dialog.tsx
│   │   │   │   │   ├── 📄 dropdown-menu.tsx
│   │   │   │   │   ├── 📄 input.tsx
│   │   │   │   │   ├── 📄 popover.tsx
│   │   │   │   │   ├── 📄 sheet.tsx
│   │   │   │   │   └── 📄 skeleton.tsx
│   │   │   │   ├── 📁 user
│   │   │   │   │   ├── 📄 dashboard-kpis.tsx
│   │   │   │   │   └── 📄 recent-deal-item.tsx
│   │   │   │   └── 📁 vault
│   │   │   │       ├── 📄 vault-actions.tsx
│   │   │   │       ├── 📄 vault-content-viewer.tsx
│   │   │   │       ├── 📄 vault-header.tsx
│   │   │   │       ├── 📄 vault-unlock-form.tsx
│   │   │   │       └── 📄 vault.types.ts
│   │   │   ├── 📁 features
│   │   │   │   └── 📁 items
│   │   │   │       ├── 📁 actions
│   │   │   │       │   └── 📄 item-actions.ts
│   │   │   │       ├── 📁 components
│   │   │   │       │   ├── 📄 item-card.tsx
│   │   │   │       │   ├── 📄 item-form-dialog.tsx
│   │   │   │       │   ├── 📄 item-list.tsx
│   │   │   │       │   └── 📄 item-search-filter.tsx
│   │   │   │       ├── 📁 hooks
│   │   │   │       │   └── 📄 use-items.ts
│   │   │   │       ├── 📁 types
│   │   │   │       │   └── 📄 item.ts
│   │   │   │       └── 📁 utils
│   │   │   │           └── 📄 item-helpers.ts
│   │   │   ├── 📁 hooks
│   │   │   │   ├── 📄 use-debounce.ts
│   │   │   │   ├── 📄 use-media-query.ts
│   │   │   │   └── 📄 use-mounted.ts
│   │   │   ├── 📁 lib
│   │   │   │   ├── 📄 api-client.ts
│   │   │   │   ├── 📄 auth-api.ts
│   │   │   │   ├── 📄 auth-store.ts
│   │   │   │   ├── 📄 crypto.ts
│   │   │   │   ├── 📄 env.ts
│   │   │   │   ├── 📄 jwt-edge.ts
│   │   │   │   ├── 📄 query-client.ts
│   │   │   │   ├── 📄 secure-clipboard.ts
│   │   │   │   ├── 📄 store.ts
│   │   │   │   ├── 📄 supabase-client.ts
│   │   │   │   └── 📄 utils.ts
│   │   │   ├── 📁 providers
│   │   │   │   └── 📄 solana-provider.tsx
│   │   │   ├── 📁 styles
│   │   │   │   └── 📄 globals.css
│   │   │   └── 📄 proxy.ts
│   │   ├── 📄 .env.deploy
│   │   ├── 📄 .env.example
│   │   ├── 📄 .env.local
│   │   ├── 📄 .gitignore
│   │   ├── 📄 Dockerfile
│   │   ├── 📄 eslint.config.mjs
│   │   ├── 📄 netlify.toml
│   │   ├── 📄 next-env.d.ts
│   │   ├── 📄 next.config.mjs
│   │   ├── 📄 package.json
│   │   ├── 📄 postcss.config.mjs
│   │   ├── 📄 README.md
│   │   ├── 📄 STRUCTURE_TEMP.md
│   │   ├── 📄 tsconfig.json
│   │   ├── 📄 tsconfig.tsbuildinfo
│   │   └── 📄 vercel.json
│   ├── 📁 mb_user
│   │   ├── 📁 .dart_tool
│   │   │   ├── 📁 dartpad
│   │   │   │   └── 📄 web_plugin_registrant.dart
│   │   │   ├── 📁 extension_discovery
│   │   │   │   ├── 📄 devtools.json
│   │   │   │   └── 📄 vs_code.json
│   │   │   ├── 📁 flutter_build
│   │   │   │   ├── 📁 eac4a6a631d6615abb9cde939b697545
│   │   │   │   │   ├── 📄 .filecache
│   │   │   │   │   ├── 📄 app.dill
│   │   │   │   │   ├── 📄 dart_build_result.json
│   │   │   │   │   ├── 📄 dart_build.d
│   │   │   │   │   ├── 📄 dart_build.stamp
│   │   │   │   │   ├── 📄 debug_android_application.stamp
│   │   │   │   │   ├── 📄 flutter_assets.d
│   │   │   │   │   ├── 📄 gen_dart_plugin_registrant.stamp
│   │   │   │   │   ├── 📄 gen_localizations.stamp
│   │   │   │   │   ├── 📄 install_code_assets.d
│   │   │   │   │   ├── 📄 install_code_assets.stamp
│   │   │   │   │   ├── 📄 kernel_snapshot_program.d
│   │   │   │   │   ├── 📄 kernel_snapshot_program.stamp
│   │   │   │   │   ├── 📄 native_assets.json
│   │   │   │   │   └── 📄 outputs.json
│   │   │   │   └── 📄 dart_plugin_registrant.dart
│   │   │   ├── 📄 package_config.json
│   │   │   ├── 📄 package_graph.json
│   │   │   └── 📄 version
│   │   ├── 📁 android
│   │   │   ├── 📁 .gradle
│   │   │   │   ├── 📁 8.14
│   │   │   │   │   ├── 📁 checksums
│   │   │   │   │   │   ├── 📄 checksums.lock
│   │   │   │   │   │   ├── 📄 md5-checksums.bin
│   │   │   │   │   │   └── 📄 sha1-checksums.bin
│   │   │   │   │   ├── 📁 executionHistory
│   │   │   │   │   │   ├── 📄 executionHistory.bin
│   │   │   │   │   │   └── 📄 executionHistory.lock
│   │   │   │   │   ├── 📁 expanded
│   │   │   │   │   ├── 📁 fileChanges
│   │   │   │   │   │   └── 📄 last-build.bin
│   │   │   │   │   ├── 📁 fileHashes
│   │   │   │   │   │   ├── 📄 fileHashes.bin
│   │   │   │   │   │   ├── 📄 fileHashes.lock
│   │   │   │   │   │   └── 📄 resourceHashesCache.bin
│   │   │   │   │   ├── 📁 vcsMetadata
│   │   │   │   │   └── 📄 gc.properties
│   │   │   │   ├── 📁 buildOutputCleanup
│   │   │   │   │   ├── 📄 buildOutputCleanup.lock
│   │   │   │   │   ├── 📄 cache.properties
│   │   │   │   │   └── 📄 outputFiles.bin
│   │   │   │   ├── 📁 kotlin
│   │   │   │   │   └── 📁 errors
│   │   │   │   │       ├── 📄 errors-1791388150391.log
│   │   │   │   │       ├── 📄 errors-1791388150412.log
│   │   │   │   │       └── 📄 errors-1791388150429.log
│   │   │   │   ├── 📁 nb-cache
│   │   │   │   │   ├── 📁 android-1011817984
│   │   │   │   │   │   └── 📄 project-info.ser
│   │   │   │   │   ├── 📁 android-264690323
│   │   │   │   │   │   └── 📄 project-info.ser
│   │   │   │   │   ├── 📁 app-599484997
│   │   │   │   │   │   └── 📄 project-info.ser
│   │   │   │   │   ├── 📁 app-994702130
│   │   │   │   │   │   └── 📄 project-info.ser
│   │   │   │   │   ├── 📁 trust
│   │   │   │   │   │   ├── 📄 586E3E4AF1401E398CD3243CBEFCBE4368C69B63B4AD598E6D3372FB41F973E5
│   │   │   │   │   │   └── 📄 B145B2563EB1D2BA511A149DE00611222D155B73A13B347C774DE8708A67B1CF
│   │   │   │   │   └── 📄 subprojects.ser
│   │   │   │   ├── 📁 noVersion
│   │   │   │   │   └── 📄 buildLogic.lock
│   │   │   │   ├── 📁 vcs-1
│   │   │   │   │   └── 📄 gc.properties
│   │   │   │   └── 📄 file-system.probe
│   │   │   ├── 📁 .kotlin
│   │   │   │   ├── 📁 errors
│   │   │   │   │   ├── 📄 errors-1791388150391.log
│   │   │   │   │   ├── 📄 errors-1791388150412.log
│   │   │   │   │   └── 📄 errors-1791388150429.log
│   │   │   │   └── 📁 sessions
│   │   │   ├── 📁 app
│   │   │   │   ├── 📁 src
│   │   │   │   │   ├── 📁 debug
│   │   │   │   │   │   └── 📄 AndroidManifest.xml
│   │   │   │   │   ├── 📁 main
│   │   │   │   │   │   ├── 📁 java
│   │   │   │   │   │   │   └── 📁 io
│   │   │   │   │   │   │       └── 📁 flutter
│   │   │   │   │   │   │           └── 📁 plugins
│   │   │   │   │   │   │               └── 📄 GeneratedPluginRegistrant.java
│   │   │   │   │   │   ├── 📁 kotlin
│   │   │   │   │   │   │   └── 📁 com
│   │   │   │   │   │   │       └── 📁 trustpassz
│   │   │   │   │   │   │           └── 📁 mb_user
│   │   │   │   │   │   │               └── 📁 mb_user
│   │   │   │   │   │   │                   └── 📄 MainActivity.kt
│   │   │   │   │   │   ├── 📁 res
│   │   │   │   │   │   │   ├── 📁 drawable
│   │   │   │   │   │   │   │   └── 📄 launch_background.xml
│   │   │   │   │   │   │   ├── 📁 drawable-v21
│   │   │   │   │   │   │   │   └── 📄 launch_background.xml
│   │   │   │   │   │   │   ├── 📁 mipmap-hdpi
│   │   │   │   │   │   │   │   └── 📄 ic_launcher.png
│   │   │   │   │   │   │   ├── 📁 mipmap-mdpi
│   │   │   │   │   │   │   │   └── 📄 ic_launcher.png
│   │   │   │   │   │   │   ├── 📁 mipmap-xhdpi
│   │   │   │   │   │   │   │   └── 📄 ic_launcher.png
│   │   │   │   │   │   │   ├── 📁 mipmap-xxhdpi
│   │   │   │   │   │   │   │   └── 📄 ic_launcher.png
│   │   │   │   │   │   │   ├── 📁 mipmap-xxxhdpi
│   │   │   │   │   │   │   │   └── 📄 ic_launcher.png
│   │   │   │   │   │   │   ├── 📁 values
│   │   │   │   │   │   │   │   └── 📄 styles.xml
│   │   │   │   │   │   │   └── 📁 values-night
│   │   │   │   │   │   │       └── 📄 styles.xml
│   │   │   │   │   │   └── 📄 AndroidManifest.xml
│   │   │   │   │   └── 📁 profile
│   │   │   │   │       └── 📄 AndroidManifest.xml
│   │   │   │   └── 📄 build.gradle.kts
│   │   │   ├── 📁 gradle
│   │   │   │   └── 📁 wrapper
│   │   │   │       ├── 📄 gradle-wrapper.jar
│   │   │   │       └── 📄 gradle-wrapper.properties
│   │   │   ├── 📄 .gitignore
│   │   │   ├── 📄 build.gradle.kts
│   │   │   ├── 📄 gradle.properties
│   │   │   ├── 📄 gradlew
│   │   │   ├── 📄 gradlew.bat
│   │   │   ├── 📄 local.properties
│   │   │   ├── 📄 mb_user_android.iml
│   │   │   └── 📄 settings.gradle.kts
│   │   ├── 📁 ios
│   │   │   ├── 📁 Flutter
│   │   │   │   ├── 📁 ephemeral
│   │   │   │   │   ├── 📄 flutter_lldb_helper.py
│   │   │   │   │   └── 📄 flutter_lldbinit
│   │   │   │   ├── 📄 AppFrameworkInfo.plist
│   │   │   │   ├── 📄 Debug.xcconfig
│   │   │   │   ├── 📄 flutter_export_environment.sh
│   │   │   │   ├── 📄 Generated.xcconfig
│   │   │   │   └── 📄 Release.xcconfig
│   │   │   ├── 📁 Runner
│   │   │   │   ├── 📁 Assets.xcassets
│   │   │   │   │   ├── 📁 AppIcon.appiconset
│   │   │   │   │   │   ├── 📄 Contents.json
│   │   │   │   │   │   ├── 📄 Icon-App-1024x1024@1x.png
│   │   │   │   │   │   ├── 📄 Icon-App-20x20@1x.png
│   │   │   │   │   │   ├── 📄 Icon-App-20x20@2x.png
│   │   │   │   │   │   ├── 📄 Icon-App-20x20@3x.png
│   │   │   │   │   │   ├── 📄 Icon-App-29x29@1x.png
│   │   │   │   │   │   ├── 📄 Icon-App-29x29@2x.png
│   │   │   │   │   │   ├── 📄 Icon-App-29x29@3x.png
│   │   │   │   │   │   ├── 📄 Icon-App-40x40@1x.png
│   │   │   │   │   │   ├── 📄 Icon-App-40x40@2x.png
│   │   │   │   │   │   ├── 📄 Icon-App-40x40@3x.png
│   │   │   │   │   │   ├── 📄 Icon-App-60x60@2x.png
│   │   │   │   │   │   ├── 📄 Icon-App-60x60@3x.png
│   │   │   │   │   │   ├── 📄 Icon-App-76x76@1x.png
│   │   │   │   │   │   ├── 📄 Icon-App-76x76@2x.png
│   │   │   │   │   │   └── 📄 Icon-App-83.5x83.5@2x.png
│   │   │   │   │   └── 📁 LaunchImage.imageset
│   │   │   │   │       ├── 📄 Contents.json
│   │   │   │   │       ├── 📄 LaunchImage.png
│   │   │   │   │       ├── 📄 LaunchImage@2x.png
│   │   │   │   │       ├── 📄 LaunchImage@3x.png
│   │   │   │   │       └── 📄 README.md
│   │   │   │   ├── 📁 Base.lproj
│   │   │   │   │   ├── 📄 LaunchScreen.storyboard
│   │   │   │   │   └── 📄 Main.storyboard
│   │   │   │   ├── 📄 AppDelegate.swift
│   │   │   │   ├── 📄 GeneratedPluginRegistrant.h
│   │   │   │   ├── 📄 GeneratedPluginRegistrant.m
│   │   │   │   ├── 📄 Info.plist
│   │   │   │   ├── 📄 Runner-Bridging-Header.h
│   │   │   │   └── 📄 SceneDelegate.swift
│   │   │   ├── 📁 Runner.xcodeproj
│   │   │   │   ├── 📁 project.xcworkspace
│   │   │   │   │   ├── 📁 xcshareddata
│   │   │   │   │   │   ├── 📄 IDEWorkspaceChecks.plist
│   │   │   │   │   │   └── 📄 WorkspaceSettings.xcsettings
│   │   │   │   │   └── 📄 contents.xcworkspacedata
│   │   │   │   ├── 📁 xcshareddata
│   │   │   │   │   └── 📁 xcschemes
│   │   │   │   │       └── 📄 Runner.xcscheme
│   │   │   │   └── 📄 project.pbxproj
│   │   │   ├── 📁 Runner.xcworkspace
│   │   │   │   ├── 📁 xcshareddata
│   │   │   │   │   ├── 📄 IDEWorkspaceChecks.plist
│   │   │   │   │   └── 📄 WorkspaceSettings.xcsettings
│   │   │   │   └── 📄 contents.xcworkspacedata
│   │   │   ├── 📁 RunnerTests
│   │   │   │   └── 📄 RunnerTests.swift
│   │   │   └── 📄 .gitignore
│   │   ├── 📁 lib
│   │   │   ├── 📁 models
│   │   │   │   ├── 📄 deal_model.dart
│   │   │   │   └── 📄 user_model.dart
│   │   │   ├── 📁 screens
│   │   │   │   ├── 📄 deal_room_screen.dart
│   │   │   │   ├── 📄 dispute_screen.dart
│   │   │   │   ├── 📄 greeting_screen.dart
│   │   │   │   ├── 📄 home_screen.dart
│   │   │   │   └── 📄 login_screen.dart
│   │   │   ├── 📁 services
│   │   │   │   ├── 📄 api_client.dart
│   │   │   │   ├── 📄 auth_service.dart
│   │   │   │   ├── 📄 deal_service.dart
│   │   │   │   └── 📄 secure_clipboard_service.dart
│   │   │   ├── 📁 widgets
│   │   │   │   ├── 📄 bargain_slider.dart
│   │   │   │   ├── 📄 deal_card.dart
│   │   │   │   ├── 📄 vault_modal.dart
│   │   │   │   └── 📄 vietqr_payment_view.dart
│   │   │   └── 📄 main.dart
│   │   ├── 📁 test
│   │   │   └── 📄 widget_test.dart
│   │   ├── 📁 web
│   │   │   ├── 📁 icons
│   │   │   │   ├── 📄 Icon-192.png
│   │   │   │   ├── 📄 Icon-512.png
│   │   │   │   ├── 📄 Icon-maskable-192.png
│   │   │   │   └── 📄 Icon-maskable-512.png
│   │   │   ├── 📄 favicon.png
│   │   │   ├── 📄 index.html
│   │   │   └── 📄 manifest.json
│   │   ├── 📄 .env
│   │   ├── 📄 .env.example
│   │   ├── 📄 .flutter-plugins-dependencies
│   │   ├── 📄 .gitignore
│   │   ├── 📄 .metadata
│   │   ├── 📄 analysis_options.yaml
│   │   ├── 📄 babel.config.js
│   │   ├── 📄 devtools_options.yaml
│   │   ├── 📄 metro.config.js
│   │   ├── 📄 pubspec.lock
│   │   ├── 📄 pubspec.yaml
│   │   └── 📄 README.md
│   └── 📁 server
│       ├── 📁 prisma
│       │   ├── 📁 migrations
│       │   │   └── 📄 init_schema.sql
│       │   ├── 📄 clean-all.ts
│       │   ├── 📄 clean-deals.ts
│       │   ├── 📄 schema.prisma
│       │   └── 📄 seed.ts
│       ├── 📁 src
│       │   ├── 📁 @types
│       │   │   ├── 📄 @types.md
│       │   │   └── 📄 index.d.ts
│       │   ├── 📁 abi
│       │   │   ├── 📄 DigitalEscrow.json
│       │   │   ├── 📄 DigitalEscrowABI.ts
│       │   │   └── 📄 index.ts
│       │   ├── 📁 common
│       │   │   ├── 📁 decorators
│       │   │   │   ├── 📄 current-user.decorator.ts
│       │   │   │   ├── 📄 public.decorator.ts
│       │   │   │   └── 📄 roles.decorator.ts
│       │   │   ├── 📁 filters
│       │   │   │   └── 📄 filters.md
│       │   │   ├── 📁 guards
│       │   │   │   ├── 📄 app-throttler.guard.ts
│       │   │   │   ├── 📄 auth.guard.ts
│       │   │   │   ├── 📄 guards.md
│       │   │   │   └── 📄 roles.guard.ts
│       │   │   ├── 📁 interceptors
│       │   │   │   └── 📄 interceptors.md
│       │   │   ├── 📁 middlewares
│       │   │   │   └── 📄 middlewares.md
│       │   │   ├── 📁 pipes
│       │   │   │   └── 📄 pipes.md
│       │   │   ├── 📁 utils
│       │   │   │   └── 📄 bigint-serializer.util.ts
│       │   │   └── 📄 common.md
│       │   ├── 📁 config
│       │   │   ├── 📄 app.config.ts
│       │   │   ├── 📄 config.md
│       │   │   ├── 📄 cors.config.ts
│       │   │   ├── 📄 env.config.ts
│       │   │   └── 📄 throttle.config.ts
│       │   ├── 📁 constants
│       │   │   ├── 📄 app.constant.ts
│       │   │   └── 📄 constants.md
│       │   ├── 📁 database
│       │   │   ├── 📄 database.md
│       │   │   ├── 📄 database.module.ts
│       │   │   ├── 📄 init_schema.sql
│       │   │   ├── 📄 pg.provider.ts
│       │   │   └── 📄 prisma.service.ts
│       │   ├── 📁 health
│       │   │   ├── 📄 health.controller.spec.ts
│       │   │   ├── 📄 health.controller.ts
│       │   │   ├── 📄 health.module.ts
│       │   │   └── 📄 health.service.ts
│       │   ├── 📁 integrations
│       │   │   └── 📁 supabase
│       │   │       ├── 📄 supabase.module.ts
│       │   │       └── 📄 supabase.service.ts
│       │   ├── 📁 keep-alive
│       │   │   ├── 📄 keep-alive.controller.ts
│       │   │   ├── 📄 keep-alive.module.ts
│       │   │   └── 📄 keep-alive.service.ts
│       │   ├── 📁 lib
│       │   │   └── 📄 viem-client.ts
│       │   ├── 📁 modules
│       │   │   ├── 📁 auth
│       │   │   │   ├── 📁 dto
│       │   │   │   │   └── 📄 verify-auth.dto.ts
│       │   │   │   ├── 📄 auth-nonce.service.ts
│       │   │   │   ├── 📄 auth-verifier.service.ts
│       │   │   │   ├── 📄 auth.controller.ts
│       │   │   │   ├── 📄 auth.module.ts
│       │   │   │   ├── 📄 auth.service.ts
│       │   │   │   └── 📄 jwt.service.ts
│       │   │   ├── 📁 bargains
│       │   │   │   ├── 📁 dto
│       │   │   │   │   └── 📄 bargain.dto.ts
│       │   │   │   ├── 📄 bargains.controller.ts
│       │   │   │   ├── 📄 bargains.module.ts
│       │   │   │   └── 📄 bargains.service.ts
│       │   │   ├── 📁 deals
│       │   │   │   ├── 📁 dto
│       │   │   │   │   ├── 📄 create-deal.dto.ts
│       │   │   │   │   ├── 📄 query-deal.dto.ts
│       │   │   │   │   └── 📄 update-deal.dto.ts
│       │   │   │   ├── 📄 deals.controller.ts
│       │   │   │   ├── 📄 deals.helper.ts
│       │   │   │   ├── 📄 deals.module.ts
│       │   │   │   └── 📄 deals.service.ts
│       │   │   ├── 📁 disputes
│       │   │   │   ├── 📁 dto
│       │   │   │   │   └── 📄 dispute.dto.ts
│       │   │   │   ├── 📄 disputes.controller.ts
│       │   │   │   ├── 📄 disputes.module.ts
│       │   │   │   └── 📄 disputes.service.ts
│       │   │   ├── 📁 orders
│       │   │   │   ├── 📁 dto
│       │   │   │   │   └── 📄 order.dto.ts
│       │   │   │   ├── 📄 orders.controller.ts
│       │   │   │   ├── 📄 orders.module.ts
│       │   │   │   └── 📄 orders.service.ts
│       │   │   ├── 📁 payments
│       │   │   │   ├── 📁 dto
│       │   │   │   │   ├── 📄 create-payment-link.dto.ts
│       │   │   │   │   ├── 📄 payment.dto.ts
│       │   │   │   │   └── 📄 payos-webhook.dto.ts
│       │   │   │   ├── 📄 payments.controller.spec.ts
│       │   │   │   ├── 📄 payments.controller.ts
│       │   │   │   ├── 📄 payments.module.ts
│       │   │   │   ├── 📄 payments.service.spec.ts
│       │   │   │   ├── 📄 payments.service.ts
│       │   │   │   ├── 📄 webhook.controller.spec.ts
│       │   │   │   └── 📄 webhook.controller.ts
│       │   │   ├── 📁 products
│       │   │   │   ├── 📁 dto
│       │   │   │   │   └── 📄 product.dto.ts
│       │   │   │   ├── 📄 products.controller.ts
│       │   │   │   ├── 📄 products.module.ts
│       │   │   │   └── 📄 products.service.ts
│       │   │   ├── 📁 template_modules
│       │   │   │   ├── 📁 dto
│       │   │   │   │   ├── 📄 create-template-module.dto.ts
│       │   │   │   │   ├── 📄 dto.md
│       │   │   │   │   ├── 📄 query-template-module.dto.ts
│       │   │   │   │   └── 📄 update-template-module.dto.ts
│       │   │   │   ├── 📁 entities
│       │   │   │   │   ├── 📄 entities.md
│       │   │   │   │   └── 📄 template-module.entity.ts
│       │   │   │   ├── 📁 interfaces
│       │   │   │   │   ├── 📄 interfaces.md
│       │   │   │   │   └── 📄 template-module.interface.ts
│       │   │   │   ├── 📁 repositories
│       │   │   │   │   ├── 📄 repositories.md
│       │   │   │   │   └── 📄 template-modules.repository.ts
│       │   │   │   ├── 📄 template_modules.md
│       │   │   │   ├── 📄 template-modules.controller.ts
│       │   │   │   ├── 📄 template-modules.module.ts
│       │   │   │   ├── 📄 template-modules.service.ts
│       │   │   │   └── 📄 template-modules.swagger.ts
│       │   │   ├── 📁 users
│       │   │   │   ├── 📁 dto
│       │   │   │   │   ├── 📄 storefront.dto.ts
│       │   │   │   │   └── 📄 update-user.dto.ts
│       │   │   │   ├── 📄 users.controller.ts
│       │   │   │   ├── 📄 users.md
│       │   │   │   ├── 📄 users.module.ts
│       │   │   │   └── 📄 users.service.ts
│       │   │   └── 📄 modules.md
│       │   ├── 📁 oracle-relayer
│       │   │   ├── 📄 async-mutex.ts
│       │   │   ├── 📄 oracle-relayer.config.ts
│       │   │   ├── 📄 oracle-relayer.module.ts
│       │   │   ├── 📄 oracle-relayer.service.spec.ts
│       │   │   ├── 📄 oracle-relayer.service.ts
│       │   │   └── 📄 oracle-relayer.types.ts
│       │   ├── 📁 swagger
│       │   │   ├── 📄 swagger.config.ts
│       │   │   └── 📄 swagger.md
│       │   ├── 📁 utils
│       │   │   ├── 📄 response.util.ts
│       │   │   └── 📄 utils.md
│       │   ├── 📁 validators
│       │   │   ├── 📄 uuid.validator.ts
│       │   │   └── 📄 validators.md
│       │   ├── 📄 app.controller.spec.ts
│       │   ├── 📄 app.controller.ts
│       │   ├── 📄 app.module.ts
│       │   ├── 📄 app.service.ts
│       │   ├── 📄 main.ts
│       │   └── 📄 src.md
│       ├── 📁 test
│       │   ├── 📁 mocks
│       │   │   ├── 📄 payments-webhook.mock.ts
│       │   │   └── 📄 prisma.mock.ts
│       │   ├── 📄 app.e2e-spec.ts
│       │   ├── 📄 deals.e2e-spec.ts
│       │   ├── 📄 jest-e2e.json
│       │   ├── 📄 payments-webhook.e2e-spec.ts
│       │   ├── 📄 task-a-10.e2e-spec.ts
│       │   └── 📄 test.md
│       ├── 📄 .dockerignore
│       ├── 📄 .env
│       ├── 📄 .env.deploy
│       ├── 📄 .env.example
│       ├── 📄 .gitignore
│       ├── 📄 .prettierrc
│       ├── 📄 Dockerfile
│       ├── 📄 eslint.config.mjs
│       ├── 📄 nest-cli.json
│       ├── 📄 package-lock.json
│       ├── 📄 package.json
│       ├── 📄 README.md
│       ├── 📄 server.md
│       ├── 📄 tsconfig.build.json
│       └── 📄 tsconfig.json
├── 📁 artifacts
│   ├── 📄 ai-pipeline-benchmark.json
│   ├── 📄 oracle-balance-alert.json
│   ├── 📄 quality-gate-report.json
│   └── 📄 relayer-gas-report.json
├── 📁 assets
│   ├── 📄 landingpage_1.png
│   └── 📄 logo.png
├── 📁 deploy
│   ├── 📁 iam
│   │   ├── 📄 aws-secretsmanager-policy.json
│   │   └── 📄 gcp-secretmanager-policy.json
│   └── 📄 secrets.temp.template.txt
├── 📁 packages
│   └── 📁 contracts
│       ├── 📁 broadcast
│       │   └── 📁 DeployEscrow.s.sol
│       │       └── 📁 84532
│       │           └── 📄 run-latest.json
│       ├── 📁 lib
│       │   ├── 📁 forge-std
│       │   │   ├── 📁 .github
│       │   │   │   ├── 📁 workflows
│       │   │   │   │   ├── 📄 ci.yml
│       │   │   │   │   ├── 📄 scan-github-actions.yml
│       │   │   │   │   └── 📄 sync.yml
│       │   │   │   ├── 📄 CODEOWNERS
│       │   │   │   └── 📄 dependabot.yml
│       │   │   ├── 📁 scripts
│       │   │   │   └── 📄 vm.py
│       │   │   ├── 📁 src
│       │   │   │   ├── 📁 interfaces
│       │   │   │   │   ├── 📄 IERC1155.sol
│       │   │   │   │   ├── 📄 IERC165.sol
│       │   │   │   │   ├── 📄 IERC20.sol
│       │   │   │   │   ├── 📄 IERC4626.sol
│       │   │   │   │   ├── 📄 IERC6909.sol
│       │   │   │   │   ├── 📄 IERC721.sol
│       │   │   │   │   ├── 📄 IERC7540.sol
│       │   │   │   │   ├── 📄 IERC7575.sol
│       │   │   │   │   └── 📄 IMulticall3.sol
│       │   │   │   ├── 📄 Base.sol
│       │   │   │   ├── 📄 Config.sol
│       │   │   │   ├── 📄 console.sol
│       │   │   │   ├── 📄 console2.sol
│       │   │   │   ├── 📄 LibVariable.sol
│       │   │   │   ├── 📄 safeconsole.sol
│       │   │   │   ├── 📄 Script.sol
│       │   │   │   ├── 📄 StdAssertions.sol
│       │   │   │   ├── 📄 StdChains.sol
│       │   │   │   ├── 📄 StdCheats.sol
│       │   │   │   ├── 📄 StdConfig.sol
│       │   │   │   ├── 📄 StdConstants.sol
│       │   │   │   ├── 📄 StdError.sol
│       │   │   │   ├── 📄 StdInvariant.sol
│       │   │   │   ├── 📄 StdJson.sol
│       │   │   │   ├── 📄 StdMath.sol
│       │   │   │   ├── 📄 StdSecp256k1.sol
│       │   │   │   ├── 📄 StdStorage.sol
│       │   │   │   ├── 📄 StdStyle.sol
│       │   │   │   ├── 📄 StdToml.sol
│       │   │   │   ├── 📄 StdUtils.sol
│       │   │   │   ├── 📄 Test.sol
│       │   │   │   └── 📄 Vm.sol
│       │   │   ├── 📁 test
│       │   │   │   ├── 📁 compilation
│       │   │   │   │   ├── 📄 CompilationScript.sol
│       │   │   │   │   ├── 📄 CompilationScriptBase.sol
│       │   │   │   │   ├── 📄 CompilationTest.sol
│       │   │   │   │   └── 📄 CompilationTestBase.sol
│       │   │   │   ├── 📁 fixtures
│       │   │   │   │   ├── 📄 broadcast.log.json
│       │   │   │   │   ├── 📄 config.toml
│       │   │   │   │   ├── 📄 test.json
│       │   │   │   │   └── 📄 test.toml
│       │   │   │   ├── 📄 CommonBase.t.sol
│       │   │   │   ├── 📄 Config.t.sol
│       │   │   │   ├── 📄 LibVariable.t.sol
│       │   │   │   ├── 📄 StdAssertions.t.sol
│       │   │   │   ├── 📄 StdChains.t.sol
│       │   │   │   ├── 📄 StdCheats.t.sol
│       │   │   │   ├── 📄 StdConstants.t.sol
│       │   │   │   ├── 📄 StdError.t.sol
│       │   │   │   ├── 📄 StdJson.t.sol
│       │   │   │   ├── 📄 StdMath.t.sol
│       │   │   │   ├── 📄 StdStorage.t.sol
│       │   │   │   ├── 📄 StdStyle.t.sol
│       │   │   │   ├── 📄 StdToml.t.sol
│       │   │   │   ├── 📄 StdUtils.t.sol
│       │   │   │   └── 📄 Vm.t.sol
│       │   │   ├── 📄 .gitattributes
│       │   │   ├── 📄 .gitignore
│       │   │   ├── 📄 CONTRIBUTING.md
│       │   │   ├── 📄 foundry.toml
│       │   │   ├── 📄 LICENSE-APACHE
│       │   │   ├── 📄 LICENSE-MIT
│       │   │   ├── 📄 package.json
│       │   │   ├── 📄 README.md
│       │   │   └── 📄 RELEASE_CHECKLIST.md
│       │   └── 📁 openzeppelin-contracts
│       │       ├── 📁 .changeset
│       │       │   └── 📄 config.json
│       │       ├── 📁 .githooks
│       │       │   └── 📄 pre-push
│       │       ├── 📁 .github
│       │       │   ├── 📁 actions
│       │       │   │   ├── 📁 gas-compare
│       │       │   │   │   └── 📄 action.yml
│       │       │   │   ├── 📁 setup
│       │       │   │   │   └── 📄 action.yml
│       │       │   │   └── 📁 storage-layout
│       │       │   │       └── 📄 action.yml
│       │       │   ├── 📁 ISSUE_TEMPLATE
│       │       │   │   ├── 📄 bug_report.md
│       │       │   │   ├── 📄 config.yml
│       │       │   │   └── 📄 feature_request.md
│       │       │   ├── 📁 workflows
│       │       │   │   ├── 📄 actionlint.yml
│       │       │   │   ├── 📄 changeset.yml
│       │       │   │   ├── 📄 checks.yml
│       │       │   │   ├── 📄 docs.yml
│       │       │   │   ├── 📄 formal-verification.yml
│       │       │   │   ├── 📄 release-cycle.yml
│       │       │   │   └── 📄 upgradeable.yml
│       │       │   └── 📄 PULL_REQUEST_TEMPLATE.md
│       │       ├── 📁 audits
│       │       │   ├── 📄 2017-03.md
│       │       │   ├── 📄 2018-10.pdf
│       │       │   ├── 📄 2022-10-Checkpoints.pdf
│       │       │   ├── 📄 2022-10-ERC4626.pdf
│       │       │   ├── 📄 2023-05-v4.9.pdf
│       │       │   ├── 📄 2023-10-v5.0.pdf
│       │       │   ├── 📄 2024-10-v5.1.pdf
│       │       │   └── 📄 README.md
│       │       ├── 📁 certora
│       │       │   ├── 📁 diff
│       │       │   │   └── 📄 access_manager_AccessManager.sol.patch
│       │       │   ├── 📁 harnesses
│       │       │   │   ├── 📄 AccessControlDefaultAdminRulesHarness.sol
│       │       │   │   ├── 📄 AccessControlHarness.sol
│       │       │   │   ├── 📄 AccessManagedHarness.sol
│       │       │   │   ├── 📄 AccessManagerHarness.sol
│       │       │   │   ├── 📄 DoubleEndedQueueHarness.sol
│       │       │   │   ├── 📄 EnumerableMapHarness.sol
│       │       │   │   ├── 📄 EnumerableSetHarness.sol
│       │       │   │   ├── 📄 ERC20FlashMintHarness.sol
│       │       │   │   ├── 📄 ERC20PermitHarness.sol
│       │       │   │   ├── 📄 ERC20WrapperHarness.sol
│       │       │   │   ├── 📄 ERC3156FlashBorrowerHarness.sol
│       │       │   │   ├── 📄 ERC721Harness.sol
│       │       │   │   ├── 📄 ERC721ReceiverHarness.sol
│       │       │   │   ├── 📄 InitializableHarness.sol
│       │       │   │   ├── 📄 NoncesHarness.sol
│       │       │   │   ├── 📄 Ownable2StepHarness.sol
│       │       │   │   ├── 📄 OwnableHarness.sol
│       │       │   │   ├── 📄 PausableHarness.sol
│       │       │   │   └── 📄 TimelockControllerHarness.sol
│       │       │   ├── 📁 reports
│       │       │   │   ├── 📄 2021-10.pdf
│       │       │   │   ├── 📄 2022-03.pdf
│       │       │   │   └── 📄 2022-05.pdf
│       │       │   ├── 📁 specs
│       │       │   │   ├── 📁 helpers
│       │       │   │   │   └── 📄 helpers.spec
│       │       │   │   ├── 📁 methods
│       │       │   │   │   ├── 📄 IAccessControl.spec
│       │       │   │   │   ├── 📄 IAccessControlDefaultAdminRules.spec
│       │       │   │   │   ├── 📄 IAccessManaged.spec
│       │       │   │   │   ├── 📄 IAccessManager.spec
│       │       │   │   │   ├── 📄 IERC20.spec
│       │       │   │   │   ├── 📄 IERC2612.spec
│       │       │   │   │   ├── 📄 IERC3156FlashBorrower.spec
│       │       │   │   │   ├── 📄 IERC3156FlashLender.spec
│       │       │   │   │   ├── 📄 IERC5313.spec
│       │       │   │   │   ├── 📄 IERC721.spec
│       │       │   │   │   ├── 📄 IERC721Receiver.spec
│       │       │   │   │   ├── 📄 IOwnable.spec
│       │       │   │   │   └── 📄 IOwnable2Step.spec
│       │       │   │   ├── 📄 AccessControl.spec
│       │       │   │   ├── 📄 AccessControlDefaultAdminRules.spec
│       │       │   │   ├── 📄 AccessManaged.spec
│       │       │   │   ├── 📄 AccessManager.spec
│       │       │   │   ├── 📄 DoubleEndedQueue.spec
│       │       │   │   ├── 📄 EnumerableMap.spec
│       │       │   │   ├── 📄 EnumerableSet.spec
│       │       │   │   ├── 📄 ERC20.spec
│       │       │   │   ├── 📄 ERC20FlashMint.spec
│       │       │   │   ├── 📄 ERC20Wrapper.spec
│       │       │   │   ├── 📄 ERC721.spec
│       │       │   │   ├── 📄 Initializable.spec
│       │       │   │   ├── 📄 Nonces.spec
│       │       │   │   ├── 📄 Ownable.spec
│       │       │   │   ├── 📄 Ownable2Step.spec
│       │       │   │   ├── 📄 Pausable.spec
│       │       │   │   └── 📄 TimelockController.spec
│       │       │   ├── 📄 .gitignore
│       │       │   ├── 📄 Makefile
│       │       │   ├── 📄 README.md
│       │       │   ├── 📄 run.js
│       │       │   └── 📄 specs.json
│       │       ├── 📁 contracts
│       │       │   ├── 📁 access
│       │       │   │   ├── 📁 extensions
│       │       │   │   │   ├── 📄 AccessControlDefaultAdminRules.sol
│       │       │   │   │   ├── 📄 AccessControlEnumerable.sol
│       │       │   │   │   ├── 📄 IAccessControlDefaultAdminRules.sol
│       │       │   │   │   └── 📄 IAccessControlEnumerable.sol
│       │       │   │   ├── 📁 manager
│       │       │   │   │   ├── 📄 AccessManaged.sol
│       │       │   │   │   ├── 📄 AccessManager.sol
│       │       │   │   │   ├── 📄 AuthorityUtils.sol
│       │       │   │   │   ├── 📄 IAccessManaged.sol
│       │       │   │   │   ├── 📄 IAccessManager.sol
│       │       │   │   │   └── 📄 IAuthority.sol
│       │       │   │   ├── 📄 AccessControl.sol
│       │       │   │   ├── 📄 IAccessControl.sol
│       │       │   │   ├── 📄 Ownable.sol
│       │       │   │   ├── 📄 Ownable2Step.sol
│       │       │   │   └── 📄 README.adoc
│       │       │   ├── 📁 account
│       │       │   │   ├── 📁 utils
│       │       │   │   │   ├── 📄 draft-ERC4337Utils.sol
│       │       │   │   │   └── 📄 draft-ERC7579Utils.sol
│       │       │   │   └── 📄 README.adoc
│       │       │   ├── 📁 finance
│       │       │   │   ├── 📄 README.adoc
│       │       │   │   ├── 📄 VestingWallet.sol
│       │       │   │   └── 📄 VestingWalletCliff.sol
│       │       │   ├── 📁 governance
│       │       │   │   ├── 📁 extensions
│       │       │   │   │   ├── 📄 GovernorCountingFractional.sol
│       │       │   │   │   ├── 📄 GovernorCountingOverridable.sol
│       │       │   │   │   ├── 📄 GovernorCountingSimple.sol
│       │       │   │   │   ├── 📄 GovernorPreventLateQuorum.sol
│       │       │   │   │   ├── 📄 GovernorSettings.sol
│       │       │   │   │   ├── 📄 GovernorStorage.sol
│       │       │   │   │   ├── 📄 GovernorTimelockAccess.sol
│       │       │   │   │   ├── 📄 GovernorTimelockCompound.sol
│       │       │   │   │   ├── 📄 GovernorTimelockControl.sol
│       │       │   │   │   ├── 📄 GovernorVotes.sol
│       │       │   │   │   └── 📄 GovernorVotesQuorumFraction.sol
│       │       │   │   ├── 📁 utils
│       │       │   │   │   ├── 📄 IVotes.sol
│       │       │   │   │   ├── 📄 Votes.sol
│       │       │   │   │   └── 📄 VotesExtended.sol
│       │       │   │   ├── 📄 Governor.sol
│       │       │   │   ├── 📄 IGovernor.sol
│       │       │   │   ├── 📄 README.adoc
│       │       │   │   └── 📄 TimelockController.sol
│       │       │   ├── 📁 interfaces
│       │       │   │   ├── 📄 draft-IERC1822.sol
│       │       │   │   ├── 📄 draft-IERC4337.sol
│       │       │   │   ├── 📄 draft-IERC6093.sol
│       │       │   │   ├── 📄 draft-IERC7579.sol
│       │       │   │   ├── 📄 draft-IERC7674.sol
│       │       │   │   ├── 📄 IERC1155.sol
│       │       │   │   ├── 📄 IERC1155MetadataURI.sol
│       │       │   │   ├── 📄 IERC1155Receiver.sol
│       │       │   │   ├── 📄 IERC1271.sol
│       │       │   │   ├── 📄 IERC1363.sol
│       │       │   │   ├── 📄 IERC1363Receiver.sol
│       │       │   │   ├── 📄 IERC1363Spender.sol
│       │       │   │   ├── 📄 IERC165.sol
│       │       │   │   ├── 📄 IERC1820Implementer.sol
│       │       │   │   ├── 📄 IERC1820Registry.sol
│       │       │   │   ├── 📄 IERC1967.sol
│       │       │   │   ├── 📄 IERC20.sol
│       │       │   │   ├── 📄 IERC20Metadata.sol
│       │       │   │   ├── 📄 IERC2309.sol
│       │       │   │   ├── 📄 IERC2612.sol
│       │       │   │   ├── 📄 IERC2981.sol
│       │       │   │   ├── 📄 IERC3156.sol
│       │       │   │   ├── 📄 IERC3156FlashBorrower.sol
│       │       │   │   ├── 📄 IERC3156FlashLender.sol
│       │       │   │   ├── 📄 IERC4626.sol
│       │       │   │   ├── 📄 IERC4906.sol
│       │       │   │   ├── 📄 IERC5267.sol
│       │       │   │   ├── 📄 IERC5313.sol
│       │       │   │   ├── 📄 IERC5805.sol
│       │       │   │   ├── 📄 IERC6372.sol
│       │       │   │   ├── 📄 IERC721.sol
│       │       │   │   ├── 📄 IERC721Enumerable.sol
│       │       │   │   ├── 📄 IERC721Metadata.sol
│       │       │   │   ├── 📄 IERC721Receiver.sol
│       │       │   │   ├── 📄 IERC777.sol
│       │       │   │   ├── 📄 IERC777Recipient.sol
│       │       │   │   ├── 📄 IERC777Sender.sol
│       │       │   │   └── 📄 README.adoc
│       │       │   ├── 📁 metatx
│       │       │   │   ├── 📄 ERC2771Context.sol
│       │       │   │   ├── 📄 ERC2771Forwarder.sol
│       │       │   │   └── 📄 README.adoc
│       │       │   ├── 📁 mocks
│       │       │   │   ├── 📁 account
│       │       │   │   │   └── 📁 utils
│       │       │   │   │       └── 📄 ERC7579UtilsMock.sol
│       │       │   │   ├── 📁 compound
│       │       │   │   │   └── 📄 CompTimelock.sol
│       │       │   │   ├── 📁 docs
│       │       │   │   │   ├── 📁 access-control
│       │       │   │   │   │   ├── 📄 AccessControlERC20MintBase.sol
│       │       │   │   │   │   ├── 📄 AccessControlERC20MintMissing.sol
│       │       │   │   │   │   ├── 📄 AccessControlERC20MintOnlyRole.sol
│       │       │   │   │   │   ├── 📄 AccessControlModified.sol
│       │       │   │   │   │   ├── 📄 AccessControlNonRevokableAdmin.sol
│       │       │   │   │   │   ├── 📄 AccessManagedERC20MintBase.sol
│       │       │   │   │   │   └── 📄 MyContractOwnable.sol
│       │       │   │   │   ├── 📁 governance
│       │       │   │   │   │   ├── 📄 MyGovernor.sol
│       │       │   │   │   │   ├── 📄 MyToken.sol
│       │       │   │   │   │   ├── 📄 MyTokenTimestampBased.sol
│       │       │   │   │   │   └── 📄 MyTokenWrapped.sol
│       │       │   │   │   ├── 📁 token
│       │       │   │   │   │   ├── 📁 ERC1155
│       │       │   │   │   │   │   ├── 📄 GameItems.sol
│       │       │   │   │   │   │   └── 📄 MyERC115HolderContract.sol
│       │       │   │   │   │   ├── 📁 ERC20
│       │       │   │   │   │   │   └── 📄 GLDToken.sol
│       │       │   │   │   │   └── 📁 ERC721
│       │       │   │   │   │       └── 📄 GameItem.sol
│       │       │   │   │   ├── 📁 utilities
│       │       │   │   │   │   ├── 📄 Base64NFT.sol
│       │       │   │   │   │   └── 📄 Multicall.sol
│       │       │   │   │   ├── 📄 ERC20WithAutoMinerReward.sol
│       │       │   │   │   ├── 📄 ERC4626Fees.sol
│       │       │   │   │   └── 📄 MyNFT.sol
│       │       │   │   ├── 📁 ERC165
│       │       │   │   │   ├── 📄 ERC165InterfacesSupported.sol
│       │       │   │   │   ├── 📄 ERC165MaliciousData.sol
│       │       │   │   │   ├── 📄 ERC165MissingData.sol
│       │       │   │   │   ├── 📄 ERC165NotSupported.sol
│       │       │   │   │   └── 📄 ERC165ReturnBomb.sol
│       │       │   │   ├── 📁 governance
│       │       │   │   │   ├── 📄 GovernorCountingOverridableMock.sol
│       │       │   │   │   ├── 📄 GovernorFractionalMock.sol
│       │       │   │   │   ├── 📄 GovernorMock.sol
│       │       │   │   │   ├── 📄 GovernorPreventLateQuorumMock.sol
│       │       │   │   │   ├── 📄 GovernorStorageMock.sol
│       │       │   │   │   ├── 📄 GovernorTimelockAccessMock.sol
│       │       │   │   │   ├── 📄 GovernorTimelockCompoundMock.sol
│       │       │   │   │   ├── 📄 GovernorTimelockControlMock.sol
│       │       │   │   │   ├── 📄 GovernorVoteMock.sol
│       │       │   │   │   └── 📄 GovernorWithParamsMock.sol
│       │       │   │   ├── 📁 proxy
│       │       │   │   │   ├── 📄 BadBeacon.sol
│       │       │   │   │   ├── 📄 ClashingImplementation.sol
│       │       │   │   │   └── 📄 UUPSUpgradeableMock.sol
│       │       │   │   ├── 📁 token
│       │       │   │   │   ├── 📄 ERC1155ReceiverMock.sol
│       │       │   │   │   ├── 📄 ERC1363ForceApproveMock.sol
│       │       │   │   │   ├── 📄 ERC1363NoReturnMock.sol
│       │       │   │   │   ├── 📄 ERC1363ReceiverMock.sol
│       │       │   │   │   ├── 📄 ERC1363ReturnFalseMock.sol
│       │       │   │   │   ├── 📄 ERC1363SpenderMock.sol
│       │       │   │   │   ├── 📄 ERC20ApprovalMock.sol
│       │       │   │   │   ├── 📄 ERC20DecimalsMock.sol
│       │       │   │   │   ├── 📄 ERC20ExcessDecimalsMock.sol
│       │       │   │   │   ├── 📄 ERC20FlashMintMock.sol
│       │       │   │   │   ├── 📄 ERC20ForceApproveMock.sol
│       │       │   │   │   ├── 📄 ERC20GetterHelper.sol
│       │       │   │   │   ├── 📄 ERC20Mock.sol
│       │       │   │   │   ├── 📄 ERC20MulticallMock.sol
│       │       │   │   │   ├── 📄 ERC20NoReturnMock.sol
│       │       │   │   │   ├── 📄 ERC20Reentrant.sol
│       │       │   │   │   ├── 📄 ERC20ReturnFalseMock.sol
│       │       │   │   │   ├── 📄 ERC20VotesAdditionalCheckpointsMock.sol
│       │       │   │   │   ├── 📄 ERC20VotesLegacyMock.sol
│       │       │   │   │   ├── 📄 ERC20VotesTimestampMock.sol
│       │       │   │   │   ├── 📄 ERC4626LimitsMock.sol
│       │       │   │   │   ├── 📄 ERC4626Mock.sol
│       │       │   │   │   ├── 📄 ERC4626OffsetMock.sol
│       │       │   │   │   ├── 📄 ERC4646FeesMock.sol
│       │       │   │   │   ├── 📄 ERC721ConsecutiveEnumerableMock.sol
│       │       │   │   │   ├── 📄 ERC721ConsecutiveMock.sol
│       │       │   │   │   ├── 📄 ERC721ReceiverMock.sol
│       │       │   │   │   └── 📄 ERC721URIStorageMock.sol
│       │       │   │   ├── 📄 AccessManagedTarget.sol
│       │       │   │   ├── 📄 AccessManagerMock.sol
│       │       │   │   ├── 📄 ArraysMock.sol
│       │       │   │   ├── 📄 AuthorityMock.sol
│       │       │   │   ├── 📄 Base64Dirty.sol
│       │       │   │   ├── 📄 BatchCaller.sol
│       │       │   │   ├── 📄 CallReceiverMock.sol
│       │       │   │   ├── 📄 ConstructorMock.sol
│       │       │   │   ├── 📄 ContextMock.sol
│       │       │   │   ├── 📄 DummyImplementation.sol
│       │       │   │   ├── 📄 EIP712Verifier.sol
│       │       │   │   ├── 📄 ERC1271WalletMock.sol
│       │       │   │   ├── 📄 ERC2771ContextMock.sol
│       │       │   │   ├── 📄 ERC3156FlashBorrowerMock.sol
│       │       │   │   ├── 📄 EtherReceiverMock.sol
│       │       │   │   ├── 📄 InitializableMock.sol
│       │       │   │   ├── 📄 MerkleProofCustomHashMock.sol
│       │       │   │   ├── 📄 MerkleTreeMock.sol
│       │       │   │   ├── 📄 MulticallHelper.sol
│       │       │   │   ├── 📄 MultipleInheritanceInitializableMocks.sol
│       │       │   │   ├── 📄 PausableMock.sol
│       │       │   │   ├── 📄 ReentrancyAttack.sol
│       │       │   │   ├── 📄 ReentrancyMock.sol
│       │       │   │   ├── 📄 ReentrancyTransientMock.sol
│       │       │   │   ├── 📄 RegressionImplementation.sol
│       │       │   │   ├── 📄 SingleInheritanceInitializableMocks.sol
│       │       │   │   ├── 📄 Stateless.sol
│       │       │   │   ├── 📄 StorageSlotMock.sol
│       │       │   │   ├── 📄 TimelockReentrant.sol
│       │       │   │   ├── 📄 TransientSlotMock.sol
│       │       │   │   ├── 📄 UpgradeableBeaconMock.sol
│       │       │   │   ├── 📄 VotesExtendedMock.sol
│       │       │   │   └── 📄 VotesMock.sol
│       │       │   ├── 📁 proxy
│       │       │   │   ├── 📁 beacon
│       │       │   │   │   ├── 📄 BeaconProxy.sol
│       │       │   │   │   ├── 📄 IBeacon.sol
│       │       │   │   │   └── 📄 UpgradeableBeacon.sol
│       │       │   │   ├── 📁 ERC1967
│       │       │   │   │   ├── 📄 ERC1967Proxy.sol
│       │       │   │   │   └── 📄 ERC1967Utils.sol
│       │       │   │   ├── 📁 transparent
│       │       │   │   │   ├── 📄 ProxyAdmin.sol
│       │       │   │   │   └── 📄 TransparentUpgradeableProxy.sol
│       │       │   │   ├── 📁 utils
│       │       │   │   │   ├── 📄 Initializable.sol
│       │       │   │   │   └── 📄 UUPSUpgradeable.sol
│       │       │   │   ├── 📄 Clones.sol
│       │       │   │   ├── 📄 Proxy.sol
│       │       │   │   └── 📄 README.adoc
│       │       │   ├── 📁 token
│       │       │   │   ├── 📁 common
│       │       │   │   │   ├── 📄 ERC2981.sol
│       │       │   │   │   └── 📄 README.adoc
│       │       │   │   ├── 📁 ERC1155
│       │       │   │   │   ├── 📁 extensions
│       │       │   │   │   │   ├── 📄 ERC1155Burnable.sol
│       │       │   │   │   │   ├── 📄 ERC1155Pausable.sol
│       │       │   │   │   │   ├── 📄 ERC1155Supply.sol
│       │       │   │   │   │   ├── 📄 ERC1155URIStorage.sol
│       │       │   │   │   │   └── 📄 IERC1155MetadataURI.sol
│       │       │   │   │   ├── 📁 utils
│       │       │   │   │   │   ├── 📄 ERC1155Holder.sol
│       │       │   │   │   │   └── 📄 ERC1155Utils.sol
│       │       │   │   │   ├── 📄 ERC1155.sol
│       │       │   │   │   ├── 📄 IERC1155.sol
│       │       │   │   │   ├── 📄 IERC1155Receiver.sol
│       │       │   │   │   └── 📄 README.adoc
│       │       │   │   ├── 📁 ERC20
│       │       │   │   │   ├── 📁 extensions
│       │       │   │   │   │   ├── 📄 draft-ERC20TemporaryApproval.sol
│       │       │   │   │   │   ├── 📄 ERC1363.sol
│       │       │   │   │   │   ├── 📄 ERC20Burnable.sol
│       │       │   │   │   │   ├── 📄 ERC20Capped.sol
│       │       │   │   │   │   ├── 📄 ERC20FlashMint.sol
│       │       │   │   │   │   ├── 📄 ERC20Pausable.sol
│       │       │   │   │   │   ├── 📄 ERC20Permit.sol
│       │       │   │   │   │   ├── 📄 ERC20Votes.sol
│       │       │   │   │   │   ├── 📄 ERC20Wrapper.sol
│       │       │   │   │   │   ├── 📄 ERC4626.sol
│       │       │   │   │   │   ├── 📄 IERC20Metadata.sol
│       │       │   │   │   │   └── 📄 IERC20Permit.sol
│       │       │   │   │   ├── 📁 utils
│       │       │   │   │   │   ├── 📄 ERC1363Utils.sol
│       │       │   │   │   │   └── 📄 SafeERC20.sol
│       │       │   │   │   ├── 📄 ERC20.sol
│       │       │   │   │   ├── 📄 IERC20.sol
│       │       │   │   │   └── 📄 README.adoc
│       │       │   │   └── 📁 ERC721
│       │       │   │       ├── 📁 extensions
│       │       │   │       │   ├── 📄 ERC721Burnable.sol
│       │       │   │       │   ├── 📄 ERC721Consecutive.sol
│       │       │   │       │   ├── 📄 ERC721Enumerable.sol
│       │       │   │       │   ├── 📄 ERC721Pausable.sol
│       │       │   │       │   ├── 📄 ERC721Royalty.sol
│       │       │   │       │   ├── 📄 ERC721URIStorage.sol
│       │       │   │       │   ├── 📄 ERC721Votes.sol
│       │       │   │       │   ├── 📄 ERC721Wrapper.sol
│       │       │   │       │   ├── 📄 IERC721Enumerable.sol
│       │       │   │       │   └── 📄 IERC721Metadata.sol
│       │       │   │       ├── 📁 utils
│       │       │   │       │   ├── 📄 ERC721Holder.sol
│       │       │   │       │   └── 📄 ERC721Utils.sol
│       │       │   │       ├── 📄 ERC721.sol
│       │       │   │       ├── 📄 IERC721.sol
│       │       │   │       ├── 📄 IERC721Receiver.sol
│       │       │   │       └── 📄 README.adoc
│       │       │   ├── 📁 utils
│       │       │   │   ├── 📁 cryptography
│       │       │   │   │   ├── 📄 ECDSA.sol
│       │       │   │   │   ├── 📄 EIP712.sol
│       │       │   │   │   ├── 📄 Hashes.sol
│       │       │   │   │   ├── 📄 MerkleProof.sol
│       │       │   │   │   ├── 📄 MessageHashUtils.sol
│       │       │   │   │   ├── 📄 P256.sol
│       │       │   │   │   ├── 📄 RSA.sol
│       │       │   │   │   └── 📄 SignatureChecker.sol
│       │       │   │   ├── 📁 introspection
│       │       │   │   │   ├── 📄 ERC165.sol
│       │       │   │   │   ├── 📄 ERC165Checker.sol
│       │       │   │   │   └── 📄 IERC165.sol
│       │       │   │   ├── 📁 math
│       │       │   │   │   ├── 📄 Math.sol
│       │       │   │   │   ├── 📄 SafeCast.sol
│       │       │   │   │   └── 📄 SignedMath.sol
│       │       │   │   ├── 📁 structs
│       │       │   │   │   ├── 📄 BitMaps.sol
│       │       │   │   │   ├── 📄 Checkpoints.sol
│       │       │   │   │   ├── 📄 CircularBuffer.sol
│       │       │   │   │   ├── 📄 DoubleEndedQueue.sol
│       │       │   │   │   ├── 📄 EnumerableMap.sol
│       │       │   │   │   ├── 📄 EnumerableSet.sol
│       │       │   │   │   ├── 📄 Heap.sol
│       │       │   │   │   └── 📄 MerkleTree.sol
│       │       │   │   ├── 📁 types
│       │       │   │   │   └── 📄 Time.sol
│       │       │   │   ├── 📄 Address.sol
│       │       │   │   ├── 📄 Arrays.sol
│       │       │   │   ├── 📄 Base64.sol
│       │       │   │   ├── 📄 Bytes.sol
│       │       │   │   ├── 📄 CAIP10.sol
│       │       │   │   ├── 📄 CAIP2.sol
│       │       │   │   ├── 📄 Comparators.sol
│       │       │   │   ├── 📄 Context.sol
│       │       │   │   ├── 📄 Create2.sol
│       │       │   │   ├── 📄 Errors.sol
│       │       │   │   ├── 📄 Multicall.sol
│       │       │   │   ├── 📄 Nonces.sol
│       │       │   │   ├── 📄 NoncesKeyed.sol
│       │       │   │   ├── 📄 Packing.sol
│       │       │   │   ├── 📄 Panic.sol
│       │       │   │   ├── 📄 Pausable.sol
│       │       │   │   ├── 📄 README.adoc
│       │       │   │   ├── 📄 ReentrancyGuard.sol
│       │       │   │   ├── 📄 ReentrancyGuardTransient.sol
│       │       │   │   ├── 📄 ShortStrings.sol
│       │       │   │   ├── 📄 SlotDerivation.sol
│       │       │   │   ├── 📄 StorageSlot.sol
│       │       │   │   ├── 📄 Strings.sol
│       │       │   │   └── 📄 TransientSlot.sol
│       │       │   ├── 📁 vendor
│       │       │   │   └── 📁 compound
│       │       │   │       ├── 📄 ICompoundTimelock.sol
│       │       │   │       └── 📄 LICENSE
│       │       │   └── 📄 package.json
│       │       ├── 📁 docs
│       │       │   ├── 📁 modules
│       │       │   │   └── 📁 ROOT
│       │       │   │       ├── 📁 images
│       │       │   │       │   ├── 📄 access-control-multiple.svg
│       │       │   │       │   ├── 📄 access-manager-functions.svg
│       │       │   │       │   ├── 📄 access-manager.svg
│       │       │   │       │   ├── 📄 erc4626-attack-3a.png
│       │       │   │       │   ├── 📄 erc4626-attack-3b.png
│       │       │   │       │   ├── 📄 erc4626-attack-6.png
│       │       │   │       │   ├── 📄 erc4626-attack.png
│       │       │   │       │   ├── 📄 erc4626-deposit.png
│       │       │   │       │   ├── 📄 erc4626-mint.png
│       │       │   │       │   ├── 📄 erc4626-rate-linear.png
│       │       │   │       │   ├── 📄 erc4626-rate-loglog.png
│       │       │   │       │   ├── 📄 erc4626-rate-loglogext.png
│       │       │   │       │   ├── 📄 tally-exec.png
│       │       │   │       │   └── 📄 tally-vote.png
│       │       │   │       ├── 📁 pages
│       │       │   │       │   ├── 📄 access-control.adoc
│       │       │   │       │   ├── 📄 backwards-compatibility.adoc
│       │       │   │       │   ├── 📄 crowdsales.adoc
│       │       │   │       │   ├── 📄 drafts.adoc
│       │       │   │       │   ├── 📄 erc1155.adoc
│       │       │   │       │   ├── 📄 erc20-supply.adoc
│       │       │   │       │   ├── 📄 erc20.adoc
│       │       │   │       │   ├── 📄 erc4626.adoc
│       │       │   │       │   ├── 📄 erc721.adoc
│       │       │   │       │   ├── 📄 extending-contracts.adoc
│       │       │   │       │   ├── 📄 faq.adoc
│       │       │   │       │   ├── 📄 governance.adoc
│       │       │   │       │   ├── 📄 index.adoc
│       │       │   │       │   ├── 📄 tokens.adoc
│       │       │   │       │   ├── 📄 upgradeable.adoc
│       │       │   │       │   ├── 📄 utilities.adoc
│       │       │   │       │   └── 📄 wizard.adoc
│       │       │   │       └── 📄 nav.adoc
│       │       │   ├── 📁 templates
│       │       │   │   ├── 📄 contract.hbs
│       │       │   │   ├── 📄 helpers.js
│       │       │   │   ├── 📄 page.hbs
│       │       │   │   └── 📄 properties.js
│       │       │   ├── 📄 antora.yml
│       │       │   ├── 📄 config.js
│       │       │   └── 📄 README.md
│       │       ├── 📁 hardhat
│       │       │   ├── 📄 async-test-sanity.js
│       │       │   ├── 📄 env-artifacts.js
│       │       │   ├── 📄 ignore-unreachable-warnings.js
│       │       │   ├── 📄 remappings.js
│       │       │   ├── 📄 skip-foundry-tests.js
│       │       │   └── 📄 task-test-get-files.js
│       │       ├── 📁 lib
│       │       │   ├── 📁 erc4626-tests
│       │       │   │   ├── 📄 ERC4626.prop.sol
│       │       │   │   ├── 📄 ERC4626.test.sol
│       │       │   │   ├── 📄 LICENSE
│       │       │   │   └── 📄 README.md
│       │       │   ├── 📁 forge-std
│       │       │   │   ├── 📁 .github
│       │       │   │   │   └── 📁 workflows
│       │       │   │   │       ├── 📄 ci.yml
│       │       │   │   │       └── 📄 sync.yml
│       │       │   │   ├── 📁 scripts
│       │       │   │   │   └── 📄 vm.py
│       │       │   │   ├── 📁 src
│       │       │   │   │   ├── 📁 interfaces
│       │       │   │   │   │   ├── 📄 IERC1155.sol
│       │       │   │   │   │   ├── 📄 IERC165.sol
│       │       │   │   │   │   ├── 📄 IERC20.sol
│       │       │   │   │   │   ├── 📄 IERC4626.sol
│       │       │   │   │   │   ├── 📄 IERC721.sol
│       │       │   │   │   │   └── 📄 IMulticall3.sol
│       │       │   │   │   ├── 📁 mocks
│       │       │   │   │   │   ├── 📄 MockERC20.sol
│       │       │   │   │   │   └── 📄 MockERC721.sol
│       │       │   │   │   ├── 📄 Base.sol
│       │       │   │   │   ├── 📄 console.sol
│       │       │   │   │   ├── 📄 console2.sol
│       │       │   │   │   ├── 📄 safeconsole.sol
│       │       │   │   │   ├── 📄 Script.sol
│       │       │   │   │   ├── 📄 StdAssertions.sol
│       │       │   │   │   ├── 📄 StdChains.sol
│       │       │   │   │   ├── 📄 StdCheats.sol
│       │       │   │   │   ├── 📄 StdError.sol
│       │       │   │   │   ├── 📄 StdInvariant.sol
│       │       │   │   │   ├── 📄 StdJson.sol
│       │       │   │   │   ├── 📄 StdMath.sol
│       │       │   │   │   ├── 📄 StdStorage.sol
│       │       │   │   │   ├── 📄 StdStyle.sol
│       │       │   │   │   ├── 📄 StdToml.sol
│       │       │   │   │   ├── 📄 StdUtils.sol
│       │       │   │   │   ├── 📄 Test.sol
│       │       │   │   │   └── 📄 Vm.sol
│       │       │   │   ├── 📁 test
│       │       │   │   │   ├── 📁 compilation
│       │       │   │   │   │   ├── 📄 CompilationScript.sol
│       │       │   │   │   │   ├── 📄 CompilationScriptBase.sol
│       │       │   │   │   │   ├── 📄 CompilationTest.sol
│       │       │   │   │   │   └── 📄 CompilationTestBase.sol
│       │       │   │   │   ├── 📁 fixtures
│       │       │   │   │   │   ├── 📄 broadcast.log.json
│       │       │   │   │   │   ├── 📄 test.json
│       │       │   │   │   │   └── 📄 test.toml
│       │       │   │   │   ├── 📁 mocks
│       │       │   │   │   │   ├── 📄 MockERC20.t.sol
│       │       │   │   │   │   └── 📄 MockERC721.t.sol
│       │       │   │   │   ├── 📄 StdAssertions.t.sol
│       │       │   │   │   ├── 📄 StdChains.t.sol
│       │       │   │   │   ├── 📄 StdCheats.t.sol
│       │       │   │   │   ├── 📄 StdError.t.sol
│       │       │   │   │   ├── 📄 StdJson.t.sol
│       │       │   │   │   ├── 📄 StdMath.t.sol
│       │       │   │   │   ├── 📄 StdStorage.t.sol
│       │       │   │   │   ├── 📄 StdStyle.t.sol
│       │       │   │   │   ├── 📄 StdToml.t.sol
│       │       │   │   │   ├── 📄 StdUtils.t.sol
│       │       │   │   │   └── 📄 Vm.t.sol
│       │       │   │   ├── 📄 .gitattributes
│       │       │   │   ├── 📄 .gitignore
│       │       │   │   ├── 📄 foundry.toml
│       │       │   │   ├── 📄 LICENSE-APACHE
│       │       │   │   ├── 📄 LICENSE-MIT
│       │       │   │   ├── 📄 package.json
│       │       │   │   └── 📄 README.md
│       │       │   └── 📁 halmos-cheatcodes
│       │       │       ├── 📁 src
│       │       │       │   ├── 📄 SVM.sol
│       │       │       │   └── 📄 SymTest.sol
│       │       │       ├── 📄 LICENSE
│       │       │       └── 📄 README.md
│       │       ├── 📁 scripts
│       │       │   ├── 📁 checks
│       │       │   │   ├── 📄 compare-layout.js
│       │       │   │   ├── 📄 compareGasReports.js
│       │       │   │   ├── 📄 coverage.sh
│       │       │   │   ├── 📄 extract-layout.js
│       │       │   │   ├── 📄 generation.sh
│       │       │   │   ├── 📄 inheritance-ordering.js
│       │       │   │   └── 📄 pragma-consistency.js
│       │       │   ├── 📁 generate
│       │       │   │   ├── 📁 helpers
│       │       │   │   │   └── 📄 sanitize.js
│       │       │   │   ├── 📁 templates
│       │       │   │   │   ├── 📄 Arrays.js
│       │       │   │   │   ├── 📄 Arrays.opts.js
│       │       │   │   │   ├── 📄 Checkpoints.js
│       │       │   │   │   ├── 📄 Checkpoints.opts.js
│       │       │   │   │   ├── 📄 Checkpoints.t.js
│       │       │   │   │   ├── 📄 conversion.js
│       │       │   │   │   ├── 📄 EnumerableMap.js
│       │       │   │   │   ├── 📄 EnumerableMap.opts.js
│       │       │   │   │   ├── 📄 EnumerableSet.js
│       │       │   │   │   ├── 📄 EnumerableSet.opts.js
│       │       │   │   │   ├── 📄 MerkleProof.js
│       │       │   │   │   ├── 📄 MerkleProof.opts.js
│       │       │   │   │   ├── 📄 Packing.js
│       │       │   │   │   ├── 📄 Packing.opts.js
│       │       │   │   │   ├── 📄 Packing.t.js
│       │       │   │   │   ├── 📄 SafeCast.js
│       │       │   │   │   ├── 📄 Slot.opts.js
│       │       │   │   │   ├── 📄 SlotDerivation.js
│       │       │   │   │   ├── 📄 SlotDerivation.t.js
│       │       │   │   │   ├── 📄 StorageSlot.js
│       │       │   │   │   ├── 📄 StorageSlotMock.js
│       │       │   │   │   ├── 📄 TransientSlot.js
│       │       │   │   │   └── 📄 TransientSlotMock.js
│       │       │   │   ├── 📄 format-lines.js
│       │       │   │   └── 📄 run.js
│       │       │   ├── 📁 release
│       │       │   │   ├── 📁 workflow
│       │       │   │   │   ├── 📄 exit-prerelease.sh
│       │       │   │   │   ├── 📄 github-release.js
│       │       │   │   │   ├── 📄 integrity-check.sh
│       │       │   │   │   ├── 📄 pack.sh
│       │       │   │   │   ├── 📄 publish.sh
│       │       │   │   │   ├── 📄 rerun.js
│       │       │   │   │   ├── 📄 set-changesets-pr-title.js
│       │       │   │   │   ├── 📄 start.sh
│       │       │   │   │   └── 📄 state.js
│       │       │   │   ├── 📄 format-changelog.js
│       │       │   │   ├── 📄 synchronize-versions.js
│       │       │   │   ├── 📄 update-comment.js
│       │       │   │   └── 📄 version.sh
│       │       │   ├── 📁 solhint-custom
│       │       │   │   ├── 📄 index.js
│       │       │   │   └── 📄 package.json
│       │       │   ├── 📁 upgradeable
│       │       │   │   ├── 📄 patch-apply.sh
│       │       │   │   ├── 📄 patch-save.sh
│       │       │   │   ├── 📄 README.md
│       │       │   │   ├── 📄 transpile-onto.sh
│       │       │   │   ├── 📄 transpile.sh
│       │       │   │   └── 📄 upgradeable.patch
│       │       │   ├── 📄 gen-nav.js
│       │       │   ├── 📄 git-user-config.sh
│       │       │   ├── 📄 helpers.js
│       │       │   ├── 📄 prepack.sh
│       │       │   ├── 📄 prepare-docs.sh
│       │       │   ├── 📄 prepare.sh
│       │       │   ├── 📄 remove-ignored-artifacts.js
│       │       │   └── 📄 update-docs-branch.js
│       │       ├── 📁 test
│       │       │   ├── 📁 access
│       │       │   │   ├── 📁 extensions
│       │       │   │   │   ├── 📄 AccessControlDefaultAdminRules.test.js
│       │       │   │   │   └── 📄 AccessControlEnumerable.test.js
│       │       │   │   ├── 📁 manager
│       │       │   │   │   ├── 📄 AccessManaged.test.js
│       │       │   │   │   ├── 📄 AccessManager.behavior.js
│       │       │   │   │   ├── 📄 AccessManager.predicate.js
│       │       │   │   │   ├── 📄 AccessManager.test.js
│       │       │   │   │   └── 📄 AuthorityUtils.test.js
│       │       │   │   ├── 📄 AccessControl.behavior.js
│       │       │   │   ├── 📄 AccessControl.test.js
│       │       │   │   ├── 📄 Ownable.test.js
│       │       │   │   └── 📄 Ownable2Step.test.js
│       │       │   ├── 📁 account
│       │       │   │   └── 📁 utils
│       │       │   │       ├── 📄 draft-ERC4337Utils.test.js
│       │       │   │       ├── 📄 draft-ERC7579Utils.t.sol
│       │       │   │       └── 📄 draft-ERC7579Utils.test.js
│       │       │   ├── 📁 bin
│       │       │   │   ├── 📄 EntryPoint070.abi
│       │       │   │   ├── 📄 EntryPoint070.bytecode
│       │       │   │   ├── 📄 SenderCreator070.abi
│       │       │   │   └── 📄 SenderCreator070.bytecode
│       │       │   ├── 📁 finance
│       │       │   │   ├── 📄 VestingWallet.behavior.js
│       │       │   │   ├── 📄 VestingWallet.test.js
│       │       │   │   └── 📄 VestingWalletCliff.test.js
│       │       │   ├── 📁 governance
│       │       │   │   ├── 📁 extensions
│       │       │   │   │   ├── 📄 GovernorCountingFractional.test.js
│       │       │   │   │   ├── 📄 GovernorCountingOverridable.test.js
│       │       │   │   │   ├── 📄 GovernorERC721.test.js
│       │       │   │   │   ├── 📄 GovernorPreventLateQuorum.test.js
│       │       │   │   │   ├── 📄 GovernorStorage.test.js
│       │       │   │   │   ├── 📄 GovernorTimelockAccess.test.js
│       │       │   │   │   ├── 📄 GovernorTimelockCompound.test.js
│       │       │   │   │   ├── 📄 GovernorTimelockControl.test.js
│       │       │   │   │   ├── 📄 GovernorVotesQuorumFraction.test.js
│       │       │   │   │   └── 📄 GovernorWithParams.test.js
│       │       │   │   ├── 📁 utils
│       │       │   │   │   ├── 📄 ERC6372.behavior.js
│       │       │   │   │   ├── 📄 Votes.behavior.js
│       │       │   │   │   ├── 📄 Votes.test.js
│       │       │   │   │   └── 📄 VotesExtended.test.js
│       │       │   │   ├── 📄 Governor.t.sol
│       │       │   │   ├── 📄 Governor.test.js
│       │       │   │   └── 📄 TimelockController.test.js
│       │       │   ├── 📁 helpers
│       │       │   │   ├── 📄 access-manager.js
│       │       │   │   ├── 📄 account.js
│       │       │   │   ├── 📄 chains.js
│       │       │   │   ├── 📄 constants.js
│       │       │   │   ├── 📄 deploy.js
│       │       │   │   ├── 📄 eip712-types.js
│       │       │   │   ├── 📄 eip712.js
│       │       │   │   ├── 📄 enums.js
│       │       │   │   ├── 📄 erc4337-entrypoint.js
│       │       │   │   ├── 📄 erc4337.js
│       │       │   │   ├── 📄 erc7579.js
│       │       │   │   ├── 📄 governance.js
│       │       │   │   ├── 📄 iterate.js
│       │       │   │   ├── 📄 math.js
│       │       │   │   ├── 📄 methods.js
│       │       │   │   ├── 📄 random.js
│       │       │   │   ├── 📄 storage.js
│       │       │   │   ├── 📄 strings.js
│       │       │   │   ├── 📄 time.js
│       │       │   │   └── 📄 txpool.js
│       │       │   ├── 📁 metatx
│       │       │   │   ├── 📄 ERC2771Context.test.js
│       │       │   │   ├── 📄 ERC2771Forwarder.t.sol
│       │       │   │   └── 📄 ERC2771Forwarder.test.js
│       │       │   ├── 📁 proxy
│       │       │   │   ├── 📁 beacon
│       │       │   │   │   ├── 📄 BeaconProxy.test.js
│       │       │   │   │   └── 📄 UpgradeableBeacon.test.js
│       │       │   │   ├── 📁 ERC1967
│       │       │   │   │   ├── 📄 ERC1967Proxy.test.js
│       │       │   │   │   └── 📄 ERC1967Utils.test.js
│       │       │   │   ├── 📁 transparent
│       │       │   │   │   ├── 📄 ProxyAdmin.test.js
│       │       │   │   │   ├── 📄 TransparentUpgradeableProxy.behaviour.js
│       │       │   │   │   └── 📄 TransparentUpgradeableProxy.test.js
│       │       │   │   ├── 📁 utils
│       │       │   │   │   ├── 📄 Initializable.test.js
│       │       │   │   │   └── 📄 UUPSUpgradeable.test.js
│       │       │   │   ├── 📄 Clones.behaviour.js
│       │       │   │   ├── 📄 Clones.t.sol
│       │       │   │   ├── 📄 Clones.test.js
│       │       │   │   └── 📄 Proxy.behaviour.js
│       │       │   ├── 📁 token
│       │       │   │   ├── 📁 common
│       │       │   │   │   └── 📄 ERC2981.behavior.js
│       │       │   │   ├── 📁 ERC1155
│       │       │   │   │   ├── 📁 extensions
│       │       │   │   │   │   ├── 📄 ERC1155Burnable.test.js
│       │       │   │   │   │   ├── 📄 ERC1155Pausable.test.js
│       │       │   │   │   │   ├── 📄 ERC1155Supply.test.js
│       │       │   │   │   │   └── 📄 ERC1155URIStorage.test.js
│       │       │   │   │   ├── 📁 utils
│       │       │   │   │   │   ├── 📄 ERC1155Holder.test.js
│       │       │   │   │   │   └── 📄 ERC1155Utils.test.js
│       │       │   │   │   ├── 📄 ERC1155.behavior.js
│       │       │   │   │   └── 📄 ERC1155.test.js
│       │       │   │   ├── 📁 ERC20
│       │       │   │   │   ├── 📁 extensions
│       │       │   │   │   │   ├── 📄 draft-ERC20TemporaryApproval.test.js
│       │       │   │   │   │   ├── 📄 ERC1363.test.js
│       │       │   │   │   │   ├── 📄 ERC20Burnable.test.js
│       │       │   │   │   │   ├── 📄 ERC20Capped.test.js
│       │       │   │   │   │   ├── 📄 ERC20FlashMint.test.js
│       │       │   │   │   │   ├── 📄 ERC20Pausable.test.js
│       │       │   │   │   │   ├── 📄 ERC20Permit.test.js
│       │       │   │   │   │   ├── 📄 ERC20Votes.test.js
│       │       │   │   │   │   ├── 📄 ERC20Wrapper.test.js
│       │       │   │   │   │   ├── 📄 ERC4626.t.sol
│       │       │   │   │   │   └── 📄 ERC4626.test.js
│       │       │   │   │   ├── 📁 utils
│       │       │   │   │   │   └── 📄 SafeERC20.test.js
│       │       │   │   │   ├── 📄 ERC20.behavior.js
│       │       │   │   │   └── 📄 ERC20.test.js
│       │       │   │   └── 📁 ERC721
│       │       │   │       ├── 📁 extensions
│       │       │   │       │   ├── 📄 ERC721Burnable.test.js
│       │       │   │       │   ├── 📄 ERC721Consecutive.t.sol
│       │       │   │       │   ├── 📄 ERC721Consecutive.test.js
│       │       │   │       │   ├── 📄 ERC721Pausable.test.js
│       │       │   │       │   ├── 📄 ERC721Royalty.test.js
│       │       │   │       │   ├── 📄 ERC721URIStorage.test.js
│       │       │   │       │   ├── 📄 ERC721Votes.test.js
│       │       │   │       │   └── 📄 ERC721Wrapper.test.js
│       │       │   │       ├── 📁 utils
│       │       │   │       │   ├── 📄 ERC721Holder.test.js
│       │       │   │       │   └── 📄 ERC721Utils.test.js
│       │       │   │       ├── 📄 ERC721.behavior.js
│       │       │   │       ├── 📄 ERC721.test.js
│       │       │   │       └── 📄 ERC721Enumerable.test.js
│       │       │   ├── 📁 utils
│       │       │   │   ├── 📁 cryptography
│       │       │   │   │   ├── 📄 ecdsa_secp256r1_sha256_p1363_test.json
│       │       │   │   │   ├── 📄 ECDSA.test.js
│       │       │   │   │   ├── 📄 EIP712.test.js
│       │       │   │   │   ├── 📄 MerkleProof.test.js
│       │       │   │   │   ├── 📄 MessageHashUtils.test.js
│       │       │   │   │   ├── 📄 P256.t.sol
│       │       │   │   │   ├── 📄 P256.test.js
│       │       │   │   │   ├── 📄 RSA.helper.js
│       │       │   │   │   ├── 📄 RSA.test.js
│       │       │   │   │   ├── 📄 SignatureChecker.test.js
│       │       │   │   │   └── 📄 SigVer15_186-3.rsp
│       │       │   │   ├── 📁 introspection
│       │       │   │   │   ├── 📄 ERC165.test.js
│       │       │   │   │   ├── 📄 ERC165Checker.test.js
│       │       │   │   │   └── 📄 SupportsInterface.behavior.js
│       │       │   │   ├── 📁 math
│       │       │   │   │   ├── 📄 Math.t.sol
│       │       │   │   │   ├── 📄 Math.test.js
│       │       │   │   │   ├── 📄 SafeCast.test.js
│       │       │   │   │   ├── 📄 SignedMath.t.sol
│       │       │   │   │   └── 📄 SignedMath.test.js
│       │       │   │   ├── 📁 structs
│       │       │   │   │   ├── 📄 BitMap.test.js
│       │       │   │   │   ├── 📄 Checkpoints.t.sol
│       │       │   │   │   ├── 📄 Checkpoints.test.js
│       │       │   │   │   ├── 📄 CircularBuffer.test.js
│       │       │   │   │   ├── 📄 DoubleEndedQueue.test.js
│       │       │   │   │   ├── 📄 EnumerableMap.behavior.js
│       │       │   │   │   ├── 📄 EnumerableMap.test.js
│       │       │   │   │   ├── 📄 EnumerableSet.behavior.js
│       │       │   │   │   ├── 📄 EnumerableSet.test.js
│       │       │   │   │   ├── 📄 Heap.t.sol
│       │       │   │   │   ├── 📄 Heap.test.js
│       │       │   │   │   └── 📄 MerkleTree.test.js
│       │       │   │   ├── 📁 types
│       │       │   │   │   └── 📄 Time.test.js
│       │       │   │   ├── 📄 Address.test.js
│       │       │   │   ├── 📄 Arrays.t.sol
│       │       │   │   ├── 📄 Arrays.test.js
│       │       │   │   ├── 📄 Base64.t.sol
│       │       │   │   ├── 📄 Base64.test.js
│       │       │   │   ├── 📄 Bytes.test.js
│       │       │   │   ├── 📄 CAIP.test.js
│       │       │   │   ├── 📄 Context.behavior.js
│       │       │   │   ├── 📄 Context.test.js
│       │       │   │   ├── 📄 Create2.t.sol
│       │       │   │   ├── 📄 Create2.test.js
│       │       │   │   ├── 📄 Multicall.test.js
│       │       │   │   ├── 📄 Nonces.behavior.js
│       │       │   │   ├── 📄 Nonces.test.js
│       │       │   │   ├── 📄 NoncesKeyed.test.js
│       │       │   │   ├── 📄 Packing.t.sol
│       │       │   │   ├── 📄 Packing.test.js
│       │       │   │   ├── 📄 Panic.test.js
│       │       │   │   ├── 📄 Pausable.test.js
│       │       │   │   ├── 📄 ReentrancyGuard.test.js
│       │       │   │   ├── 📄 ShortStrings.t.sol
│       │       │   │   ├── 📄 ShortStrings.test.js
│       │       │   │   ├── 📄 SlotDerivation.t.sol
│       │       │   │   ├── 📄 SlotDerivation.test.js
│       │       │   │   ├── 📄 StorageSlot.test.js
│       │       │   │   ├── 📄 Strings.t.sol
│       │       │   │   ├── 📄 Strings.test.js
│       │       │   │   └── 📄 TransientSlot.test.js
│       │       │   ├── 📄 sanity.test.js
│       │       │   └── 📄 TESTING.md
│       │       ├── 📄 .codecov.yml
│       │       ├── 📄 .editorconfig
│       │       ├── 📄 .gitignore
│       │       ├── 📄 .gitmodules
│       │       ├── 📄 .mocharc.js
│       │       ├── 📄 .prettierrc
│       │       ├── 📄 .solcover.js
│       │       ├── 📄 CHANGELOG.md
│       │       ├── 📄 CODE_OF_CONDUCT.md
│       │       ├── 📄 CONTRIBUTING.md
│       │       ├── 📄 eslint.config.mjs
│       │       ├── 📄 foundry.toml
│       │       ├── 📄 FUNDING.json
│       │       ├── 📄 fv-requirements.txt
│       │       ├── 📄 GUIDELINES.md
│       │       ├── 📄 hardhat.config.js
│       │       ├── 📄 LICENSE
│       │       ├── 📄 logo.svg
│       │       ├── 📄 netlify.toml
│       │       ├── 📄 package-lock.json
│       │       ├── 📄 package.json
│       │       ├── 📄 README.md
│       │       ├── 📄 RELEASING.md
│       │       ├── 📄 remappings.txt
│       │       ├── 📄 renovate.json
│       │       ├── 📄 SECURITY.md
│       │       ├── 📄 slither.config.json
│       │       └── 📄 solhint.config.js
│       ├── 📁 script
│       │   └── 📄 DeployEscrow.s.sol
│       ├── 📁 scripts
│       │   ├── 📄 canonical-abi.json
│       │   ├── 📄 deploy-onchain.js
│       │   ├── 📄 export-abi.js
│       │   └── 📄 export-artifacts.js
│       ├── 📁 src
│       │   ├── 📁 base
│       │   │   ├── 📄 EscrowAccessControl.sol
│       │   │   ├── 📄 EscrowStateMachine.sol
│       │   │   └── 📄 PaymentProcessor.sol
│       │   ├── 📁 interfaces
│       │   │   ├── 📄 IDigitalEscrow.sol
│       │   │   └── 📄 IERC20Minimal.sol
│       │   ├── 📁 mocks
│       │   │   └── 📄 MockUSDC.sol
│       │   ├── 📁 types
│       │   │   └── 📄 EscrowTypes.sol
│       │   └── 📄 DigitalEscrow.sol
│       ├── 📁 test
│       │   ├── 📁 components
│       │   │   ├── 📄 DigitalEscrowHappyPath.t.sol
│       │   │   ├── 📄 DigitalEscrowInputValidation.t.sol
│       │   │   ├── 📄 DigitalEscrowSecurity.t.sol
│       │   │   ├── 📄 DigitalEscrowStateMatrix.t.sol
│       │   │   ├── 📄 DigitalEscrowStateMatrixActive.t.sol
│       │   │   ├── 📄 DigitalEscrowStateMatrixTerminal.t.sol
│       │   │   └── 📄 DigitalEscrowTimeout.t.sol
│       │   ├── 📁 helpers
│       │   │   └── 📄 EscrowTestBase.sol
│       │   └── 📄 DigitalEscrow.t.sol
│       ├── 📄 .env.example
│       ├── 📄 .gitignore
│       ├── 📄 @openzeppelin_contracts_utils_ReentrancyGuard_sol_ReentrancyGuard.bin
│       ├── 📄 @openzeppelin_contracts_utils_StorageSlot_sol_StorageSlot.bin
│       ├── 📄 foundry.toml
│       ├── 📄 package-lock.json
│       ├── 📄 package.json
│       ├── 📄 remappings.txt
│       ├── 📄 src_base_EscrowAccessControl_sol_EscrowAccessControl.bin
│       ├── 📄 src_base_EscrowStateMachine_sol_EscrowStateMachine.bin
│       ├── 📄 src_base_PaymentProcessor_sol_PaymentProcessor.bin
│       ├── 📄 src_DigitalEscrow_sol_DigitalEscrow.bin
│       ├── 📄 src_interfaces_IDigitalEscrow_sol_IDigitalEscrow.bin
│       ├── 📄 src_interfaces_IERC20Minimal_sol_IERC20Minimal.bin
│       ├── 📄 src_mocks_MockUSDC_sol_MockUSDC.bin
│       └── 📄 src_types_EscrowTypes_sol_EscrowTypes.bin
├── 📁 scripts
│   ├── 📄 apply-ddl.js
│   ├── 📄 audit-secrets.sh
│   ├── 📄 check-relayer-gas.ts
│   ├── 📄 draw-structure.js
│   ├── 📄 dump-secrets.sh
│   ├── 📄 load-cloud-secrets.sh
│   ├── 📄 monitor-oracle-balance.ts
│   ├── 📄 quality-gate-check.ts
│   ├── 📄 run-mb.js
│   └── 📄 setup-db.sh
├── 📁 tests
│   └── 📁 e2e
│       ├── 📁 fixtures
│       │   ├── 📄 mock-payos-webhook.ts
│       │   ├── 📄 sample-assets.ts
│       │   └── 📄 test-wallets.ts
│       ├── 📁 helpers
│       │   ├── 📄 contract-helper.ts
│       │   ├── 📄 crypto-helper.ts
│       │   └── 📄 db-helper.ts
│       ├── 📁 specs
│       │   ├── 📄 01-happy-path.spec.ts
│       │   ├── 📄 02-dispute-flow.spec.ts
│       │   ├── 📄 03-realtime-concurrency.spec.ts
│       │   └── 📄 04-system-health.spec.ts
│       ├── 📄 jest.config.ts
│       ├── 📄 package.json
│       └── 📄 tsconfig.json
├── 📄 .dockerignore
├── 📄 .env
├── 📄 .gitignore
├── 📄 .gitmodules
├── 📄 .npmrc
├── 📄 analysis_options.yaml
├── 📄 DEPLOYMENT_ENV_MATRIX.md
├── 📄 package-lock.json
├── 📄 package.json
├── 📄 README
├── 📄 render.yaml
├── 📄 STRUCTURE.md
└── 📄 tsconfig.base.json
```
