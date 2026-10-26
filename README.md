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

| Service            | Responsibility                                                       | Main integrations                                       |
| ------------------ | -------------------------------------------------------------------- | ------------------------------------------------------- |
| `auth`             | Registration, login, authentication, addresses, and logout           | MongoDB, Redis, RabbitMQ                                |
| `product`          | Product APIs, seller product listing, and image uploads              | MongoDB, ImageKit, RabbitMQ                             |
| `cart`             | Read and update an authenticated user's cart                         | MongoDB                                                 |
| `order`            | Create, read, list, and cancel orders; update shipping addresses     | MongoDB, HTTP calls to cart/product, RabbitMQ           |
| `payment`          | Create Razorpay orders and verify payment signatures                 | MongoDB, Razorpay, RabbitMQ                             |
| `notification`     | Consume events and send email notifications                          | RabbitMQ, Nodemailer/Gmail                              |
| `seller-dashboard` | Maintain seller-facing copies/views of marketplace data              | MongoDB, RabbitMQ                                       |
| `ai-buddy`         | Authenticated Socket.IO assistant with product-search and cart tools | Gemini, LangChain/LangGraph, HTTP calls to product/cart |

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
