Take-Home Assignment: Building an Order Processing System
Objective:
The goal of this assignment is to assess your ability to design, implement, and test a backend system in .Net that handles order processing efficiently.
Scenario:
You have been hired to build the backend for an E-commerce Order Processing System. The system should allow customers to place orders, track their status, and support basic order operations.
Requirements
1. Core Features
  •  Create an order: Customers should be able to place an order with multiple items.
  •  Retrieve order details: The system should allow fetching order details by order ID.
  •  Update order status: The order should have statuses like PENDING, PROCESSING, SHIPPED, and DELIVERED. A background job should automatically update PENDING orders to PROCESSING every 5 minutes.
  •  List all orders: Retrieve all orders, optionally filtered by status.
  •  Cancel an order: Customers should be able to cancel an order, but only if it’s still in PENDING status.
Coding assignment:
Extensive use of Cursor AI, ChatGPT for every aspect of the coding assignment is encouraged. Candidate needs to explain what they used it for, what were the issues found, how they corrected it.

# New Requirement

Updated Requirements for coding round
 
- Customers need to pay for orders to be processed
- Customers can place orders without making any payments. The order will be placed in PENDING state till the entire payment is completed
- Customers can make multiple partial payments for an order
- The order must be moved from PENDING to PROCESSING status by the background service only when the total payment by the customer is equal to the total price of the order