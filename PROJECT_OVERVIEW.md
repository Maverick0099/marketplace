# Marketplace Backend: Project, Interview, and AWS Notes

## Project at a glance

This is a cohort-built, Node.js/Express marketplace backend organized as independent services. The folders in this workspace are `ai-buddy`, `auth`, `cart`, `notification`, `order`, `payment`, `product`, and `seller-dashboard`—eight services total. The seven named in the project description do not include the separate notification service.

The backend covers user registration and login, product catalog and image uploads, carts, order creation and tracking, Razorpay payment initiation/verification, seller-facing data, email notifications, and an AI shopping assistant. The services use MongoDB/Mongoose; auth also uses Redis for token logout/blacklisting. RabbitMQ queues carry events to the notification and seller-dashboard services. The AI Buddy uses Socket.IO and a LangGraph tool-calling flow to search products and add an item to a cart.

### Service map

| Service | Main responsibility | Notable integration |
|---|---|---|
| `auth` | Registration, login, JWT/cookie authentication, user addresses and logout | MongoDB, Redis, RabbitMQ |
| `product` | Product create/read/update/delete, seller product listing, image upload | MongoDB, ImageKit, RabbitMQ |
| `cart` | Authenticated cart reads and item updates | MongoDB |
| `order` | Create/list/read/cancel orders and update shipping address | MongoDB, HTTP calls to cart/product, RabbitMQ |
| `payment` | Create Razorpay order and verify payment signature | MongoDB, Razorpay, RabbitMQ |
| `notification` | Consume events and send email notifications | RabbitMQ, Gmail/Nodemailer |
| `seller-dashboard` | Keep seller-facing copies/views of users, products, orders and payments | MongoDB, RabbitMQ |
| `ai-buddy` | Authenticated Socket.IO assistant with product-search/cart tools | Gemini through LangChain/LangGraph, HTTP calls to product/cart |

### Example end-to-end flow

1. A user registers or logs in through `auth`; the service issues a JWT in an HTTP-only cookie and can also accept authorization headers.
2. A seller creates a product through `product`; the service saves it, uploads images to ImageKit, and publishes events.
3. A user adds products to `cart`, then asks `order` to create an order. The order service reads the cart and product information over HTTP and checks stock.
4. `payment` creates a Razorpay order for an order. The client completes payment and sends payment verification data back to the service.
5. RabbitMQ events are consumed by `notification` for email and by `seller-dashboard` to populate its read-side data.
6. Separately, `ai-buddy` accepts authenticated Socket.IO messages and can invoke tools for product search and adding a product to cart.

This describes code paths present in the workspace; it is not a claim that every path has been verified end-to-end in the current AWS environment.

## Technology and workflow learned

- **Service boundaries:** separate Express applications, ports, route groups, models, environment configuration, and Docker build contexts.
- **Container workflow:** build an image, push it to ECR, reference that image from an ECS task definition, then run it as an ECS service on Fargate.
- **AWS networking:** VPCs, public/private subnets, security groups, ALB listeners/target groups, health checks, and the relationship between a service and its running tasks.
- **Service communication:** synchronous HTTP for request/response work and RabbitMQ for asynchronous events.
- **Application integrations:** MongoDB/Mongoose, Redis, Razorpay, ImageKit, email delivery, and a Socket.IO/LangGraph assistant.
- **Testing:** Jest/Supertest-style tests exist for auth, cart, order, and product. Several other package manifests still use a placeholder test script, so do not describe all eight services as having comprehensive test coverage.
- **Operational learning:** an ECS service definition can exist while it runs zero tasks; an ALB can remain billable while no application task is running; correct container health checks and service-to-service URLs matter for a live demo.

## Current implementation and deployment caveats to verify

These are observations from the checked-out code, not assumptions about the current AWS console:

1. **The workspace has eight service folders.** The seven in the original list omit `notification`.
2. **`seller-dashboard` has no Dockerfile in its folder.** Confirm how its current image was built before relying on a repeatable rebuild.
3. **Payment update event names do not match:** the payment service publishes `PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED`, while the seller-dashboard listener subscribes to `PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE`. Verify and fix the event contract before demonstrating that payment updates appear in the dashboard.
4. **Some service-to-service HTTP URLs are hard-coded to an ALB hostname in source.** Check that hostname, route rules, and service paths match the current AWS deployment. Prefer configuration/internal service discovery for a repeatable deployment; use HTTPS for public traffic.
5. **RabbitMQ connection helpers log connection failures but do not consistently fail startup clearly.** Confirm the broker is reachable and queues are functioning before demoing event-driven behavior.
6. **Deployment definitions are not present at the workspace root.** The checked-out project does not document or automate the AWS setup as infrastructure-as-code, so record the console settings and environment variables separately without putting secret values in documentation.
7. **Environment files exist in service folders.** They are excluded by the root `.gitignore` and service `.dockerignore` files; keep them that way. Use a managed secret store or secure task-definition secret references for AWS, and never paste secret values into a resume, shared prompt, screenshots, or source control.

Before an interview, test the exact deployed routes and integration flow with non-sensitive demo data. Be transparent about what is implemented, what is deployed, and what is still a known limitation.

## Resume wording

Use a truthful version and adjust the bracketed part to match your individual contribution:

**Marketplace Backend | Node.js, Express, MongoDB, RabbitMQ, Redis, Docker, AWS ECS/Fargate**

- Built a cohort marketplace backend composed of eight Express services for authentication, catalog, cart, orders, payments, seller views, notifications, and an AI shopping assistant.
- Implemented JWT-based authentication, product/cart/order APIs, Razorpay order and signature-verification flow, and asynchronous RabbitMQ events for email and seller-dashboard updates.
- Containerized services and deployed selected workloads using Amazon ECR, ECS on Fargate, a VPC, security groups, and an Application Load Balancer; managed task scaling to control demo costs.
- Added automated API tests for selected services and practiced debugging integration, health-check, networking, and deployment issues.
- **My contribution:** [name the services/features you personally implemented, tested, or deployed].

Only keep technologies and claims you can explain and personally substantiate. Do not claim all eight services were simultaneously running, production-grade, highly available, or fully tested unless you have evidence for those claims.

## Short interview explanation

“I worked on a cohort-built marketplace backend split into small Node.js services. It supports user accounts, products, carts, orders, and Razorpay payments. Services use HTTP where an immediate response is needed and RabbitMQ for notifications and seller-dashboard updates. We containerized selected services and deployed them on ECS Fargate with ECR and an ALB. I also learned to manage the demo environment carefully because idle AWS networking resources can still cost money.”

If asked what you personally did, replace “I worked on” with the specific services, features, tests, and AWS steps you personally completed. Avoid presenting the whole cohort’s work as individual work.

## Interview questions with concise, human answers

Each sample answer is under 50 words. Make it your own and keep it consistent with your actual contribution.

1. **What did you build?**  
   “It is a marketplace backend split into services for users, products, carts, orders, payments, seller data, notifications, and an AI shopping assistant. The goal was to keep responsibilities separate and let us practice service communication, containerization, and cloud deployment.”

2. **Why split it into services?**  
   “It gave each domain a clearer responsibility and let us build and deploy parts independently. The trade-off is more configuration and more failure points, especially around networking, shared contracts, observability, and local setup.”

3. **How do the services communicate?**  
   “The order and AI flows use HTTP when they need an immediate response from another service. RabbitMQ carries events such as user, product, order, and payment changes to notification and seller-dashboard consumers.”

4. **Walk me through checkout.**  
   “The order service reads the user’s cart and product details, checks stock, and creates a pending order. The payment service creates a Razorpay order. After checkout, it verifies the payment signature and publishes payment events.”

5. **How does authentication work?**  
   “Auth hashes passwords with bcrypt, signs a JWT, and sets it in an HTTP-only cookie. Protected routes validate the token, and Redis is used to blacklist tokens on logout. I would also review cookie and HTTPS settings for the target environment.”

6. **Why use RabbitMQ?**  
   “Email delivery and seller-dashboard synchronization do not need to block a user’s API response. A queue lets the producer publish an event and a consumer handle the work separately, though retries, idempotency, and monitoring still need careful design.”

7. **What does the seller dashboard do?**  
   “It consumes marketplace events and stores seller-facing copies of users, products, orders, and payments. That separates dashboard reads from the core service models, but event contracts must stay consistent.”

8. **How does the AI assistant work?**  
   “It accepts authenticated Socket.IO messages, sends the conversation to a LangGraph agent, and exposes tools for product search and adding products to the cart. The agent calls those tools through the marketplace APIs.”

9. **How did you deploy it?**  
   “We built Docker images, pushed images to ECR, defined ECS task definitions, and ran selected services with Fargate in a VPC. An ALB provided an entry point and routed requests to healthy targets.”

10. **What is the difference between an ECS service and a task?**  
    “A task is a running instance of a task definition. An ECS service maintains the configured desired number of tasks. If desired count is zero, the service can exist but it has no running application task.”

11. **What was a deployment challenge?**  
    “The hardest part was connecting several independently configured services: container ports, environment variables, health checks, security-group rules, and service URLs all had to agree. I learned to test each dependency rather than treat a successful image push as a successful deployment.”

12. **What did you learn about AWS cost?**  
    “Stopping Fargate tasks reduces compute charges, but it does not automatically remove every cost. Load balancers, NAT gateways, public IPv4 addresses, logs, storage, and managed databases or brokers may still incur charges.”

13. **What testing did you add?**  
    “There are API tests for auth, cart, order, and product behavior. I would describe coverage as selective, not complete, because some service manifests do not define real test suites yet.”

14. **How would you handle a RabbitMQ outage?**  
    “I would surface the dependency failure clearly, monitor queue and consumer health, and decide whether the API should fail or persist work for retry. I would add bounded retries, dead-letter handling, and idempotent consumers rather than silently losing events.”

15. **What would you improve next?**  
    “I would automate AWS provisioning, remove hard-coded service URLs, standardize health checks and secrets, add structured logs and metrics, align event names, and expand integration tests for checkout and payment events.”

16. **Is this production-ready?**  
    “It is a learning project and a demonstrable backend, not something I would label production-ready without more work. I would first close integration gaps, strengthen secrets and failure handling, add observability and broader tests, and document repeatable deployment.”

17. **Why Fargate instead of EC2 or EKS?**  
    “Fargate let us run containers without managing EC2 hosts or a Kubernetes control plane. For a small cohort demo, that reduced operational setup. The trade-off is paying for configured task runtime and having less low-level control.”

18. **What was your personal contribution?**  
    “My contribution was [specific service or feature]. I implemented [specific behavior], tested it with [test or manual flow], and helped deploy/debug [specific AWS component]. The other services were built collaboratively by the cohort.”

## AWS: what zero desired tasks does—and does not—mean

**Important:** setting ECS desired count to `0` means ECS should run zero tasks for that service. It does **not** mean the service is serving requests, nor does it automatically delete the ECS service, ALB, or other resources. A shared ALB URL will normally have no healthy application target (often returning an error such as 503) until tasks start and pass health checks.

Also, AWS Free Tier is generally about eligible usage and account-specific quotas/credits—not a universal “maximum of four services” rule. The number of ECS services is not itself the billing unit. Check your account’s current Free Tier/Billing pages and the pricing for the exact region and resources you created.

### Typical cost behavior while tasks are at zero

| Resource | Typical billing behavior when tasks are stopped |
|---|---|
| ECS cluster, service definition, task definition | Usually no direct hourly charge just for these control-plane definitions. |
| Fargate tasks | No task vCPU/memory runtime charge while no tasks are running; verify any attached storage or other resources separately. |
| Application Load Balancer | **Can continue to incur hourly load-balancer and capacity-unit charges even with zero healthy targets.** Keeping it for a convenient interview URL is not cost-free. |
| NAT Gateway | Can continue to incur hourly and data-processing charges while provisioned, even if application tasks are stopped. |
| Public IPv4 addresses | Can incur hourly charges depending on the address/resource and account terms. Check allocated/attached addresses and current billing. |
| ECR | Stored image data may be chargeable beyond applicable free allowance. |
| CloudWatch Logs | Stored logs and ingestion may be chargeable beyond applicable free allowance. |
| VPC, subnets, route tables, security groups | These definitions normally have no direct hourly charge by themselves; resources attached to them may charge. |
| Managed databases, cache, or message broker | May continue charging while provisioned even if ECS tasks are stopped. Check MongoDB/Redis/RabbitMQ hosting separately, including whether each is AWS-managed or an external provider. |
| Data transfer, snapshots, other resources | May incur charges depending on traffic and what was created. |

These are general patterns, not a guarantee about your account’s bill. The AWS Billing console and Cost Explorer are the source of truth.

### Cost-conscious checklist

1. Open **Billing and Cost Management → Bills / Cost Explorer** and inspect current-month charges by service and region. Also check the account’s Free Tier usage/credits and create a budget alert.
2. In ECS, confirm **running task count is actually zero** for every service you intend to pause. Desired count is a target; verify the current running count too.
3. If you want to keep the ALB for a quick demo, understand it can keep billing while idle. If avoiding that charge is the priority, delete the ALB and recreate it when needed; the old ALB URL will stop working.
4. Look for provisioned **NAT Gateways**, unused public IPv4 addresses, Elastic IPs, managed databases/caches/brokers, and other resources that remain after scaling tasks to zero. Delete only resources you have confirmed are not needed.
5. Retaining ECR images and task definitions can make redeployment faster, but image storage may still have a cost. Remove unused images carefully if storage charges matter.
6. Keep a checklist of image tags, task environment-variable *names*, ports, health-check paths, target groups, and security-group intent. Never put secret values in the checklist.
7. Before an interview, start only the services needed for the demo, confirm all tasks are healthy in ECS and the ALB target group, and run the Postman flow. Afterward, scale tasks back to zero and remove billable idle resources you do not need.
8. Do not delete a VPC or security group just because it is present: first check whether the ALB, tasks, or other resources still depend on it. VPC components themselves are generally not the main idle cost; gateways, addresses, and provisioned services often are.

If the ALB is removed and later recreated, note that the hostname can change. The hard-coded ALB URLs observed in parts of this code would also need to be updated or, preferably, replaced with configurable/internal service discovery before the full flow can be relied on.

## Safe project context to share with another AI

Copy this summary when you want project-specific help. Add only the code snippets needed for the question; do not paste `.env` files, tokens, credentials, private endpoints, or customer data.

> I am working on a cohort-built Node.js/Express marketplace backend. The workspace has eight services: `auth`, `product`, `cart`, `order`, `payment`, `notification`, `seller-dashboard`, and `ai-buddy`. Services use MongoDB/Mongoose; auth also uses Redis for token blacklisting. RabbitMQ sends asynchronous events to notification and seller-dashboard consumers. Payment uses Razorpay. Product images use ImageKit. AI Buddy uses Socket.IO and a LangGraph tool-calling agent with product-search and cart tools. Selected services have Dockerfiles and Jest tests; `seller-dashboard` currently has no Dockerfile. The project was deployed using ECR, ECS/Fargate, a VPC, security groups, and an ALB, but AWS desired task counts are currently set to zero for my demo/cost management. I want help with: [specific question]. Please distinguish observed code facts from assumptions, do not invent deployment status, and never request or expose secret values.

## Personalize before publishing

- Replace the personal-contribution placeholder with what you actually did.
- Remove tools or features you cannot explain confidently.
- Do not include AWS account IDs, private IPs, credentials, API keys, raw environment files, or unredacted console screenshots.
- Verify the exact AWS resource state and current bill before saying that the deployment costs nothing.
