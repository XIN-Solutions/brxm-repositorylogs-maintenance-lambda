# Bloomreach XM Repository Maintenance Lambda

This lambda code will help you clean your MySQL repository journal tables periodically as outlined as being required in 
the documentation here: 

* https://xmdocumentation.bloomreach.com/library/enterprise/installation-and-configuration/repository-maintenance.html

To run the lambda make sure your VPC has been configured so that RDS can accept incoming connections from your Lambda. 

The lambda will require the following environment variables:

* `MYSQL_HOST`: the host at which the Bloomreach XM instance is stored
* `MYSQL_DATABASE`: the database name of the instance
* `MYSQL_USER`: the user to use for logging in
* `MYSQL_PASSWORD`: the password to use to log in. 
* `SNS_ARN`: optional to send notification information

Then configure a Cloudwatch Eventbridge to the Lambda, so it is invoked daily.

A cron statement could look like this if you wish to run it daily at 0:00 UTC

    cron(0 0 * * ? *)

It will execute the following queries:


    DELETE FROM REPOSITORY_JOURNAL WHERE REVISION_ID < ANY (SELECT min(REVISION_ID)
    FROM REPOSITORY_LOCAL_REVISIONS);

    OPTIMIZE TABLE REPOSITORY_JOURNAL;
    OPTIMIZE TABLE DATASTORE;


## Deploy

To deploy the Lambda you could ZIP and deploy yourself, or use the `Makefile` by running:

    .. make sure your AWS profile is correct ..
    $ export ARN=<arn of your lambda>
    $ make deploy


## Use Docker Image

Use the `xinsolutions/bloomreach-db-maintenance` image, it requires the following environment variables:

* `CRON`: can set this up to run the janitor periodically
* `MYSQL_HOST`: the host at which the Bloomreach XM instance is stored
* `MYSQL_DATABASE`: the database name of the instance
* `MYSQL_USER`: the user to use for logging in
* `MYSQL_PASSWORD`: the password to use to log in.

If you want to run it from the CLI:

    docker run \
            --env CRON=0 0 * * * \
            --env MYSQL_HOST=localhost --env MYSQL_USER=root \
            --env MYSQL_DATABASE=brxm --env MYSQL_PASSWORD=test1234 \
            --name brxm_maintenance \
            xinsolutions/bloomreach-db-maintenance:latest

You could add it to your `docker-compose.yml` like this:
    
    version: '3'
    services:
    
      mysql:
        image: xinsolutions/bloomreach-xinmods-mysql
        stdin_open: true
        tty: true
        restart: always
        environment:
          MYSQL_ALLOW_EMPTY_PASSWORD: 'yes'
    
        volumes:
          - mysql-data:/var/lib/mysql
    
    
      brxm:
        image: xinsolutions/bloomreach-xinmods-cms
    
        stdin_open: true
        tty: true
        restart: always
    
        environment:
          - MYSQL_HOST=mysql
          - MYSQL_DATABASE=bloomreach
          - MYSQL_PORT=3306
          - MYSQL_USERNAME=root
          - MYSQL_PASSWORD=
          - BRXM_CMS_HOST=http://bloomreach.local
    
        volumes:
          - bloomreach-repo:/var/lib/hippostorage
    
        links:
          - 'mysql'

      maintenance:
        image: xinsolutions/bloomreach-db-maintenance
    
        stdin_open: true
        tty: true
        restart: always
    
        environment:
          - CRON=0 0 * * * 
          - MYSQL_HOST=mysql
          - MYSQL_DATABASE=bloomreach
          - MYSQL_PORT=3306
          - MYSQL_USERNAME=root
          - MYSQL_PASSWORD=
    
        links:
          - 'mysql'

    
    volumes:
      bloomreach-repo:
      mysql-data: