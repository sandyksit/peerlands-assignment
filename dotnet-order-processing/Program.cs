
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using DotnetOrderProcessing.Repositories;
using DotnetOrderProcessing.Services;
using DotnetOrderProcessing.Jobs;

var builder = WebApplication.CreateBuilder(args);

// Configuration
builder.Services.AddControllers();

// DI registrations
builder.Services.AddSingleton<IOrderRepository, InMemoryOrderRepository>();
builder.Services.AddSingleton<IOrderService, OrderService>();
builder.Services.AddHostedService<OrderBackgroundService>();

var app = builder.Build();

if (app.Environment.IsDevelopment()) {
    app.UseDeveloperExceptionPage();
}

app.MapControllers();

app.Run();
