module.exports = {
    apps: [{
        name: "sample-cluster-server",
        script: "app.js",
        wait_ready: true,
        kill_timeout : 3000,
        exec_mode: "cluster",
<<<<<<< HEAD
        instances: "2",
        // watch: true,
        instance_var: 'INSTANCE_ID',
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
=======
        env: {
            NODE_ENV: "development",
            watch: ".",
            instances: "2",
        },
        env_production: {
            NODE_ENV: "production",
            instances: "-1",
>>>>>>> 2258311 (first commit)
        }
    }]
};