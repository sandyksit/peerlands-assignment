using DotnetOrderProcessing.Models;

namespace DotnetOrderProcessing.Services;

public interface IOrderService
{
    Order Create(Models.OrderCreateDto dto);
    Order? GetById(string id);
    IEnumerable<Order> List(string? status = null);
    Order UpdateStatus(string id, string status);
    Order Cancel(string id);
    IEnumerable<Order> TransitionPendingToProcessing();
    Payment AddPayment(string orderId, PaymentCreateDto dto);
    IEnumerable<Payment> GetPayments(string orderId);
}
