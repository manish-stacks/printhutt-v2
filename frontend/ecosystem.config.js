module.exports = {
  apps: [
    {
      name: "printhutt-client",
      script: "npm",
      args: "start",
      cwd: "/root/printhutt-v2/frontend",
      // ✅ FIX: cluster mode — CPU cores ke hisaab se instances
      // Single instance tha — yahi main performance bottleneck tha
      instances: "max",
      exec_mode: "cluster",
      // ✅ Memory leak se bachao — 512MB pe auto-restart
      max_memory_restart: "512M",
      // ✅ Graceful restart — connections drop na ho
      wait_ready: true,
      listen_timeout: 10000,
      kill_timeout: 5000,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // ✅ FIX: Internal API URL — NEXT_PUBLIC_ env cluster workers mein
        //         reliably forward nahi hoti SSR fetch ke liye
        INTERNAL_API_URL: "http://127.0.0.1:4000/api",
      },
    },
  ],
};