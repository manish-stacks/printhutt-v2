module.exports = {
  apps: [
    {
      name: "printhutt",
      script: "npm",
      args: "start",
      cwd: "/root/printhutt-v2/frontend",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};