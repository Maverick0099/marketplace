const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookie = require("cookie");
const agent = require("../agent/agent");



async function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    path: "/api/socket/socket.io/",
  });

  io.use((socket, next) => {
    const cookies = socket.handshake.headers?.cookie;

    const { token } = cookies ? cookie.parse(cookies) : {};

    if (!token) {
      return next(new Error("Token not provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = decoded;
      socket.token = token;

      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected for user:", socket.user.id);

    socket.on("message", async (data) => {
      try {
        const agentResponse = await agent.invoke(
          {
            messages: [
              {
                role: "user",
                content: data,
              },
            ],
          },
          {
            metadata: {
              token: socket.token,
            },
          },
        );

        const lastMessage =
          agentResponse.messages[agentResponse.messages.length - 1];

        socket.emit("message", lastMessage.content);
      } catch (error) {
        console.error("Failed to process socket message:", error);

        if (error.status === 429) {
          socket.emit("message_error", {
            code: "AI_QUOTA_EXCEEDED",
            message:
              "The AI service has reached its request quota. Please try again later or check the Gemini API project quota and billing.",
          });
          return;
        }

        if (error.status === 503) {
          socket.emit("message_error", {
            code: "AI_SERVICE_UNAVAILABLE",
            message:
              "The AI service is temporarily unavailable due to high demand. Please try again shortly.",
          });
          return;
        }

        socket.emit("message_error", {
          code: "MESSAGE_PROCESSING_FAILED",
          message: "Unable to process your message. Please try again.",
        });
      }
    });
  });
}

module.exports = { initSocketServer };
