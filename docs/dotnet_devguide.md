# .NET Developer Guide

## Project Structure
- `Controllers/OrdersController.cs` - HTTP surface
- `Models/` - Order, Item, Payment, DTOs
- `Repositories/` - IOrderRepository, InMemoryOrderRepository
- `Services/` - IOrderService, OrderService (business logic)
- `Jobs/OrderBackgroundService.cs` - hosted background service
- `Program.cs` - DI, middleware configuration

## How to Run
```bash
cd dotnet-order-processing
dotnet build
dotnet run
```

The app listens on `http://localhost:5000` by default.

## Payment System Implementation

Orders now include a `totalPaid` field and support multiple payments.

### Update Order Model
```csharp
public class Order
{
    public double TotalPaid { get; set; }  // NEW: track cumulative payments
    // ... other fields
}
```

### Create Payment Model
```csharp
public class Payment
{
    public string Id { get; set; }
    public string OrderId { get; set; }
    public double Amount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; }
}
```

### Add Payment Service Method
```csharp
public Payment AddPayment(string orderId, PaymentCreateDto dto)
{
    // Validate order exists & is PENDING
    // Validate amount > 0 and <= (total - totalPaid)
    // Create & store payment
    // Update order.totalPaid
    // Return payment
}
```

### Update Background Job Logic
```csharp
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
    while (!stoppingToken.IsCancellationRequested)
    {
        var pending = _service.List("PENDING");
        foreach (var order in pending)
        {
            if (order.TotalPaid >= order.Total)  // KEY CHANGE
            {
                _service.UpdateStatus(order.Id, "PROCESSING");
            }
        }
        await Task.Delay(_interval, stoppingToken);
    }
}
```

### Add Payment Endpoints to Controller
```csharp
[HttpPost("{id}/payments")]
public IActionResult AddPayment(string id, [FromBody] PaymentCreateDto dto)
{
    try {
        var payment = _service.AddPayment(id, dto);
        var order = _service.GetById(id);
        return CreatedAtAction(nameof(Get), new { id = order.Id }, new { payment, order });
    } catch (KeyNotFoundException) {
        return NotFound();
    } catch (ArgumentException ex) {
        return BadRequest(ex.Message);
    }
}

[HttpGet("{id}/payments")]
public IActionResult GetPayments(string id)
{
    var order = _service.GetById(id);
    if (order is null) return NotFound();
    var payments = _service.GetPayments(id);
    return Ok(payments);
}
```

## Extending to Database

### Step 1: Create EF Core-backed Repository
```csharp
public class SqlOrderRepository : IOrderRepository
{
    private readonly OrderDbContext _context;
    
    public SqlOrderRepository(OrderDbContext context) => _context = context;
    
    public Order GetById(string id)
    {
        return _context.Orders.Include(o => o.Payments).FirstOrDefault(o => o.Id == id);
    }
    
    public void Save(Order order)
    {
        _context.Orders.Add(order);
        _context.SaveChanges();
    }
    
    public void Update(Order order)
    {
        _context.Orders.Update(order);
        _context.SaveChanges();
    }
    
    // ... other methods
}
```

### Step 2: Register in Program.cs
```csharp
builder.Services.AddDbContext<OrderDbContext>();
builder.Services.AddScoped<IOrderRepository, SqlOrderRepository>();  // Scoped for EF
```

## Configuration

The background job interval is configured via environment variable:
```powershell
$env:JOB_INTERVAL_MS = 1000  # 1 second for testing
dotnet run
```

Or in `.env` file:
```
JOB_INTERVAL_MS=300000
```

## Testing

Use Postman or PowerShell:
```powershell
# Create order
$body = @{ items = @(@{ productId = "p1"; quantity = 2; price = 50 }) } | ConvertTo-Json
$order = Invoke-WebRequest -Uri "http://localhost:5000/orders" -Method POST -Body $body -ContentType "application/json" | ConvertFrom-Json

# Make payment
$payment = @{ amount = 60; paymentMethod = "credit_card" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5000/orders/$($order.id)/payments" -Method POST -Body $payment -ContentType "application/json"

# Get payments
Invoke-WebRequest -Uri "http://localhost:5000/orders/$($order.id)/payments" -Method GET
```

## Design Patterns in Payment Feature

1. **Repository Pattern** - Payment storage abstracted via `IOrderRepository`
2. **Service Layer** - Payment validation & business logic in `OrderService`
3. **DTO Pattern** - `PaymentCreateDto` separates API from domain
4. **DI Pattern** - Services & repositories injected in constructors
5. **Atomic Updates** - Payment + order update together

## Key Files for Payment Feature

| File | Change |
|------|--------|
| `Models/Order.cs` | Add TotalPaid property |
| `Models/Payment.cs` | NEW model |
| `Models/PaymentCreateDto.cs` | NEW DTO |
| `Services/IOrderService.cs` | Add AddPayment, GetPayments methods |
| `Services/OrderService.cs` | Implement payment methods & validation |
| `Repositories/IOrderRepository.cs` | Add payment methods |
| `Repositories/InMemoryOrderRepository.cs` | Implement payment storage |
| `Controllers/OrdersController.cs` | Add payment endpoints |
| `Jobs/OrderBackgroundService.cs` | Update transition logic |

See `payments_guide.md` for detailed payment requirements and business rules.
