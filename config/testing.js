module.exports = {
    OrderZapp: {
      name: "development",
      dbName: "ozpp-test",
      dbHost: "localhost",
      dbPort: "27017",
      SMSLongCode:"9243007462",
      gtranslatekey:"AIzaSyBd6VpfinXfXMKKlEUbU6IWsDZ9eOmB9Dc",
      debug:true,
      merchantKey:"kzAVMuQG8xKIiaVl",
      amazonbucket:'orderzapp/products/test',
      smtp_general:{
        host: "smtp.giantleapsystems.com", // hostname
        secureConnection: true, // use SSL
        port: 465, // port for secure SMTP
        auth:{
          user: "orderzapp@giantleapsystems.com",
          pass: "Orderzapp123"
        }
      },
      paytm:{
        connectionurl:"/api/orderzapp/payment",
        checksumurl:"/api/paytm/generatechecksum",
        MID:"Giantl00830321943927",
        INDUSTRY_TYPE_ID:"Retail",
        WEBSITE:"giantleapsystems",
        merchantKey:"kzAVMuQG8xKIiaVl",
        CHANNEL_ID:"WAP"
      }
    }
  }