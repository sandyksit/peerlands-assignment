using DotnetOrderProcessing.Models;

namespace DotnetOrderProcessing.Repositories;

public interface IOrderRepository
{
    IEnumerable<Order> List(string? status = null);
    Order? GetById(string id);
    void Save(Order order);
    void Update(Order order);
    Payment SavePayment(Payment payment);
    IEnumerable<Payment> GetPayments(string orderId);
}
