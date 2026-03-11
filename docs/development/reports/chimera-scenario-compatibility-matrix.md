# Chimera Scenario Compatibility Matrix

Generated on 2026-03-11 for backlog task TASK-28. This matrix audits the live Crucible scenario catalog against Chimera's current API surface.

## Sources

- `packages/catalog/scenarios/` — 129 scenario JSON files in Crucible.
- `../Chimera/apps/vuln-api/docs/openapi.yaml` — 527 current Chimera path entries.
- `../Chimera/docs/endpoints-catalog.md` — planning catalog that still describes a smaller 240+ endpoint subset.
- `../Chimera/docs/vulnerability-inventory.md` — vulnerability inventory describing 114+ vulnerable endpoints and 200+ flaws.

## Methodology

- `compatible`: every unique scenario request URL matches a current Chimera OpenAPI route after stripping query strings and allowing OpenAPI path parameters such as `{id}`.
- `needs-update`: the scenario is explicitly Chimera-branded, already partially matches Chimera, or only needs deterministic path rewrites such as `/api/auth/login -> /api/v1/auth/login`.
- `no-match`: the scenario targets another app family entirely, depends on non-HTTP recon/static assets, or has no direct Chimera route evidence in the current OpenAPI spec.
- Coverage counts are `matched-or-rewritten URLs / total unique scenario URLs`. Query-string-only differences are ignored because Crucible resolves them at runtime against the same route.
- High-confidence family splits come from scenario metadata, not a central registry. In particular, `chimera-*` plus most `api-demo-*` files self-identify as Chimera-oriented, while `crapi-*`, `vampi-*`, `vp-demo-*`, and the OWASP sample scenarios point at other target labs.

## Summary

- Compatible: 38
- Needs update: 52
- No match: 39

### Family Breakdown

| Family | Total | Compatible | Needs update | No match |
| --- | ---: | ---: | ---: | ---: |
| chimera-first | 33 | 17 | 16 | 0 |
| external-crapi | 5 | 0 | 2 | 3 |
| external-threatx-demo | 2 | 0 | 1 | 1 |
| external-vampi | 2 | 0 | 0 | 2 |
| external-vp-demo | 9 | 0 | 0 | 9 |
| generic | 78 | 21 | 33 | 24 |

## Scenario Matrix

| Scenario | File | Family | Target | Status | Coverage | Key update notes |
| --- | --- | --- | --- | --- | ---: | --- |
| Advanced Persistent Threat (APT) | advanced-persistent-threat.json | generic | (default target) | needs-update | 6/18 | review remaining /robots.txt, /api/directory/public, /api/dependencies/scan |
| Advanced SQL Injection Campaign | advanced-sqli-campaign.json | generic | (default target) | needs-update | 1/5 | rewrite /api/login -> /api/v1/auth/login; review remaining /user/profile, /search, /products |
| Sensitive Data Leaking from LLM Context | ai-llm-data-leak.json | generic | (default target) | compatible | 2/2 | all scenario URLs match current Chimera OpenAPI routes |
| Indirect Prompt Injection via Document | ai-llm-indirect-injection.json | generic | (default target) | compatible | 2/2 | all scenario URLs match current Chimera OpenAPI routes |
| Direct Prompt Injection Attack | ai-llm-prompt-injection.json | generic | (default target) | compatible | 1/1 | all scenario URLs match current Chimera OpenAPI routes |
| Chimera Version & Endpoint Discovery | api-demo-api-versioning.json | chimera-first | (default target) | needs-update | 1/10 | review remaining /api/v1/version, /api/v2/version, /api/v0/admin/users |
| Advanced Persistent Threat Multi-Stage Campaign | api-demo-apt-campaign.json | chimera-first | (default target) | compatible | 15/15 | all scenario URLs match current Chimera OpenAPI routes |
| Chimera Authentication Attack Chain | api-demo-auth-attacks.json | chimera-first | (default target) | compatible | 10/10 | all scenario URLs match current Chimera OpenAPI routes |
| Botnet Console Showcase - Distributed Attack Simulation | api-demo-botnet-showcase.json | external-threatx-demo | (default target) | needs-update | 1/4 | rewrite /api/auth/login -> /api/v1/auth/login; review remaining /api/bot/detection-test, /api/attack/credential-stuffing, /api/attack/account-takeover |
| Chimera Business Logic Exploitation | api-demo-business-logic.json | chimera-first | (default target) | needs-update | 4/7 | review remaining /api/v1/ecommerce/ratings/bulk, /api/v1/ecommerce/vendors/privileges/escalate, /api/v1/ecommerce/vendors/inventory/sabotage |
| Chimera CORS & CSP Bypass Techniques | api-demo-cors-csp-bypass.json | chimera-first | (default target) | needs-update | 3/10 | rewrite /api/users/profile -> /api/v1/users/profile; review remaining /api/v1/auth/session, /api/data/sensitive, /api/jsonp/data?callback=alert |
| Chimera Cryptographic & Advanced Attacks | api-demo-crypto-advanced.json | chimera-first | (default target) | needs-update | 2/12 | rewrite /api/user/profile/nonexistent.css -> /api/v1/users/profile; review remaining /api/secure/data, /api/decrypt, /api/verify-signature |
| Chimera Data Exfiltration Techniques | api-demo-data-exfiltration.json | chimera-first | (default target) | needs-update | 3/12 | rewrite /api/users/profile?expand=*&include=hidden,internal,private -> /api/v1/users/profile; review remaining /api/swagger.json, /api/graphql, /api/users/export?limit=999999&fields=* |
| API Defender Showcase - Advanced API Protection | api-demo-defender-showcase.json | external-threatx-demo | (default target) | no-match | 0/5 | no direct Chimera route for /api/security/anomaly-detection, /api/admin/api-defender/stats, /api/security/rate-limit-test |
| Chimera E-commerce Browsing Session | api-demo-ecommerce-browsing.json | chimera-first | (default target) | compatible | 8/8 | all scenario URLs match current Chimera OpenAPI routes |
| Banking Account Takeover & Money Movement | api-demo-financial-fraud.json | chimera-first | (default target) | compatible | 11/11 | all scenario URLs match current Chimera OpenAPI routes |
| Healthcare PHI Data Breach Campaign | api-demo-healthcare-breach.json | chimera-first | (default target) | compatible | 10/10 | all scenario URLs match current Chimera OpenAPI routes |
| Industrial Control System Sabotage Campaign | api-demo-ics-ot-sabotage.json | chimera-first | (default target) | compatible | 10/10 | all scenario URLs match current Chimera OpenAPI routes |
| Chimera IDOR & Access Control Bypass | api-demo-idor-access-control.json | chimera-first | (default target) | needs-update | 4/10 | rewrite /api/users/profile/1 -> /api/v1/users/profile; rewrite /api/users/profile/{{sequential_id}} -> /api/v1/users/profile; rewrite /api/users/profile/update -> /api/v1/users/profile; review remaining /api/vendors/VENDOR-002/financial, /api/admin/users, /api/orders/550e8400-e29b-41d4-a716-446655440000 |
| Chimera Injection Attacks | api-demo-injection-attacks.json | chimera-first | (default target) | needs-update | 3/12 | review remaining /api/users/check?username=admin' AND SLEEP(5)--, /api/network/ping, /api/users/search |
| Insurance Fraud & Claims Manipulation | api-demo-insurance-fraud.json | chimera-first | (default target) | needs-update | 9/10 | review remaining /api/v1/insurance/providers/billing |
| Chimera Legitimate User Flow | api-demo-legitimate-user-flow.json | chimera-first | (default target) | compatible | 8/8 | all scenario URLs match current Chimera OpenAPI routes |
| Chimera Mixed Behavior Pattern | api-demo-mixed-behavior.json | chimera-first | (default target) | compatible | 10/10 | all scenario URLs match current Chimera OpenAPI routes |
| Chimera OWASP Top 10 Comprehensive Chain | api-demo-owasp-top10.json | chimera-first | (default target) | needs-update | 4/12 | rewrite /api/users/profile?include_sensitive=true&fields=* -> /api/v1/users/profile; rewrite /api/users/profile -> /api/v1/users/profile; review remaining /api/orders/ORD-2024-9999, /api/export/all?limit=999999999, /api/admin/users/all |
| Payment Gateway & Merchant Fraud Campaign | api-demo-payment-exploitation.json | chimera-first | (default target) | compatible | 12/12 | all scenario URLs match current Chimera OpenAPI routes |
| Chimera Rate Limiting & DoS Attacks | api-demo-rate-limiting-dos.json | chimera-first | (default target) | needs-update | 3/11 | review remaining /API/Products/SEARCH?q=test, /api/../api/products/search?q=test, /api/upload |
| Chimera Realistic Traffic Pattern | api-demo-realistic-traffic.json | chimera-first | (default target) | compatible | 12/12 | all scenario URLs match current Chimera OpenAPI routes |
| Chimera Session Hijacking & Fixation | api-demo-session-hijacking.json | chimera-first | (default target) | needs-update | 8/9 | review remaining /api/v1/auth/transfer |
| Chimera SSRF & Open Redirect Chains | api-demo-ssrf-redirect.json | chimera-first | (default target) | needs-update | 0/11 | review remaining /api/fetch/url, /api/webhook/register, /api/import/feed |
| Supply Chain Vendor Compromise Campaign | api-demo-supply-chain-attack.json | chimera-first | (default target) | needs-update | 9/12 | review remaining /api/vendors/customers/data?include_pii=true, /api/vendors/relationships/exploit, /api/vendors/software/update |
| API Endpoint Discovery | api-endpoint-discovery.json | generic | (default target) | needs-update | 1/23 | rewrite /api/login -> /api/v1/auth/login; review remaining /api, /api/v1, /api/v2 |
| API Gateway Exploitation | api-gateway-exploitation.json | generic | (default target) | needs-update | 8/15 | review remaining /api/gateway/health, /api/gateway/../../../admin/config, /api/mesh/certificates |
| GraphQL Depth & Complexity DoS | api-logic-graphql-dos.json | generic | (default target) | no-match | 0/1 | no direct Chimera route for /api/v1/genai/graphql |
| HTTP Parameter Pollution (HPP) Bypass | api-logic-hpp-bypass.json | generic | (default target) | needs-update | 2/3 | rewrite /api/user/profile?id=123 -> /api/v1/users/profile; rewrite /api/user/profile?id=123&id=456 -> /api/v1/users/profile; review remaining /api/admin/settings |
| Unicode Normalization Bypass | api-logic-unicode-normalization.json | generic | (default target) | needs-update | 1/2 | rewrite /api/auth/login -> /api/v1/auth/login; review remaining /api/files/download?path=%ef%bc%8e%ef%bc%8e%ef%bc%8fetc/passwd |
| API Rate Limiting Bypass | api-rate-limit-bypass.json | generic | (default target) | needs-update | 2/3 | rewrite /api/login -> /api/v1/auth/login; rewrite /api/auth/login -> /api/v1/auth/login; review remaining /api/users |
| API Security Audit | api-security-audit.json | generic | (default target) | no-match | 0/6 | no direct Chimera route for /api/v1/swagger.json, /graphql, /api/v1/users/me |
| API10:2023 - Unsafe Consumption of APIs | api10-unsafe-api-consumption.json | external-crapi | http://localhost:8888 | no-match | 0/7 | no direct Chimera route for /identity/api/v2/user/videos, /webhook/callback, /identity/api/v2/user/videos/convert_video |
| API4:2023 - Rate Limit Bypass & Resource Exhaustion | api4-rate-limit-bypass.json | external-vp-demo | http://localhost:5000 | no-match | 0/4 | no direct Chimera route for /createUser, /login, /users/v1?limit=${LIMIT} |
| API5:2023 - Broken Function Level Authorization | api5-function-level-authz-bypass.json | external-vp-demo | http://localhost:5000 | no-match | 0/8 | no direct Chimera route for /createUser, /login, /users/v1/_debug |
| API7:2023 - Server-Side Request Forgery (SSRF) | api7-ssrf-cloud-metadata.json | external-crapi | http://localhost:8888 | no-match | 0/1 | no direct Chimera route for /identity/api/v2/user/videos/convert_video |
| API9:2023 - Improper Inventory Management | api9-improper-inventory-management.json | external-vp-demo | http://localhost:5000 | no-match | 0/10 | no direct Chimera route for ${VERSION_PATH}, ${DOC_PATH}, /users/${VERSION} |
| APT-Style Multi-Vector Persistent Campaign | apt-multi-vector-campaign.json | generic | (default target) | needs-update | 9/10 | review remaining /api/v1/integrations/discovery |
| Basic Authentication Bypass Probes | auth-bypass-basic.json | generic | (default target) | compatible | 2/2 | all scenario URLs match current Chimera OpenAPI routes |
| Banking Account Takeover Campaign | banking-account-takeover-campaign.json | generic | (default target) | compatible | 3/3 | all scenario URLs match current Chimera OpenAPI routes |
| Basic XSS Discovery Probes | basic-xss-discovery.json | generic | (default target) | compatible | 2/2 | all scenario URLs match current Chimera OpenAPI routes |
| Complex Multi-Level BOLA Chain | bola-multi-level-chain.json | generic | (default target) | compatible | 3/3 | all scenario URLs match current Chimera OpenAPI routes |
| Business Logic Manipulation Campaign | business-logic-manipulation.json | generic | (default target) | needs-update | 4/9 | rewrite /api/user/profile/1 -> /api/v1/users/profile; rewrite /api/user/profile -> /api/v1/users/profile; review remaining /api/checkout/steps, /api/transfer/initiate, /api/order/12345/status |
| Business Logic Race Condition | business-logic-race-condition.json | generic | (default target) | compatible | 2/2 | all scenario URLs match current Chimera OpenAPI routes |
| Chimera Banking IDOR Access | chimera-banking-idor.json | chimera-first | (default target) | compatible | 3/3 | all scenario URLs match current Chimera OpenAPI routes |
| Healthcare Record IDOR Access | chimera-healthcare-record-idor.json | chimera-first | (default target) | compatible | 4/4 | all scenario URLs match current Chimera OpenAPI routes |
| Chimera JWT Token Forgery | chimera-jwt-token-forgery.json | chimera-first | (default target) | compatible | 3/3 | all scenario URLs match current Chimera OpenAPI routes |
| Negative Quantity Cart Manipulation | chimera-negative-quantity-cart.json | chimera-first | (default target) | compatible | 1/1 | all scenario URLs match current Chimera OpenAPI routes |
| Chimera Password Reset Token Prediction | chimera-password-reset-prediction.json | chimera-first | (default target) | needs-update | 2/2 | rewrite /api/v1/auth/reset-password -> /api/v1/auth/reset |
| Payment Capture Overcharge Attack | chimera-payment-capture-overcharge.json | chimera-first | (default target) | compatible | 3/3 | all scenario URLs match current Chimera OpenAPI routes |
| Privilege Escalation via Role Elevation | chimera-privilege-escalation.json | chimera-first | (default target) | needs-update | 4/5 | review remaining /api/v1/admin/audit/suspend |
| Chimera SQL Injection Authentication Bypass | chimera-sqli-auth-bypass.json | chimera-first | (default target) | compatible | 1/1 | all scenario URLs match current Chimera OpenAPI routes |
| Chimera SQL Injection Data Extraction | chimera-sqli-data-extraction.json | chimera-first | (default target) | compatible | 1/1 | all scenario URLs match current Chimera OpenAPI routes |
| SSRF Cloud Metadata and Internal Service Access | chimera-ssrf-cloud-metadata.json | chimera-first | (default target) | needs-update | 1/2 | review remaining /api/integrations/webhook/register |
| Serverless Function Environment Hijacking | cloud-native-lambda-hijack.json | generic | (default target) | no-match | 0/1 | no direct Chimera route for /api/v1/infrastructure/compute/process-image |
| Object Storage Pre-signed URL Abuse | cloud-native-s3-presigned-abuse.json | generic | (default target) | no-match | 0/1 | no direct Chimera route for /api/v1/infrastructure/storage/presign |
| IMDSv1/v2 SSRF Attack | cloud-native-ssrf-imds.json | generic | (default target) | compatible | 2/2 | all scenario URLs match current Chimera OpenAPI routes |
| Sophisticated OS Command Injection | command-injection-sophisticated.json | generic | (default target) | compatible | 1/1 | all scenario URLs match current Chimera OpenAPI routes |
| FedRAMP Non-FIPS Cipher Negotiation Probe | compliance-fedramp-cipher-negotiation.json | generic | (default target) | needs-update | 1/1 | rewrite /api/v1/health -> /api/v1/auth/status |
| FedRAMP Cross-Tenant Data Leakage Probe | compliance-fedramp-cross-tenant.json | generic | (default target) | compatible | 2/2 | all scenario URLs match current Chimera OpenAPI routes |
| GDPR Consent Preference Conflict Probe | compliance-gdpr-consent-conflict.json | generic | (default target) | no-match | 0/2 | no direct Chimera route for /api/v1/user/consent, /api/v1/marketing/send-promotion |
| HIPAA Audit Log Suppression Attempt | compliance-hipaa-audit-suppression.json | generic | (default target) | needs-update | 1/2 | review remaining /api/v1/admin/audit/suspend |
| HIPAA Emergency Access (Break Glass) Abuse | compliance-hipaa-emergency-access.json | generic | (default target) | compatible | 1/1 | all scenario URLs match current Chimera OpenAPI routes |
| HIPAA Patient Right to Access Disclosure Check | compliance-hipaa-patient-export.json | generic | (default target) | compatible | 1/1 | all scenario URLs match current Chimera OpenAPI routes |
| PCI DSS Payment Page Integrity Probe | compliance-pci-page-integrity.json | generic | (default target) | no-match | 0/2 | no direct Chimera route for /api/v1/checkout/session, /api/v1/checkout/ui-state |
| PCI DSS Insecure PAN Logging Probe | compliance-pci-pan-logging.json | generic | (default target) | compatible | 2/2 | all scenario URLs match current Chimera OpenAPI routes |
| PCI DSS CDE Segmentation Probe | compliance-pci-segmentation.json | generic | (default target) | compatible | 2/2 | all scenario URLs match current Chimera OpenAPI routes |
| SOC 2 Access Review & Credential Lifecycle Probe | compliance-soc2-access-review.json | generic | (default target) | needs-update | 1/1 | rewrite /api/v1/system/status -> /api/v1/auth/status |
| SOC 2 Unauthorized Configuration Change | compliance-soc2-config-change.json | generic | (default target) | compatible | 1/1 | all scenario URLs match current Chimera OpenAPI routes |
| SOC 2 Availability & DoS Resilience Probe | compliance-soc2-dos-resilience.json | generic | (default target) | needs-update | 1/1 | rewrite /api/v1/status -> /api/v1/auth/status |
| crAPI - Vehicle Data Enumeration (BOLA) | crapi-bola-vehicle-enumeration.json | external-crapi | http://localhost:8888 | needs-update | 1/4 | rewrite /identity/api/auth/login -> /api/v1/auth/login; review remaining /identity/api/v2/vehicle/vehicles, /identity/api/v2/vehicle/${VEHICLE_ID}, /identity/api/v2/vehicle/${VEHICLE_ID}/location |
| crAPI - JWT Secret Leak & Token Forgery | crapi-jwt-secret-leak.json | external-crapi | http://localhost:8888 | needs-update | 2/7 | rewrite /identity/api/auth/signup -> /api/v1/auth/register; rewrite /identity/api/auth/login -> /api/v1/auth/login; review remaining /identity/api/v2/user/videos, /identity/api/v2/user/videos/1, /identity/api/v2/admin/users |
| Cryptographic Weakness Exploitation Campaign | cryptographic-weakness-exploitation.json | generic | (default target) | needs-update | 1/11 | rewrite /api/auth/reset-password -> /api/v1/auth/reset; review remaining /, /api/secure-endpoint, /api/file/verify |
| CSRF Token Bypass Campaign | csrf-token-bypass.json | generic | (default target) | no-match | 0/5 | no direct Chimera route for /account/settings, /api/csrf-token, /account/change-email |
| Directory Enumeration (Python/Flask API) | directory-enumeration-python-api.json | generic | (default target) | needs-update | 1/40 | review remaining /robots.txt, /sitemap.xml, /.well-known/security.txt |
| Directory Enumeration | directory-enumeration-slow.json | generic | (default target) | no-match | 0/30 | no direct Chimera route for /robots.txt, /sitemap.xml, /.well-known/security.txt |
| Advanced Directory Traversal | directory-traversal-advanced.json | generic | (default target) | compatible | 2/2 | all scenario URLs match current Chimera OpenAPI routes |
| Distributed API Reconnaissance Swarm | distributed-api-reconnaissance-swarm.json | generic | (default target) | no-match | 0/12 | no direct Chimera route for /favicon.ico, /robots.txt, /sitemap.xml |
| Advanced DOM-Based XSS Campaign | dom-xss-advanced.json | generic | (default target) | no-match | 0/9 | no direct Chimera route for /app, /dashboard, /api/frame/message |
| Advanced E-commerce Cart Manipulation Campaign | ecommerce-advanced-cart-manipulation.json | generic | (default target) | needs-update | 12/15 | review remaining /api/pricing/rules, /api/pricing/calculate, /api/payment/methods/add |
| Checkout Process Exploitation Campaign | ecommerce-checkout-exploitation.json | generic | (default target) | needs-update | 5/15 | review remaining /api/checkout/steps, /api/checkout/payment-methods, /api/taxes/rates |
| E-commerce Loyalty Program Exploitation Campaign | ecommerce-loyalty-program-exploitation.json | generic | (default target) | compatible | 14/14 | all scenario URLs match current Chimera OpenAPI routes |
| Malicious File Upload Bypass | file-upload-bypass.json | generic | (default target) | no-match | 0/2 | no direct Chimera route for /upload, /api/upload |
| GraphQL Injection and DoS | graphql-injection.json | generic | (default target) | no-match | 0/1 | no direct Chimera route for /graphql |
| Healthcare Data Breach Campaign | healthcare-data-breach.json | generic | (default target) | needs-update | 8/14 | review remaining /api/providers/network/search, /api/providers/auth/login, /api/hipaa/records/patient |
| HTTP Request Smuggling Attack Chain | http-request-smuggling.json | generic | (default target) | needs-update | 1/8 | rewrite /api/user/profile -> /api/v1/users/profile; review remaining /, /api/data, /api/submit |
| OAuth2 PKCE Enforcement Bypass Probe | identity-oauth2-pkce-bypass.json | generic | (default target) | needs-update | 2/2 | rewrite /api/v1/oauth/authorize?client_id=public-spa&response_type=code&redirect_uri=https://app.example.com/callback&scope=openid profile -> /api/v1/auth/oauth/authorize; rewrite /api/v1/oauth/token -> /api/v1/auth/oauth/token |
| OIDC Claim Injection & Privilege Escalation | identity-oidc-claim-injection.json | generic | (default target) | needs-update | 1/2 | rewrite /api/v1/auth/callback -> /api/v1/auth/oauth/callback; review remaining /api/v1/auth/userinfo |
| Session Fixation via Refresh Tokens | identity-session-fixation.json | generic | (default target) | needs-update | 2/3 | rewrite /api/v1/auth/token/refresh -> /api/v1/auth/refresh; review remaining /api/v1/auth/session/fixate |
| Insurance Claims Processing Fraud Campaign | insurance-claims-processing-fraud.json | generic | (default target) | needs-update | 10/15 | rewrite /api/users/profile -> /api/v1/users/profile; review remaining /api/claims/endpoints, /api/medical/records/update, /api/providers/register |
| Insurance Underwriting Data Manipulation | insurance-underwriting-manipulation.json | generic | (default target) | no-match | 0/14 | no direct Chimera route for /api/underwriting/system/info, /api/underwriting/risk-models/list, /api/actuarial/data/query-test |
| Advanced JWT Cryptographic Attacks | jwt-advanced-attacks.json | generic | (default target) | compatible | 3/3 | all scenario URLs match current Chimera OpenAPI routes |
| JWT Token Manipulation | jwt-token-manipulation.json | generic | (default target) | needs-update | 2/8 | rewrite /api/auth/login -> /api/v1/auth/login; rewrite /api/user/profile -> /api/v1/users/profile; review remaining /api/admin/users, /api/admin/settings, /api/admin/delete |
| Advanced LDAP Injection Campaign | ldap-injection-advanced.json | generic | (default target) | needs-update | 1/5 | rewrite /api/auth/login -> /api/v1/auth/login; review remaining /api/directory/search, /api/users, /api/auth/validate |
| Marketplace Vendor Impersonation Campaign | marketplace-vendor-impersonation.json | generic | (default target) | needs-update | 4/14 | review remaining /api/vendors/registration-info, /api/vendors/profile-template, /api/vendors/password-reset |
| Mobile Application Penetration Test | mobile-app-pentest.json | generic | (default target) | no-match | 0/4 | no direct Chimera route for /mobile/api/config, /mobile/deeplink, /mobile/api/auth |
| Mobile Banking API Exploitation | mobile-banking-api-exploitation.json | generic | (default target) | compatible | 15/15 | all scenario URLs match current Chimera OpenAPI routes |
| NoSQL Injection - MongoDB | nosql-injection-mongodb.json | generic | (default target) | needs-update | 2/7 | rewrite /api/auth/login -> /api/v1/auth/login; review remaining /api/users, /api/users/search, /api/orders/filter |
| OWASP API Security Top 10 (2023) - Complete Test Campaign | owasp-api-top10-comprehensive-campaign.json | external-crapi | http://localhost:8888 | no-match | 0/0 | scenario uses variable-driven endpoints only; manual review required |
| Payment Processing Fraud Campaign | payment-processing-fraud.json | generic | (default target) | needs-update | 1/11 | review remaining /api/payments/config, /api/payments/methods, /api/merchant/info |
| Network Port Scanning | port-scan-reconnaissance.json | generic | (default target) | no-match | 0/25 | no direct Chimera route for /:22, /:21, /:23 |
| Right-to-be-Forgotten Residual Data Probe | privacy-forget-me-bypass.json | generic | (default target) | needs-update | 1/3 | review remaining /api/v1/auth/delete, /api/v1/integrations/analytics/data |
| PII Harvesting via User Enumeration | privacy-pii-harvesting.json | generic | (default target) | compatible | 2/2 | all scenario URLs match current Chimera OpenAPI routes |
| Regulatory Compliance Evasion | regulatory-compliance-evasion.json | generic | (default target) | no-match | 0/15 | no direct Chimera route for /api/compliance/infrastructure/status, /api/compliance/aml/.well-known/endpoints, /api/kyc/verify/test-mode |
| Security Monitoring Blind Spot Exploitation | security-monitoring-evasion.json | generic | (default target) | needs-update | 1/12 | rewrite /api/user/profile -> /api/v1/users/profile; review remaining /.well-known/security.txt, /api/health, /api/feedback |
| SSRF Cloud Metadata Exploitation | ssrf-cloud-metadata.json | generic | (default target) | no-match | 0/5 | no direct Chimera route for /api/fetch, /webhook/test, /proxy/request |
| Server-Side Template Injection Multi-Engine | ssti-template-engines.json | generic | (default target) | no-match | 0/9 | no direct Chimera route for /search, /api/render, /api/template/compile |
| Subdomain Discovery | subdomain-reconnaissance.json | generic | (default target) | no-match | 0/1 | no direct Chimera route for / |
| Dependency Confusion Reconnaissance | supply-chain-dependency-confusion.json | generic | (default target) | no-match | 0/3 | no direct Chimera route for /static/js/main.chunk.js, /api/v1/system/version, /api/v1/debug/dependencies |
| Supply Chain Poisoning Campaign | supply-chain-poisoning-campaign.json | generic | (default target) | no-match | 0/12 | no direct Chimera route for /package.json, /.well-known/npm-package-listing, /assets/lib/jquery-3.6.0.min.js |
| CI/CD Webhook Poisoning Attack | supply-chain-webhook-poisoning.json | generic | (default target) | no-match | 0/1 | no direct Chimera route for /api/v1/webhooks/github |
| Technology Fingerprinting (Python/Flask API) | tech-fingerprinting-python-api.json | generic | (default target) | needs-update | 1/27 | review remaining /robots.txt, /version.txt, /.well-known/security.txt |
| Technology Fingerprinting | tech-fingerprinting.json | generic | (default target) | needs-update | 1/18 | review remaining /robots.txt, /version.txt, /.well-known/security.txt |
| Third-Party Integration Attacks | third-party-integration-attacks.json | generic | (default target) | needs-update | 7/14 | review remaining /.well-known/openid_configuration, /api/oauth/callback, /api/auth/social/google |
| VAmPI - BOLA Books Database Enumeration | vampi-bola-books-enumeration.json | external-vampi | http://localhost:5000 | no-match | 0/5 | no direct Chimera route for /createUser, /login, /books/v1 |
| VAmPI - Mass Assignment Privilege Escalation | vampi-mass-assignment-privilege-escalation.json | external-vampi | http://localhost:5000 | no-match | 0/5 | no direct Chimera route for /, /createUser, /login |
| 01 - Single SQLi Probe | vp-demo-01-single-sqli-probe.json | external-vp-demo | (default target) | no-match | 0/1 | no direct Chimera route for https://localhost:6190/ |
| 02 - XSS Attempt | vp-demo-02-xss-attempt.json | external-vp-demo | (default target) | no-match | 0/1 | no direct Chimera route for https://localhost:6190/search |
| 03 - Behavioral Trigger | vp-demo-03-behavioral-trigger.json | external-vp-demo | (default target) | no-match | 0/4 | no direct Chimera route for https://localhost:6190/api/users, https://localhost:6190/search, https://localhost:6190/api/files |
| 04 - Clean Request After Ban | vp-demo-04-clean-request-after-ban.json | external-vp-demo | (default target) | no-match | 0/1 | no direct Chimera route for https://localhost:6190/api/health |
| 05 - Schema Violation | vp-demo-05-schema-violation.json | external-vp-demo | (default target) | no-match | 0/1 | no direct Chimera route for https://localhost:6190/api/users |
| 06 - Trap Endpoint | vp-demo-06-trap-endpoint.json | external-vp-demo | (default target) | no-match | 0/1 | no direct Chimera route for https://localhost:6190/wp-login.php |
| WebSocket Logic & Security Manipulation | websocket-logic-manipulation.json | generic | (default target) | no-match | 0/1 | no direct Chimera route for /api/v1/integrations/ws/simulate-frame |
| XML External Entity (XXE) Injection | xxe-injection-xml.json | generic | (default target) | no-match | 0/7 | no direct Chimera route for /api/xml/upload, /api/xml/parse, /api/xml/process |

## Recommended Follow-up

- Prioritize the `chimera-first` scenarios marked `needs-update`; they are the fastest wins because they already target current Chimera domains but have route drift.
- Treat `external-crapi`, `external-vampi`, `external-vp-demo`, and `external-threatx-demo` rows marked `no-match` as candidates for replacement scenarios instead of path-only rewrites.
- If TASK-29 expands Chimera-native coverage further, re-run this audit against the updated `openapi.yaml` before editing scenario JSON files.
