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
        order.Status = "CANCELLED";
        order.UpdatedAt = DateTime.UtcNow;
        _repo.Update(order);
        return order;
    }

    public IEnumerable<Order> TransitionPendingToProcessing()
    {
        var pending = _repo.List("PENDING").ToList();
        foreach (var o in pending)
        {
            o.Status = "PROCESSING";
            o.UpdatedAt = DateTime.UtcNow;
            _repo.Update(o);
        }
        return pending;
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
