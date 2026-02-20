using Microsoft.Extensions.Hosting;
using DotnetOrderProcessing.Services;
using System.Linq;

namespace DotnetOrderProcessing.Jobs;

public class OrderBackgroundService : BackgroundService
{
    private readonly IOrderService _service;
    private readonly TimeSpan _interval;

    public OrderBackgroundService(IOrderService service)
    {
        _service = service;
        var msEnv = Environment.GetEnvironmentVariable("JOB_INTERVAL_MS");
        _interval = TimeSpan.FromMilliseconds(int.TryParse(msEnv, out var ms) ? ms : 300000);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var updated = _service.TransitionPendingToProcessing();
                if (updated.Any()) Console.WriteLine($"Background job: moved {updated.Count()} orders from PENDING to PROCESSING (payment condition met)");
            }
            catch (Exception ex) { Console.Error.WriteLine(ex); }

            await Task.Delay(_interval, stoppingToken);
        }
    }
}
