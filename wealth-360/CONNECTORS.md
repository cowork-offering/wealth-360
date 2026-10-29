# Connectors

Wealth 360 uses two claude.ai custom connectors. Each viewer adds them in claude.ai under Settings > Connectors, with the exact names below. They are user-level connectors, never bundled in the plugin, so every person signs in to Salesforce as themselves.

## Wealth 360 (required)

The bank's own servicing data plane: the desk's queue, case detail, rulebook and daily summary, the agents' case context, deterministic checks and step writes, and the person-only staged decisions, all run as the signed-in person.

- URL: `https://api.salesforce.com/platform/mcp/v1/d/accenture-d8--bankinggpt/sandbox/custom/Wealth360`
- Auth: OAuth 2.0 with PKCE, the bank's External Client App consumer key as the client id, per viewer
- Tools: 17

Setup: In claude.ai, Settings > Connectors > Add custom connector. Name it exactly "Wealth 360" and point it at the bank's Wealth 360 MCP URL (BankingGPT sandbox: https://api.salesforce.com/platform/mcp/v1/d/accenture-d8--bankinggpt/sandbox/custom/Wealth360). Open Advanced settings and set OAuth Client ID to the consumer key of the bank's External Client App (BankingGPT sandbox: the app Claude_Ai_Integration_via_MCP, consumer key 3MVG95bilXG9ExQFPfVafsYh_y5a5uSppydv6GCC.unT36dURnDmX35CZam_x3uOs5vSwQuLTDYNSTV_2iL_Y). Leave the client credential field empty: the app uses PKCE. Connect, and sign in to Salesforce as yourself.

## Wealth 360 Checks (optional)

The outside checks, run as the signed-in person: UK Sanctions List screening, payee account-holder verification (Plaid sandbox, open banking, not Pay.UK Confirmation of Payee), UK address validation (Ideal Postcodes) and identity verification sessions (Didit sandbox), plus the person's own check ledger. Sandbox providers on fictional personas. The desk page uses it too: Run a check on a case and Analyse a document call it as the person, and each result is saved on the case timeline.

- URL: `https://wealth-360-checks.vercel.app/api/mcp`
- Auth: OAuth 2.0 with PKCE against the bank's Salesforce (the server's protected-resource metadata names the Salesforce My Domain as the authorization server); the server checks every bearer token with Salesforce and records the person on every ledger row
- Tools: 5

Setup: In claude.ai, Settings > Connectors > Add custom connector. Name it exactly "Wealth 360 Checks" and set the URL to https://wealth-360-checks.vercel.app/api/mcp. Open Advanced settings and set OAuth Client ID to the same consumer key as the "Wealth 360" connector (BankingGPT sandbox: the app Claude_Ai_Integration_via_MCP, consumer key 3MVG95bilXG9ExQFPfVafsYh_y5a5uSppydv6GCC.unT36dURnDmX35CZam_x3uOs5vSwQuLTDYNSTV_2iL_Y). Leave the client credential field empty: the app uses PKCE. Connect, and sign in to Salesforce as yourself.
