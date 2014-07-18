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
      smtp_general:{
        host: "smtp.giantleapsystems.com", // hostname
        secureConnection: true, // use SSL
        port: 465, // port for secure SMTP
        auth:{
          user: "orderzapp@giantleapsystems.com",
          pass: "Orderzapp123"
        }
      }
	}
}