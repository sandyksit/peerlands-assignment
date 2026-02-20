using DotnetOrderProcessing.Models;
using System.Collections.Concurrent;
using System.Linq;

namespace DotnetOrderProcessing.Repositories;

public class InMemoryOrderRepository : IOrderRepository
{
    private readonly ConcurrentDictionary<string, Order> _store = new();
    private readonly ConcurrentDictionary<string, List<Payment>> _payments = new();

    public IEnumerable<Order> List(string? status = null)
    {
        var values = _store.Values.AsEnumerable();
        return string.IsNullOrEmpty(status) ? values : values.Where(o => o.Status == status);
    }

    public Order? GetById(string id) => _store.TryGetValue(id, out var o) ? o : null;

    public void Save(Order order) => _store[order.Id] = order;

    public void Update(Order order) => _store[order.Id] = order;

    public Payment SavePayment(Payment payment)
    {
        if (!_payments.ContainsKey(payment.OrderId))
        {
            _payments[payment.OrderId] = new List<Payment>();
        }
        _payments[payment.OrderId].Add(payment);
        return payment;
    }

    public IEnumerable<Payment> GetPayments(string orderId)
    {
        return _payments.TryGetValue(orderId, out var payments) ? payments : new List<Payment>();
    }
}
