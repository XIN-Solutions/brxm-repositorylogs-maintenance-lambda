# Repository Maintenance Lambda

This lambda code will help you clean your MySQL repository journal tables periodically as outlined as being required in 
the documentation here: 

* https://xmdocumentation.bloomreach.com/library/enterprise/installation-and-configuration/repository-maintenance.html

To run the lambda make sure your VPC has been configured so that RDS can accept incoming connections from your Lambda. 

The lambda will require the following environment variables:

* `MYSQL_HOST`: the host at which the Bloomreach XM instance is stored
* `MYSQL_DATABASE`: the database name of the instance
* `MYSQL_USER`: the user to use for logging in
* `MYSQL_PASSWORD`: the password to use to login. 

Then setup an Cloudwatch Eventbridge to the Lambda so it is invoked daily.

A cron statement could look like this if you wish to run it daily at 0:00 UTC

    cron(0 0 * * ? *)


It will execute the following queries:


    DELETE FROM REPOSITORY_JOURNAL WHERE REVISION_ID < ANY (SELECT min(REVISION_ID)
    FROM REPOSITORY_LOCAL_REVISIONS);

    OPTIMIZE TABLE REPOSITORY_JOURNAL;


## Deploy

To deploy the Lambda you could ZIP and deploy yourself, or use the Makefile by running:

    .. make sure your AWS profile is correct ..
    $ export ARN=<arn of your lambda>
    $ make deploy


