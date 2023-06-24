const cron = require('node-cron');
const {runMaintenance, completeConfiguration} = require("./maintenance");

/**
 * Expression to run scheduled job with.
 */
const cronExpression = process.env.CRON ?? '0 0 * * *';


/**
 * Make sure the configuration is complete.
 */
if (!completeConfiguration()) {
    throw new Error("Invalid configuration, make sure MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE and MYSQL_PASSWORD are set.");
}

console.log("[maintenance] Starting cron job for brXM maintenance tasks.")

/**
 * Start cron job
 */
cron.schedule(cronExpression, () => {

    console.log("[maintenance] about to start cron job.");

    runMaintenance()
        .then(() => console.log("Cron job ran"))
        .catch((err) => console.error("Cron job failed: ", err))
    ;

    console.log("[maintenance] finished.");

});
