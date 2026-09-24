module.exports = {
  apps: [
    {
      name: "printhutt-api",
      script: "dist/server.js",
      cwd: "/root/printhutt-v2/backend",
      // ✅ FIX: cluster mode — 2 instances
      // Worker alag process hai isliye API ke liye 2 enough hai
      // Max karo to worker ke saath Redis/MongoDB connections explode karenge
      instances: 2,
      exec_mode: "cluster",
      max_memory_restart: "400M",
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "printhutt-worker",
      script: "dist/queues/worker.js",
      cwd: "/root/printhutt-v2/backend",
      // ✅ Worker SIRF 1 instance — fork mode
      // BullMQ concurrency internally handle karta hai
      // Multiple worker instances = duplicate cron jobs fire honge
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};