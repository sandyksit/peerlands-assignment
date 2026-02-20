# .NET Design Patterns Used

This document explains the design patterns implemented in the Order Processing System (.NET Core).

## 1. Repository Pattern

**Purpose**: Abstract data access logic from the business logic layer.

**Implementation**:
- Interface: `IOrderRepository` defines the contract for data access
- Implementation: `InMemoryOrderRepository` implements the interface using a `ConcurrentDictionary`

**Benefits**:
- Easy to swap implementations (e.g., SQL, MongoDB, Redis)
- Testable: can mock `IOrderRepository` in unit tests
- Single Responsibility: data access concerns are isolated

**Example**:
```csharp
public interface IOrderRepository
{
    IEnumerable<Order> List(string? status = null);
    Order? GetById(string id);
    void Save(Order order);
    void Update(Order order);
}
```

To switch to a SQL database, create a new class without touching existing code:
```csharp
public class SqlOrderRepository : IOrderRepository { /* ... */ }
// Then update Program.cs:
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();
```

---

## 2. Dependency Injection (DI) Pattern

**Purpose**: Provide dependencies to classes without tight coupling.

**Implementation** in `Program.cs`:
```csharp
builder.Services.AddSingleton<IOrderRepository, InMemoryOrderRepository>();
builder.Services.AddSingleton<IOrderService, OrderService>();
builder.Services.AddHostedService<OrderBackgroundService>();
```

**Benefits**:
- Loose coupling between layers
- Easy to test: inject mock dependencies
- Centralized configuration
- Lifetime management (Singleton, Scoped, Transient)

**Example**:
```csharp
public class OrderService : IOrderService
{
    private readonly IOrderRepository _repo;
    
    // Dependency injected via constructor
    public OrderService(IOrderRepository repo) => _repo = repo;
}
```

---

## 3. Service Layer Pattern

**Purpose**: Encapsulate business logic separate from HTTP handling.

**Implementation**:
- `IOrderService` interface defines business operations
- `OrderService` class contains validation, status transitions, and business rules

**Benefits**:
- Controllers are thin and focused on HTTP
- Business logic is reusable and testable
- Changes to business rules don't affect HTTP layer

**Example**:
```csharp
public Order Create(OrderCreateDto dto)
{
    ValidateItems(dto.Items);  // Business validation
    var order = new Order { ... };
    _repo.Save(order);
    return order;
}
```

---

## 4. MVC/Controller Pattern

**Purpose**: Handle HTTP requests and coordinate responses.

**Implementation**:
- `OrdersController` maps HTTP verbs (GET, POST, PATCH) to service methods
- Returns appropriate HTTP status codes (201, 400, 404, 500)

**Responsibilities**:
- Extract and validate input from requests
- Call service methods
- Format and return responses

**Example**:
```csharp
[HttpPost]
public IActionResult Create([FromBody] OrderCreateDto dto)
{
    try {
        var order = _service.Create(dto);
        return CreatedAtAction(nameof(Get), new { id = order.Id }, order);
    } catch (ArgumentException ex) {
        return BadRequest(ex.Message);
    }
}
```

---

## 5. Data Transfer Object (DTO) Pattern

**Purpose**: Create separate models for API requests/responses, decoupling from domain models.

**Implementation**:
- `OrderCreateDto`: for POST /orders requests
- `StatusUpdateDto`: for PATCH /orders/{id}/status requests
- `Order`: domain model (internal)

**Benefits**:
- Contract stability: API doesn't break if domain model changes
- Validation: DTOs can have specific validation rules
- Security: hide internal fields from external clients

**Example**:
```csharp
public class OrderCreateDto
{
    public List<Item> Items { get; set; } = new List<Item>();
}

public class Order  // Domain model
{
    public string Id { get; set; }
    public List<Item> Items { get; set; }
    public double Total { get; set; }
    // ... other fields
}
```

---

## 6. Hosted Service Pattern

**Purpose**: Run background tasks in the ASP.NET Core application lifetime.

**Implementation**:
- `OrderBackgroundService` extends `BackgroundService`
- Registered in DI: `builder.Services.AddHostedService<OrderBackgroundService>()`

**Behavior**:
- Starts when the app starts
- Stops gracefully when the app shuts down
- Runs asynchronously in the background

**Example**:
```csharp
public class OrderBackgroundService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var updated = _service.TransitionPendingToProcessing();
            await Task.Delay(_interval, stoppingToken);
        }
    }
}
```

**Benefits**:
- Non-blocking
- Integrated with app lifecycle
- Easy to test and configure

---

## 7. Singleton Pattern

**Purpose**: Create a single instance that lives for the application's lifetime.

**Usage**:
```csharp
builder.Services.AddSingleton<IOrderRepository, InMemoryOrderRepository>();
```

**In-Memory Store** (`ConcurrentDictionary<string, Order>`):
- One instance per app
- Thread-safe for concurrent requests
- Data persists across requests but is lost on app restart

**When to use**:
- Stateless services
- In-memory caches
- Configuration services

---

## 8. Layered Architecture Pattern

**Overall Structure**:
```
Controllers (HTTP Layer)
    ↓
Services (Business Logic)
    ↓
Repositories (Data Access)
    ↓
Models (Domain Objects)
```

**Benefits**:
- Separation of concerns
- Easy to test each layer independently
- Changes in one layer don't ripple everywhere

---

## Summary Table

| Pattern | Used In | Purpose |
|---------|---------|---------|
| Repository | `IOrderRepository`, `InMemoryOrderRepository` | Abstract data access |
| Dependency Injection | `Program.cs` | Loose coupling |
| Service Layer | `IOrderService`, `OrderService` | Encapsulate business logic |
| MVC/Controller | `OrdersController` | Handle HTTP requests |
| DTO | `OrderCreateDto`, `StatusUpdateDto` | Request/response contracts |
| Hosted Service | `OrderBackgroundService` | Background jobs |
| Singleton | Repository, Service instances | Single app-wide instance |
| Layered Architecture | Project structure | Separation of concerns |

---

## How to Extend

**Add a new feature** (e.g., PaymentService):

1. Create `IPaymentService` interface
2. Create `PaymentService` implementation with business logic
3. Register in `Program.cs`:
   ```csharp
   builder.Services.AddSingleton<IPaymentService, PaymentService>();
   ```
4. Inject into `OrderService` or `OrdersController`
5. Use without changing existing code

This is the power of these patterns—easy extension without modification.
