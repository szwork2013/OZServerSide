export OZ_PORT=7000
export NODE_ENV=production
forever  start  --uid "production" -a -o out_prod.log -e err_prod.log ozapp.js
