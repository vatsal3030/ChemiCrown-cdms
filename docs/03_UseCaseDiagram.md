# Use Case Diagram

```mermaid
usecaseDiagram
    actor PublicVisitor as "Public Visitor"
    actor Customer
    actor Manager
    actor Sales

    PublicVisitor --> (View Products)
    PublicVisitor --> (Submit Contact Form)
    PublicVisitor --> (Register/Login)

    Customer --> (View Products)
    Customer --> (Request Quotation)
    Customer --> (Track Own Orders)

    Sales --> (View Inquiries)
    Sales --> (Generate Quotation)
    Sales --> (Update Order Status)
    Sales --> (View Customers)

    Manager --> (Manage Inventory)
    Manager --> (Link Suppliers)
    Manager --> (View Dashboard KPIs)
    Manager --> (View All Orders)
    
    Sales --> (Login)
    Manager --> (Login)
```
