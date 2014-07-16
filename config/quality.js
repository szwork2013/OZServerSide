module.exports = {
    OrderZapp: {
      name:"quality",
      dbName: "ozdemo",
      dbHost: "localhost",
      dbPort: "27017",
      debug:true,
      SMSLongCode:"9243007462",
      gtranslatekey:"AIzaSyBd6VpfinXfXMKKlEUbU6IWsDZ9eOmB9Dc",
      amazonbucket:'orderzapp/products/quality',
      merchantKey:"kzAVMuQG8xKIiaVl",
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