export OZ_PORT=8050
export NODE_ENV=testing
forever  start -a -o out_test.log -e err_test.log ozapp.js





