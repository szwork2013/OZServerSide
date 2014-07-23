export OZ_PORT=7000
export NODE_ENV=quality
forever  start -a -o out_demo.log -e err_demo.log ozapp.js





