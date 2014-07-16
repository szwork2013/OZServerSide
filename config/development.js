module.exports = {
    OrderZapp: {
      name: "development",
      dbName: "ozpp-dev",
      dbHost: "localhost",
      dbPort: "27017",
      SMSLongCode:"9243007462",
      gtranslatekey:"AIzaSyBd6VpfinXfXMKKlEUbU6IWsDZ9eOmB9Dc",
      debug:true,
      merchantKey:"kzAVMuQG8xKIiaVl",
      amazonbucket:'orderzapp/products/dev',
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