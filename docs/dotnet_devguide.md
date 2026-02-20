# .NET Developer Guide

Project structure (cleaned)
- `Controllers/OrdersController.cs` - HTTP surface
- `Models/` - `Order`, `Item`, DTOs
- `Repositories/` - `IOrderRepository`, `InMemoryOrderRepository` (replaceable with EF Core repo)
- `Services/` - `IOrderService`, `OrderService` (business rules)
- `Jobs/OrderBackgroundService.cs` - hosted background service
- `Program.cs` - DI, middleware, swagger

Design patterns used in this project:
- **Repository Pattern**: Abstract data access via `IOrderRepository`
- **Dependency Injection**: Register services in `Program.cs`
- **Service Layer Pattern**: Business logic in `OrderService`
- **MVC/Controller Pattern**: HTTP handling in `OrdersController`
- **DTO Pattern**: `OrderCreateDto`, `StatusUpdateDto` for request/response contracts
- **Hosted Service Pattern**: Background job in `OrderBackgroundService`
- **Singleton Pattern**: Services and repositories as singletons

See `dotnet_design_patterns.md` for detailed explanation of each pattern.

How to run
1. dotnet build
2. dotnet run --project .\dotnet-order-processing

Configuration
- JOB_INTERVAL_MS environment variable controls the background job interval in milliseconds (default 300000)

Extending to database
1. Implement a repository that uses `DbContext` and `IOrderRepository` methods.
2. Register it in `Program.cs` replacing `InMemoryOrderRepository`.

Testing
- Add xUnit/NUnit test project and inject mock `IOrderRepository` to test `OrderService` logic.

Coding standards
- Use PascalCase for public types and properties.
- Keep controllers thin; place validation and logic in services.
