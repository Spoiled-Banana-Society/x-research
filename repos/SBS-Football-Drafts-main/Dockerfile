FROM golang:1.20-alpine

ENV GOOGLE_APPLICATION_CREDENTIALS=./configs/sbs-prod-env-firebase.json
ENV ENVIRONMENT=prod
ENV PROD_GCP_CREDS_LOCATION=projects/671861674743/secrets/sbs-prod-config/versions/latest
ENV PROD_REDIS_URL_LOCATION=projects/671861674743/secrets/redis-url-prod/versions/latest
ENV PROD_DB_INFO_LOCATION=projects/671861674743/secrets/sbs-prod-config/versions/latest

COPY . /usr/local/go/src/sbs-drafts-api

WORKDIR /usr/local/go/src/sbs-drafts-api

RUN go mod download

RUN go build -o /sbs-drafts-server

COPY ./configs/sbs-prod-env-firebase.json ./configs/sbs-prod-env-firebase.json

EXPOSE 8000

CMD [ "/sbs-drafts-server" ]