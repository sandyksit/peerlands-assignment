# .NET Order Processing (Refactored)

This folder contains a professionally-structured ASP.NET Core (net8.0) implementation of the Order Processing System.

Quick start (PowerShell)
1. cd /d d:\peerlands-assignment\dotnet-order-processing
2. dotnet build
3. dotnet run

Notes
- The project is a minimal API wired with Controllers, Services, Repositories, and a hosted background job.
- Background job interval can be configured via the environment variable `JOB_INTERVAL_MS` (milliseconds). Default is 300000 (5 minutes).
- See `../docs/dotnet_design_patterns.md` for detailed explanation of all design patterns used.

Development
- Replace `InMemoryOrderRepository` with a DB-backed repository implementing `IOrderRepository` to persist data.
- Add tests with xUnit and inject a mock `IOrderRepository` to exercise `OrderService` logic.


