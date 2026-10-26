# Marketplace Backend

A microservices-based e-commerce backend built with Node.js and Express.js. It provides APIs for authentication, product management, shopping carts, orders, payments, notifications, seller dashboard operations, and an AI-powered shopping assistant.

## Key Features

- **Authentication:** JWT-based authentication with HTTP-only cookies and Redis support.
- **Product Management:** Product APIs and image uploads using ImageKit.
- **Cart and Orders:** Shopping cart operations and order management.
- **Payments:** Razorpay order creation and payment signature verification.
- **Asynchronous Messaging:** RabbitMQ for event-driven notifications and seller dashboard updates.
- **AI Shopping Assistant:** Gemini, LangChain, LangGraph, and Socket.IO.
- **Cloud Deployment:** Docker containers deployed to selected AWS ECS Fargate services using Amazon ECR and an Application Load Balancer.

## Services

| Service | Responsibility | Main integrations |
|---|---|---|
| `auth` | Registration, login, authentication, addresses, and logout | MongoDB, Redis, RabbitMQ |
| `product` | Product APIs, seller product listing, and image uploads | MongoDB, ImageKit, RabbitMQ |
| `cart` | Read and update an authenticated user's cart | MongoDB |
| `order` | Create, read, list, and cancel orders; update shipping addresses | MongoDB, HTTP calls to cart/product, RabbitMQ |
| `payment` | Create Razorpay orders and verify payment signatures | MongoDB, Razorpay, RabbitMQ |
| `notification` | Consume events and send email notifications | RabbitMQ, Nodemailer/Gmail |
| `seller-dashboard` | Maintain seller-facing copies/views of marketplace data | MongoDB, RabbitMQ |
| `ai-buddy` | Authenticated Socket.IO assistant with product-search and cart tools | Gemini, LangChain/LangGraph, HTTP calls to product/cart |

## Architecture and Request Flow

1. The client registers or logs in through `auth`. The service uses JWT-based authentication and an HTTP-only cookie; protected routes validate the token.
2. Sellers manage products through `product`. Product images are uploaded to ImageKit, and marketplace events may be published.
3. Users add products to `cart`.
4. `order` retrieves cart and product data over HTTP, checks stock, and creates an order.
5. `payment` creates a Razorpay order and verifies the payment signature after checkout.
6. RabbitMQ delivers events to consumers such as `notification` and `seller-dashboard`, allowing email and dashboard updates to happen asynchronously.
7. `ai-buddy` accepts authenticated Socket.IO messages and can call tools for product search and adding products to the cart.

This describes code paths identified in the project notes. It does not guarantee that every integration has been tested end-to-end in the current AWS environment.

## Technology Stack

- **Runtime/API:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT, HTTP-only cookies, Redis token blacklist on logout
- **Messaging:** RabbitMQ
- **Payments:** Razorpay order creation and payment-signature verification
- **Product images:** ImageKit
- **AI assistant:** Gemini, LangChain/LangGraph, Socket.IO
- **Containers:** Docker
- **AWS deployment:** Amazon ECR, Amazon ECS with AWS Fargate, VPC, subnets, security groups, Application Load Balancer (ALB), target groups, and health checks
- **Testing:** Jest/Supertest-style API tests exist for selected services; test coverage is not uniform across every service

## Local Development

Each service has its own package manifest and configuration. Review that service's package scripts and required environment-variable names before starting it.

1. Install a Node.js version supported by the service.
2. Install dependencies in the service directory using `npm install`.
3. Configure required environment variables in a local, untracked `.env` file.
4. Start required dependencies such as MongoDB, Redis, and RabbitMQ, along with any required external integrations.
5. Start the service using the script defined in its `package.json`.
6. Test routes with Postman or the available automated tests.

Do not put secret values in this README. Keep `.env` files out of source control and use placeholders in documentation.

## AWS Deployment Workflow

The deployment workflow used for selected services is:

1. Build a Docker image for the service.
2. Tag the image and push it to the service's Amazon ECR repository.
3. Create or update an ECS task definition with the image, container port, CPU/memory, environment configuration, logging, and health-check settings as applicable.
4. Run an ECS service using AWS Fargate in the selected VPC, subnets, and security-group configuration.
5. Register the service with the appropriate ALB target group when it needs to receive routed HTTP traffic.
6. Verify ECS task health, target-group health, application logs, and real API requests.
7. When a demo is finished, scale tasks down and review other billable resources separately.

Pushing an image to ECR confirms only that the image was uploaded. It does not prove that the container starts, connects to dependencies, passes its health check, or serves the expected API route.

## AWS Cost Note

Setting an ECS service's desired task count to `0` tells ECS to maintain zero running tasks. It does **not** delete the service or all related resources. An ALB, NAT Gateway, public IPv4 addresses, log ingestion/storage, ECR image storage, and external or managed databases/message brokers may still incur charges.

AWS Free Tier is not a universal rule that permits exactly four ECS services. Eligibility depends on the account, service, region, current Free Tier terms or credits, and actual usage. Check **Billing and Cost Management → Bills / Cost Explorer** and configure a budget alert.

If minimizing idle costs is the priority, consider deleting the ALB and other unneeded billable resources only after checking their dependencies. The ALB URL will stop working if the ALB is deleted and may change when it is recreated.

## Items to Verify Before a Full Demo

- The `seller-dashboard` folder did not have a Dockerfile in the reviewed workspace. Confirm how its image is built before relying on a repeatable rebuild.
- The payment publisher and seller-dashboard consumer event names differed in the reviewed code: `PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATED` versus `PAYMENT_SELLER_DASHBOARD.PAYMENT_UPDATE`. Align and test the event contract.
- Some service-to-service HTTP URLs are hard-coded to an ALB hostname. Verify the hostname and paths before the demo; prefer environment-based configuration or internal service discovery.
- RabbitMQ connection helpers may log failures without consistently stopping startup. Verify broker connectivity, queue bindings, and consumer health.
- Deployment configuration is not fully automated as infrastructure-as-code in the reviewed workspace. Document resource settings without recording secret values.
- Verify required environment variables, container ports, health-check paths, target-group registration, and security-group rules.
- Test the exact deployed endpoints and integration flow with non-sensitive demo data.

## Security Practices

- Never commit `.env` files, passwords, API keys, JWT secrets, payment secrets, or cloud credentials.
- Use AWS Secrets Manager or secure ECS task-definition secret references where appropriate.
- Limit inbound security-group rules to required sources and ports.
- Use HTTPS for public application traffic.
- Avoid exposing databases, Redis, or RabbitMQ directly to the public internet.
- Rotate any secret that has accidentally been committed or shared.

## Contribution and Attribution

Describe your own contribution accurately by identifying the services, features, tests, and AWS tasks you personally implemented. Do not claim that all services were running simultaneously, fully tested, highly available, or production-ready unless you have verified evidence for those claims.

## Demo Checklist

- [ ] Confirm which ECS services need to run for the demo.
- [ ] Set desired task counts for only the required services.
- [ ] Wait until ECS tasks are running and ALB target-group targets are healthy.
- [ ] Check logs for startup errors and dependency failures.
- [ ] Test a simple API route in Postman.
- [ ] Test authentication and one supported business flow if its dependencies are available.
- [ ] Confirm external integrations and RabbitMQ consumers work before demonstrating them.
- [ ] After the interview, scale tasks back down and inspect AWS Billing for idle resource charges.
