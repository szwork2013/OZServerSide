export OZ_PORT=7050
export NODE_ENV=prodsupport
forever  start  --uid "prodsupport" -a -o out_prodsupport.log -e err_prodsupport.log ozapp.js
