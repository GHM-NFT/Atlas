# Security and Privacy Notice

## Classification

This is a private internal Atlas build. It contains governance, validation and unresolved issue information and must not be published.

## Local operation

The launchers start a local web server at:

`http://127.0.0.1:8000/index.html#overview`

Binding to `127.0.0.1` limits access to the local Mac. The launcher does not expose Atlas to other devices on the network.

## Excluded source material

The package does not contain:

- the original `.xlsx` workbook
- source export ZIPs
- raw worksheet CSV files
- the copywriter `.docx`
- Google credentials
- API keys
- write-back code
- Praetoria font binaries

## Browser visibility

Anyone with access to the local browser session can inspect the rendered internal data. This is suitable only for the intended single-user local workflow.

Before any hosted internal deployment:

- add authenticated server sessions
- enforce HTTPS
- apply role-based server-side access controls
- store credentials outside the web root
- use read-only Google scopes
- add login throttling and multi-factor authentication
- prevent raw exports from entering the hosted package
- disable public indexing and sensitive caching
- retain validated rollback datasets privately

## Public edition

A future public Atlas requires a separately approved public-safe dataset and separate build. Do not upload this package to a public repository or hosting service.
