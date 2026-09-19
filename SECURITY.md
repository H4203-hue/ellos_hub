# Segurança do EllosHub

## Variáveis de ambiente

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` são públicas por definição. A anon key não substitui RLS.
- `SUPABASE_SERVICE_ROLE_KEY` é um segredo de servidor. Ela só pode ser acessada por módulos `server-only` e nunca deve receber o prefixo `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_APP_URL` deve usar a origem HTTPS canônica em produção. Links de convite e recuperação não são construídos a partir do cabeçalho `Host` em produção.
- `.env.local`, `.env.production` e arquivos equivalentes não podem ser versionados.

## Banco e migrações

Para o lote de segurança de setembro de 2026, execute os scripts nesta ordem em um ambiente de teste antes da produção:

1. `supabase/saas-multitenant-migration.sql`
2. `supabase/2026-08-workspace-scoping.sql`
3. `supabase/2026-08-create-workspace-rpc.sql`
4. `supabase/2026-08-rls-policies.sql`
5. `supabase/2026-09-security-hardening.sql`

O último script invalida convites antigos, pois eles não tinham workspace e armazenavam o token utilizável. Novos convites guardam apenas o hash SHA-256.

## Verificação antes da publicação

- `npm audit --audit-level=moderate`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
- Confirmar RLS e grants no Supabase com usuários OWNER, ADMIN, MEMBER e anônimo.
- Confirmar que a Vercel contém a service-role somente como variável de servidor.
- Rotacionar qualquer segredo que já tenha sido copiado para logs, commits, capturas de tela ou conversas.
- Inspecionar respostas de API, console do navegador, HTML e bundles da implantação.

## Resposta a exposição de segredo

1. Revogar/rotacionar a chave no provedor imediatamente.
2. Atualizar os ambientes da Vercel.
3. invalidar sessões quando aplicável.
4. Verificar logs de acesso e ações administrativas.
5. Remover o valor do histórico Git, se ele tiver sido versionado; apenas apagar o arquivo no commit atual não é suficiente.
