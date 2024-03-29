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

const fs = require('fs');
const db = require('mysql-promise')();

/**
 * @return {boolean} true when all required environment variables are set.
 */
function completeConfiguration() {
    const envVars = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_DATABASE'];

    for (const envName of envVars) {
        if (!process.env[envName]) {
            return false;
        }
    }

    return true;
}


async function removeOldRevisions(db) {
    console.log("Removing old journal revisions from the database.");
    await db.query(`DELETE FROM REPOSITORY_JOURNAL WHERE REVISION_ID < ANY (SELECT min(REVISION_ID) FROM REPOSITORY_LOCAL_REVISIONS)`)
    console.log(" .. done!");
}

async function optimiseRepositoryJournal(db) {
    console.log("Optimising the Repository Journal");
    await db.query(`OPTIMIZE TABLE REPOSITORY_JOURNAL`);
    console.log(" .. done!");
}


async function optimiseDatastore(db) {
    console.log("Optimising the Datastore Table (get rid of orphaned binaries)");
    await db.query(`OPTIMIZE TABLE DATASTORE`);
    console.log(" .. done!");
}


async function outputTableSizes(db, dbName) {
    const query = `
        SELECT  
            TABLE_NAME as TableName,   
            ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024) AS TableSize
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = "${dbName}"
        ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
    `;

    const [rows, output] = await db.query(query);
    const tableMap = {};
    for (const row of rows) {
        tableMap[row.TableName] = `${row.TableSize} mb`;
    }
    return tableMap;
}

/**
 * The main handler that is invoked when the scheduled event hits the lambda.
 *
 * @param event
 * @returns {Promise<string>}
 */
async function runMaintenance() {

    if (!completeConfiguration()) {
        throw new Error("Invalid configuration, make sure MYSQL_HOST, MYSQL_USER, MYSQL_DATABASE and MYSQL_PASSWORD are set.");
    }

    db.configure({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        timeout: 5 * 60 * 1000, /* 5 minutes */
        ssl: process.env.MYSQL_CERT_PATH ? {
            ca: fs.readFileSync(process.env.MYSQL_CERT_PATH)
        } : undefined
    });

    try {

        console.log("Connected to database");

        // make sure we can query at all
        await db.query("SELECT 1");

        // get sizes of tables before clean up starts
        const originalTableSizes = await outputTableSizes(db, process.env.MYSQL_DATABASE);
        console.log("Original Table sizes:", JSON.stringify(originalTableSizes, null, 4));

        // do clean up tasks
        await removeOldRevisions(db);
        await optimiseRepositoryJournal(db);
        // await optimiseDatastore(db);

        // get new sizes of tables after clean up complete.
        const newTableSizes = await outputTableSizes(db, process.env.MYSQL_DATABASE);
        console.log("Completed Journal Maintenance.");
        console.log("New table sizes:", JSON.stringify(newTableSizes, null, 4));

        return "Completed brXM Maintenance Task";
    }
    catch (err) {
        console.error("Something went wrong trying to clean up the repository, caused by: ", err);
    }
    finally {
        console.log("Closing database connection.");
    }
    db.end();
}

module.exports = {
    completeConfiguration,
    runMaintenance
}