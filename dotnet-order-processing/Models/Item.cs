namespace DotnetOrderProcessing.Models;

public class Item
{
    public string ProductId { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public double Price { get; set; }
}
