namespace DotnetOrderProcessing.Models;

public class Order
{
    public string Id { get; set; } = string.Empty;
    public List<Item> Items { get; set; } = new List<Item>();
    public double Total { get; set; }
    public double TotalPaid { get; set; } = 0;
    public string Status { get; set; } = "PENDING";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
