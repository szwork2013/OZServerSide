export OZ_PORT=9000
export NODE_ENV=prodsupporttest
forever  start  --uid "prodsupporttest" -a -o out_prodsuppottest.log -e err_prodsupporttest.log ozapp.js
