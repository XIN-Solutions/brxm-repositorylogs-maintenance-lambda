(async () => {
    const lambda = require('../index.js');
    await lambda.handler(null);
})()
.then(() => console.log("Done"))
.catch((err) => console.error("ERROR: ", err))
;
