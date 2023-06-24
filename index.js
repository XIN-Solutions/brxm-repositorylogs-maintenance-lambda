/*
     ____  ____  __  ____  __       _  ____ ____    __  __       _       _
    | __ )|  _ \ \ \/ /  \/  |     | |/ ___|  _ \  |  \/  | __ _(_)_ __ | |_ ___ _ __   __ _ _ __   ___ ___
    |  _ \| |_) | \  /| |\/| |  _  | | |   | |_) | | |\/| |/ _` | | '_ \| __/ _ \ '_ \ / _` | '_ \ / __/ _ \
    | |_) |  _ <  /  \| |  | | | |_| | |___|  _ <  | |  | | (_| | | | | | ||  __/ | | | (_| | | | | (_|  __/
    |____/|_| \_\/_/\_\_|  |_|  \___/ \____|_| \_\ |_|  |_|\__,_|_|_| |_|\__\___|_| |_|\__,_|_| |_|\___\___|

    Purpose:

        To execute a number of commands that help with the maintenance of the JCR repository associated
        with a Bloomreach XM instance. It will optimise certain tables and truncate JCR logs to make sure
        the database is kept in check.

 */
const {runMaintenance} = require("./maintenance");

/**
 * The main handler that is invoked when the scheduled event hits the lambda.
 *
 * @param event
 * @returns {Promise<string>}
 */
exports.handler = async () => {

    try {
        await runMaintenance();
    }
    catch (err) {
        console.log("Couldn't finish the maintenance, caused by:", err);
    }

    console.log("Completed.");
    process.exit(0);
}
