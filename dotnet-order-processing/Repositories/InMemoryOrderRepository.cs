using DotnetOrderProcessing.Models;
using System.Collections.Concurrent;
using System.Linq;

namespace DotnetOrderProcessing.Repositories;

public class InMemoryOrderRepository : IOrderRepository
{
    private readonly ConcurrentDictionary<string, Order> _store = new();

    public IEnumerable<Order> List(string? status = null)
    {
        var values = _store.Values.AsEnumerable();
        return string.IsNullOrEmpty(status) ? values : values.Where(o => o.Status == status);
    }

    public Order? GetById(string id) => _store.TryGetValue(id, out var o) ? o : null;

    public void Save(Order order) => _store[order.Id] = order;

    public void Update(Order order) => _store[order.Id] = order;
}
