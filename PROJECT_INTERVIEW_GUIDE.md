# Marketplace Backend --- Project Summary and Interview Guide

## 1. Executive summary

This is a cohort-built Node.js/Express marketplace backend organized
into eight service folders: `auth`, `product`, `cart`, `order`,
`payment`, `notification`, `seller-dashboard`, and `ai-buddy`. It covers
authentication, product catalog, cart and order operations, Razorpay
payment verification, email notifications, seller-facing data, and an AI
shopping assistant.

The project uses HTTP for request/response interactions and RabbitMQ for
asynchronous events. Selected services were containerized and deployed
using Amazon ECR and ECS on AWS Fargate, with VPC networking, security
groups, an Application Load Balancer, and target groups. The current
demo setup has selected services available in AWS, while task desired
counts may be zero to control compute usage.

## 2. Service map

  -----------------------------------------------------------------------
  Service                             What it does
  ----------------------------------- -----------------------------------
  `auth`                              Registration/login, JWT/cookie
                                      authentication, addresses, logout;
                                      MongoDB, Redis and RabbitMQ

  `product`                           Product APIs, seller listings,
                                      image upload; MongoDB and ImageKit

  `cart`                              Authenticated cart operations;
                                      MongoDB

  `order`                             Order creation, reading,
                                      cancellation and shipping address
                                      updates; calls cart/product over
                                      HTTP

  `payment`                           Razorpay order creation and
                                      signature verification

  `notification`                      RabbitMQ consumers that send email
                                      notifications

  `seller-dashboard`                  Consumes events and stores
                                      seller-facing copies/views of
                                      marketplace data

  `ai-buddy`                          Authenticated Socket.IO assistant;
                                      LangGraph tools call product search
                                      and cart APIs
  -----------------------------------------------------------------------

## 3. End-to-end workflow

1.  A user registers or logs in through Auth. Auth validates credentials
    and issues a JWT in an HTTP-only cookie.
2.  Product APIs manage catalogue information and product images.
3.  The user adds items to the Cart service.
4.  Order calls Cart and Product over HTTP, checks relevant data/stock,
    and creates an order.
5.  Payment creates a Razorpay order; the service verifies the payment
    signature after checkout.
6.  Services publish events to RabbitMQ. Notification consumes events to
    send emails; Seller Dashboard consumes events to update
    seller-facing data.
7.  AI Buddy receives authenticated Socket.IO messages and may call
    tools for searching products or adding items to the cart.

HTTP is useful when a caller needs an immediate response. RabbitMQ is
useful when work can be processed asynchronously and should not block
the original API response.

## 4. AWS deployment workflow learned

**Image → ECR → Task Definition → ECS Service → Fargate Task → Target
Group → ALB**

-   **Docker image:** Packages the service and its runtime dependencies.
-   **ECR repository:** Stores the image.
-   **ECS task definition:** A blueprint describing image, CPU/memory,
    ports, environment configuration, logging and other runtime
    settings.
-   **ECS task:** A running instance of a task definition.
-   **ECS service:** Maintains the configured desired number of tasks.
-   **Fargate:** Runs containers without requiring us to manage EC2
    worker servers.
-   **VPC and subnets:** Define the network in which tasks and load
    balancer resources run.
-   **Security group:** Stateful virtual firewall controlling permitted
    inbound and outbound traffic.
-   **ALB listener:** Accepts incoming traffic on a configured
    protocol/port and applies routing rules.
-   **Target group:** Tracks backend targets and their health checks so
    the ALB can route to healthy targets.

### What we learned during debugging

-   A successful image push does not prove an application is running
    correctly.
-   ECS task startup, security-group rules, container ports, environment
    variables, health checks and target-group health all need
    verification.
-   A service can exist with desired count `0`, but it has no running
    task to serve requests.
-   If no healthy targets are registered, an ALB request can fail even
    when the ALB itself exists.
-   Service URLs and route paths must match exactly. In one AWS
    debugging case, `/api/products?q=nike` returned
    `Cannot GET /api/products`, while `/api/products/?q=nike` returned
    `200 OK`. The search tool was updated to use the trailing slash.
    This was an application route/path mismatch, not proof of an AWS
    network failure.
-   RabbitMQ producers and consumers must use exactly matching event
    names and queue/binding contracts.
-   Hard-coded ALB hostnames make redeployment fragile; configuration or
    internal service discovery is a better long-term approach.
-   AWS costs can continue when application tasks are stopped because
    other provisioned resources may remain active.

## 5. Known limitations to be honest about

The checked-out project notes identify several items to verify before
claiming a complete production deployment:

1.  Eight service folders exist, but only selected services were
    deployed; do not imply all eight run together in AWS.
2.  `seller-dashboard` did not have a Dockerfile in the reviewed
    workspace; confirm the image build process.
3.  A payment event name differed between publisher and consumer:
    `PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED` versus
    `PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE`.
4.  Some internal HTTP URLs are hard-coded to an ALB hostname.
5.  RabbitMQ connection failures may not always fail service startup
    clearly.
6.  Tests exist for selected services, but test coverage is not uniform.
7.  The reviewed workspace does not include a complete
    infrastructure-as-code setup for reproducing the AWS environment.

Describe these as known items to check or improve, not as things already
fixed unless you have actually fixed and tested them.

## 6. Resume version

**Marketplace Backend \| Node.js, Express, MongoDB, RabbitMQ, Redis,
Docker, AWS ECS/Fargate**

-   Worked on a cohort-built marketplace backend organized into
    independent services for authentication, products, carts, orders,
    payments, notifications, seller data, and AI shopping assistance.
-   Implemented or contributed to \[name the exact services/features you
    personally built\], including \[specific API, event flow, or
    integration\].
-   Containerized selected services and deployed them to AWS using
    Amazon ECR and ECS Fargate, with VPC networking, security groups, an
    Application Load Balancer and target groups.
-   Debugged deployment and integration issues involving health checks,
    environment configuration, service URLs, and API route mismatches.
-   Used RabbitMQ for asynchronous event-driven workflows and \[name the
    tests you personally wrote or ran\].

**Important:** Replace bracketed text with your actual contribution.
Remove any bullet you cannot personally explain or substantiate.

## 7. Interview introduction (about 50 words)

"I worked on a cohort-built marketplace backend using Node.js and
Express, split into services for authentication, products, carts,
orders, payments, notifications, and AI shopping assistance. We used
MongoDB and RabbitMQ, containerized selected services with Docker, and
deployed them on AWS ECS Fargate. I also learned to troubleshoot API
routing, health checks, networking, and cloud costs."

If asked what *you* personally did, follow this with two or three
concrete examples of your own work.

## 8. Interview questions and human answers

Keep answers truthful and adapt them to the work you personally did.
Each sample answer is under 50 words.

### Q1. What is the project?

It is a marketplace backend split into services for users, products,
carts, orders, payments, seller data, notifications, and an AI shopping
assistant. The goal was to separate responsibilities and learn service
communication, containerization, and cloud deployment.

### Q2. Why microservices instead of one monolith?

Each service has a clearer responsibility and can be developed or
deployed separately. The trade-off is more configuration, networking,
monitoring, and failure points. For a small system, a monolith can be
simpler, so microservices should solve a real organizational or scaling
need.

### Q3. How do services communicate?

They use HTTP when a caller needs an immediate response, such as the
order service requesting cart or product data. RabbitMQ carries events
for asynchronous work, such as email notifications and seller-dashboard
updates.

### Q4. What is asynchronous communication?

The producer sends a message and can continue without waiting for the
consumer to finish processing it. RabbitMQ lets notification work happen
separately from the original request, although reliable retries,
monitoring, and duplicate handling still matter.

### Q5. Why RabbitMQ?

It decouples producers from consumers and helps background work happen
independently. If an order event triggers an email, the order API does
not need to wait for the email to send. Consumers still need error
handling, retries, and idempotency.

### Q6. What is the difference between a task definition, task, and service in ECS?

A task definition is the configuration blueprint. A task is a running
instance of that blueprint. An ECS service maintains the desired number
of task instances and can replace failed tasks.

### Q7. What is AWS Fargate?

Fargate runs containers without requiring us to manage the underlying
EC2 hosts. We define the task's image and resources, and AWS manages the
server infrastructure. We still need to configure networking,
permissions, logs, and application health.

### Q8. What is ECR?

Amazon ECR is a container image registry. We push our built Docker
images there, and ECS task definitions reference those images when
starting tasks.

### Q9. What is a VPC?

A VPC is a logically isolated network in AWS. It contains subnets, route
tables and network controls that determine where resources run and how
they communicate.

### Q10. What is a subnet?

A subnet is a range of IP addresses inside a VPC associated with an
Availability Zone. Public or private behavior depends on routing and
resource configuration, not merely the subnet's name.

### Q11. What is a security group?

It is a stateful virtual firewall attached to resources such as load
balancers and ECS task network interfaces. Rules should permit only the
traffic required between the client, ALB, tasks and dependencies.

### Q12. Why use an ALB?

An Application Load Balancer provides an HTTP/HTTPS entry point and
routes requests to registered targets using listener and routing rules.
It checks target health and sends traffic to healthy targets.

### Q13. What is a target group?

A target group identifies the backend targets and defines health-check
settings. The ALB uses target-group health to decide where to route
requests.

### Q14. Why might an ECS task fail to start or become healthy?

Possible causes include a bad image or command, missing environment
variables, an incorrect container port, dependency connectivity,
insufficient resources, or a failing health-check path. I would inspect
ECS stopped-task reasons, service events, target health, and CloudWatch
logs.

### Q15. What was a real deployment issue you debugged?

The AI Buddy's product-search tool called `/api/products?q=nike` on AWS
and received `Cannot GET /api/products`. Testing showed that
`/api/products/?q=nike` returned `200 OK`, so the route path was
mismatched. We updated the tool to use the trailing slash and retested
the endpoint.

### Q16. Why could an API work locally but fail on AWS?

Local and deployed environments can differ in route paths, environment
variables, DNS, network permissions, container ports, secrets, and
dependency URLs. I compare the exact request and logs in both
environments instead of assuming the cloud network is always the cause.

### Q17. What happens when desired task count is zero?

The ECS service aims to run zero tasks. The service and task definition
can remain, but no application task is available to serve requests. An
ALB may remain active but have no healthy targets.

### Q18. Does desired count zero make AWS free?

No. It removes Fargate task runtime while no tasks are running, but the
ALB, NAT Gateway, public IPv4 addresses, logs, ECR storage, and
provisioned databases or brokers may still incur charges.

### Q19. How does authentication work?

The auth service verifies credentials, hashes passwords with bcrypt,
issues a JWT in an HTTP-only cookie, and validates tokens on protected
routes. Redis supports token blacklisting on logout. Cookie settings and
HTTPS must be appropriate for the deployed environment.

### Q20. How does payment work?

The payment service creates a Razorpay order and verifies the payment
signature returned after checkout. Payment status and event publication
must be handled carefully; a client-side success message alone is not
sufficient proof of payment.

### Q21. How does the AI Buddy work?

It receives authenticated Socket.IO messages and uses a LangGraph agent
with tools for product search and adding products to the cart. Those
tools call marketplace APIs, so correct endpoints and deployed
environment configuration are essential.

### Q22. How would you handle RabbitMQ being unavailable?

I would make the failure visible in logs and health checks, decide
whether the API should fail or persist work for retry, and add bounded
retries, dead-letter handling, and idempotent consumers. I would also
monitor queue depth and consumer health.

### Q23. What would you improve next?

I would align event names, replace hard-coded service URLs, standardize
health checks and secret management, automate AWS provisioning, add
clearer startup failures and observability, and expand end-to-end tests
for checkout and payment events.

### Q24. Is it production-ready?

I would describe it as a learning and demonstration project, not claim
production readiness without more validation. I would first address
integration gaps, secret handling, failure recovery, observability,
deployment repeatability, and broader automated testing.

### Q25. What was your individual contribution?

"My contribution was \[service or feature\]. I implemented \[specific
behavior\], verified it using \[tests or Postman requests\], and helped
deploy or troubleshoot \[specific AWS component\]. The broader
marketplace was built collaboratively by the cohort."

## 9. AWS cost checklist before and after interviews

### Before the demo

-   Check **Billing and Cost Management → Bills / Cost Explorer** for
    current charges and region.
-   Check Free Tier eligibility, credits, and usage; set a budget alert.
-   Confirm which services are required and start only those tasks.
-   Verify tasks reach `RUNNING` and target-group targets become
    healthy.
-   Test the actual ALB endpoint and required Postman requests.
-   Check that the required databases, RabbitMQ broker, external APIs,
    and secrets are reachable.

### After the demo

-   Set the required ECS services' desired counts back to `0` and verify
    running counts are zero.
-   Decide whether the ALB is worth keeping. It can continue to incur
    hourly and capacity-related charges even when no tasks are healthy.
-   Inspect NAT Gateways, public IPv4 addresses, ECR image storage,
    CloudWatch Logs, snapshots, and provisioned
    databases/caches/brokers.
-   Delete resources only after checking dependencies. VPC, subnet,
    route-table and security-group definitions usually have no direct
    hourly charge by themselves.
-   Remember that deleting an ALB can change the endpoint when you
    recreate it. Hard-coded URLs may then need updates.

There is no universal AWS rule that only four ECS services can exist on
Free Tier. The actual cost depends on eligible usage, region, account
terms, resource configuration and runtime. Check the live Billing
console rather than relying on a fixed service count.

## 10. Demo runbook

1.  Decide which endpoints and integrations you will demonstrate.
2.  Start the minimum set of dependent ECS services.
3.  Confirm task status, service events, logs and ALB target health.
4.  Run a simple health or API request in Postman.
5.  Demonstrate one supported flow, such as product search or an
    authenticated endpoint.
6.  Only demonstrate checkout, RabbitMQ notifications, seller-dashboard
    updates, or AI cart actions if their dependencies have been
    verified.
7.  Scale down tasks after the interview and review remaining billable
    resources.

## 11. Final preparation checklist

-   [ ] I can explain every service and its responsibility.
-   [ ] I can draw the request flow and explain HTTP versus RabbitMQ.
-   [ ] I can explain ECR → task definition → ECS service/task → Fargate
    → target group → ALB.
-   [ ] I can explain VPC, subnet, route table, security group, listener
    and health check.
-   [ ] I can describe one real bug, how I isolated it, and how I
    verified the fix.
-   [ ] I know exactly which services are deployed and which are
    stopped.
-   [ ] I know my personal contribution and can distinguish it from
    cohort work.
-   [ ] I have checked current AWS charges and know which resources
    remain.
-   [ ] I have removed secrets and private infrastructure details from
    public documentation.
