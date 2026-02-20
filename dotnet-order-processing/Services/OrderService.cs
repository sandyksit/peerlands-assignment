using DotnetOrderProcessing.Models;
using DotnetOrderProcessing.Repositories;
using System.Linq;

namespace DotnetOrderProcessing.Services;

public class OrderService : IOrderService
{
    private static readonly string[] ValidStatuses = new[] { "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED" };
    private readonly IOrderRepository _repo;

    public OrderService(IOrderRepository repo) => _repo = repo;

    public Order Create(OrderCreateDto dto)
    {
        ValidateItems(dto.Items);
        var order = new Order
        {
            Id = Guid.NewGuid().ToString(),
            Items = dto.Items,
            Total = dto.Items.Sum(i => i.Price * i.Quantity),
            TotalPaid = 0,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _repo.Save(order);
        return order;
    }

    public Order? GetById(string id) => _repo.GetById(id);

    public IEnumerable<Order> List(string? status = null) => _repo.List(status);

    public Order UpdateStatus(string id, string status)
    {
        if (!ValidStatuses.Contains(status)) throw new ArgumentException("invalid status");
        var order = _repo.GetById(id) ?? throw new KeyNotFoundException();
        order.Status = status;
        order.UpdatedAt = DateTime.UtcNow;
        _repo.Update(order);
        return order;
    }

    public Order Cancel(string id)
    {
        var order = _repo.GetById(id) ?? throw new KeyNotFoundException();
        if (order.Status != "PENDING") throw new InvalidOperationException("only PENDING orders can be cancelled");
        if (order.TotalPaid > 0) throw new InvalidOperationException("cannot cancel order with existing payments");
        order.Status = "CANCELLED";
        order.UpdatedAt = DateTime.UtcNow;
        _repo.Update(order);
        return order;
    }

    public IEnumerable<Order> TransitionPendingToProcessing()
    {
        var pending = _repo.List("PENDING").ToList();
        var updated = new List<Order>();
        foreach (var o in pending)
        {
            if (o.TotalPaid >= o.Total)
            {
                o.Status = "PROCESSING";
                o.UpdatedAt = DateTime.UtcNow;
                _repo.Update(o);
                updated.Add(o);
            }
        }
        return updated;
    }

    public Payment AddPayment(string orderId, PaymentCreateDto dto)
    {
        var order = _repo.GetById(orderId) ?? throw new KeyNotFoundException();
        if (order.Status != "PENDING") throw new InvalidOperationException("payments can only be made for PENDING orders");
        if (dto.Amount <= 0) throw new ArgumentException("amount must be a positive number");
        
        var remaining = order.Total - order.TotalPaid;
        if (dto.Amount > remaining) throw new ArgumentException($"overpayment: cannot pay {dto.Amount}, remaining balance is {remaining}");
        
        var payment = new Payment
        {
            Id = Guid.NewGuid().ToString(),
            OrderId = orderId,
            Amount = dto.Amount,
            PaymentDate = DateTime.UtcNow,
            PaymentMethod = dto.PaymentMethod ?? "unknown"
        };
        
        // Save payment first
        var savedPayment = _repo.SavePayment(payment);
        
        // Get fresh order reference and update TotalPaid
        var updatedOrder = _repo.GetById(orderId) ?? throw new KeyNotFoundException();
        updatedOrder.TotalPaid += dto.Amount;
        updatedOrder.UpdatedAt = DateTime.UtcNow;
        _repo.Update(updatedOrder);
        
        return savedPayment;
    }

    public IEnumerable<Payment> GetPayments(string orderId)
    {
        var order = _repo.GetById(orderId) ?? throw new KeyNotFoundException();
        return _repo.GetPayments(orderId);
    }

    private void ValidateItems(List<Item> items)
    {
        if (items == null || items.Count == 0) throw new ArgumentException("items must be provided");
        foreach (var it in items)
        {
            if (string.IsNullOrEmpty(it.ProductId)) throw new ArgumentException("item.productId required");
            if (it.Quantity <= 0) throw new ArgumentException("item.quantity must be > 0");
            if (it.Price < 0) throw new ArgumentException("item.price must be >= 0");
        }
    }
}
