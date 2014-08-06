export OZ_PORT=5000
export NODE_ENV=development
forever  start --uid "development" -a -o out_dev.log -e err_dev.log ozapp.js





