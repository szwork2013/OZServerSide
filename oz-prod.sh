export OZ_PORT=7000
export NODE_ENV=production
forever  start -a -o out.log -e err.log ozapp.js