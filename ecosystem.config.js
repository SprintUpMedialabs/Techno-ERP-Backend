module.exports = {
    apps: [
        {
            name: "techno-uat",
            script: "dist/index.js",
            env: {
                NODE_ENV: "uat",
            },
        },
        {
            name: "techno-prod",
            script: "dist/index.js",
            env: {
                NODE_ENV: "production",
            },
        }
    ]
};
