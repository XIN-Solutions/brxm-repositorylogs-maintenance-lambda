const cron = require('node-cron');
const {runMaintenance} = require("./maintenance");

/**
 * Expression to run scheduled job with.
 */
const cronExpression = process.env.CRON ?? '0 0 * * *';

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
