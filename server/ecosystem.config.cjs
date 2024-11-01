module.exports = {
    apps: [{
        name: "sample-cluster-server",
        script: "./src/app.js",
        wait_ready: true,
        kill_timeout : 3000,
        exec_mode: "cluster",
        instances: "2",
        // watch: true,
        instance_var: 'INSTANCE_ID',
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
};