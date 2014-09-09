module.exports = {
    OrderZapp: {
      name:"quality",
      dbName: "ozpp-demo",
      dbHost: "localhost",
      dbPort: "27017",
      debug:true,
      SMSLongCode:"9243007462",
      gtranslatekey:"AIzaSyBd6VpfinXfXMKKlEUbU6IWsDZ9eOmB9Dc",
      amazonbucket:'orderzapp/products/quality',
      merchantKey:"kzAVMuQG8xKIiaVl",

      gcmapikey:"AIzaSyA1qTwcg7N1OV4HRwecUdqtyZKdC8SPrDM",

      amazon:{accessKeyId:'AKIAIA4VS3PT4IPKADWQ', secretAccessKey:'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'},
      smtp_general:{
        host: "smtp.giantleapsystems.com", // hostname
        secureConnection: true, // use SSL
        port: 465, // port for secure SMTP
        auth:{
          user: "orderzapp@giantleapsystems.com",
          pass: "Orderzapp123"
        }
      },
          paytmconfigaccesskey:"12345",
      paytm:{
        connectionurl:"/api/orderzapp/payment",
        checksumurl:"/api/paytm/generatechecksum",
        MID:"Giantl00830321943927",
        INDUSTRY_TYPE_ID:"Retail",
        WEBSITE:"giantleapsystems",
        merchantKey:"kzAVMuQG8xKIiaVl",
        CHANNEL_ID:"WAP"
      },
      oz_adminusermail: "dinesh@giantleapsystems.com",
    }
  }