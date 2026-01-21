# Peerlands Assignment — Order Processing System

This repository contains two implementations of a simple Order Processing System required for the take-home assignment:

- `nodejs-order-processing/` — Node.js (plain JavaScript, Express) implementation
- `dotnet-order-processing/` — .NET 6 minimal API implementation

Each implementation provides the same HTTP API (see `docs/spec.md`) and uses an in-memory store so the projects are easy to run locally.

Which README to read
- If you want to run or develop the Node.js version, open `nodejs-order-processing/README.md`.
- If you want to run or develop the .NET version, open `dotnet-order-processing/README.md`.

Quick start (Node)
1. Open PowerShell in repository root
2. cd ./nodejs-order-processing
3. npm install
4. npm start

Quick start (.NET)
1. Ensure .NET 6 SDK is installed
2. dotnet run --project .\dotnet-order-processing

Project structure
- `docs/` — spec, architecture, API references and dev guides for both projects
- `nodejs-order-processing/` — Node.js app (Express)
- `dotnet-order-processing/` — .NET app (minimal API)

If you want me to run builds/tests for either project here, tell me and I'll run the commands and report the outputs.
