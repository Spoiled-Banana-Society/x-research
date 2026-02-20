FROM golang:1.20-alpine

ENV GOOGLE_APPLICATION_CREDENTIALS=./configs/sbs-prod-env-firebase.json
ENV ENVIRONMENT=prod
ENV PROD_GCP_CREDS_LOCATION=projects/671861674743/secrets/sbs-prod-config/versions/latest
ENV PROD_DRAFT_SERVER_BASE_URL=https://sbs-drafts-server-w5wydprnbq-uc.a.run.app
ENV PROD_RT_DB_URL=https://sbs-prod-env-default-rtdb.firebaseio.com

COPY . /usr/local/go/src/sbs-drafts-api

WORKDIR /usr/local/go/src/sbs-drafts-api

RUN go mod download

RUN go build -o /sbs-drafts-api

COPY ./configs/sbs-prod-env-firebase.json ./configs/sbs-prod-env-firebase.json

EXPOSE 8080

CMD [ "/sbs-drafts-api" ]