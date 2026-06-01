module.exports = {
  apps: [
    {
      name: "printhutt-api",
      script: "dist/server.js",
      cwd: "/root/printhutt-v2/backend",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "printhutt-worker",
      script: "dist/queues/worker.js",
      cwd: "/root/printhutt-v2/backend",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};