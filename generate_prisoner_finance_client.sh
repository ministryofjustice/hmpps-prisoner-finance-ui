openapi-generator generate \
  -i OpenApiSpecs/general-ledger.json \
  -g typescript-node \
  -o ./server/api-clients/prisoner-finance-api \
  --additional-properties=supportsES6=false,npmVersion=$(npm --version),modelPropertyNaming=camelCase,paramNaming=camelCase
