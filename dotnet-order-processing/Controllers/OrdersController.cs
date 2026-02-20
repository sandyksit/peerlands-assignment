using Microsoft.AspNetCore.Mvc;
using DotnetOrderProcessing.Services;
using DotnetOrderProcessing.Models;

namespace DotnetOrderProcessing.Controllers;

[ApiController]
[Route("orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _service;
    public OrdersController(IOrderService service) => _service = service;

    [HttpGet]
    public IActionResult List([FromQuery] string? status) => Ok(_service.List(status));

    [HttpGet("{id}")]
    public IActionResult Get(string id)
    {
        var order = _service.GetById(id);
        return order is null ? NotFound() : Ok(order);
    }

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

    [HttpPatch("{id}/status")]
    public IActionResult UpdateStatus(string id, [FromBody] StatusUpdateDto dto)
    {
        try {
            var updated = _service.UpdateStatus(id, dto.Status);
            return Ok(updated);
        } catch (KeyNotFoundException) {
            return NotFound();
        } catch (ArgumentException ex) {
            return BadRequest(ex.Message);
        }
    }

    [HttpPatch("{id}/cancel")]
    public IActionResult Cancel(string id)
    {
        try {
            var updated = _service.Cancel(id);
            return Ok(updated);
        } catch (KeyNotFoundException) {
            return NotFound();
        } catch (InvalidOperationException ex) {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/payments")]
    public IActionResult AddPayment(string id, [FromBody] PaymentCreateDto dto)
    {
        try {
            var payment = _service.AddPayment(id, dto);
            return CreatedAtAction(nameof(GetPayments), new { id = id }, payment);
        } catch (KeyNotFoundException) {
            return NotFound();
        } catch (InvalidOperationException ex) {
            return BadRequest(ex.Message);
        } catch (ArgumentException ex) {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}/payments")]
    public IActionResult GetPayments(string id)
    {
        try {
            var payments = _service.GetPayments(id);
            return Ok(payments);
        } catch (KeyNotFoundException) {
            return NotFound();
        }
    }
}
