import https from "node:https";
import http from "node:http";
import net from "node:net";
import { readFile } from "node:fs/promises";

const port = Number(process.env.HTTPS_PORT || 4174);
const targetPort = Number(process.env.PORT || 4173);
const cert = {
  key: await readFile(new URL("./.cert/dev-key.pem", import.meta.url)),
  cert: await readFile(new URL("./.cert/dev-cert.pem", import.meta.url))
};

const server = https.createServer(cert, (req, res) => {
  const proxy = http.request({
    hostname: "127.0.0.1",
    port: targetPort,
    method: req.method,
    path: req.url,
    headers: { ...req.headers, host: `127.0.0.1:${targetPort}` }
  }, upstream => {
    res.writeHead(upstream.statusCode || 502, upstream.headers);
    upstream.pipe(res);
  });
  proxy.on("error", () => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end("本地 H5 服务尚未启动");
  });
  req.pipe(proxy);
});

server.on("upgrade", (req, socket, head) => {
  const upstream = net.connect(targetPort, "127.0.0.1", () => {
    const headers = Object.entries(req.headers)
      .map(([name, value]) => `${name}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join("\r\n");
    upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers}\r\n\r\n`);
    if (head?.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
});

server.listen(port, "0.0.0.0", () => {
  console.log(`本机 HTTPS 测试地址：https://10.10.19.142:${port}`);
});
