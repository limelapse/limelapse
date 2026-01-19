import { createServer } from "http";

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Hello from LimeLapse! 🍋‍🟩", time: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Health service running on port ${port}`);
});
