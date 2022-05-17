%.PHONY: zip deploy

zip:
	@echo "Building application"
	rm target -Rf
	zip -r lambda-bundle.zip . -x ".git/*"
	mkdir target
	mv lambda-bundle.zip target/


deploy: zip
	@echo "DANGER: Deploying to Production environment, are you sure? (CTRL-c to exit)"
	@read _dontcare_
	aws lambda update-function-code \
		--function-name "${ARN}" \
		--zip fileb://./target/lambda-bundle.zip \
		--region ap-southeast-2 \
		--publish


