export OZ_PORT=7051
export NODE_ENV=prodsupporttest
forever  start  --uid "prodsupporttest" -a -o out_prodsuppottest.log -e err_prodsupporttest.log ozapp.js
