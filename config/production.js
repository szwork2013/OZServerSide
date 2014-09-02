module.exports = {
    OrderZapp: {
      name: "production",
      dbName: "ozpp-prod",
      dbHost: "10.0.1.6",
      debug:false,
      SMSLongCode:"7738062873",
      gtranslatekey:"AIzaSyBd6VpfinXfXMKKlEUbU6IWsDZ9eOmB9Dc",
      amazonbucket:'orderzapp/products/production',
      merchantKey:"T5n43ZNnszBBO0v3",
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
        MID:"GiantL66431191194091",
        INDUSTRY_TYPE_ID:"Retail115",
        WEBSITE:"giantleapsystems",
        merchantKey:"T5n43ZNnszBBO0v3",
        CHANNEL_ID:"WEB"
      },
      oz_adminusermail: "sarita@giantleapsystems.com",
	}
}