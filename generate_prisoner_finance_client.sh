openapi-generator generate \
  -i OpenApiSpecs/general-ledger.json \
  -g typescript-fetch \
  -o ./server/api-clients/prisoner-finance-api \
  --additional-properties=supportsES6=true,npmVersion=$(npm --version),modelPropertyNaming=camelCase,paramNaming=camelCase


# grep -rl '\.bearer-jwt' server/api-clients | xargs sed -i '' "s/\.bearer-jwt/\['bearer-jwt'\]/g"