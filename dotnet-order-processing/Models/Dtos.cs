namespace DotnetOrderProcessing.Models;

public class OrderCreateDto
{
    public List<Item> Items { get; set; } = new List<Item>();
}

public class StatusUpdateDto
{
    public string Status { get; set; } = string.Empty;
}
