/*
* Overview: The schema model for User.
* Dated:
* Author:
* Copyright: GiantLeap Systems private limited 2014
* Changes:
* ----------------------------------------------------------------------
* date | author | description 
* ----------------------------------------------------------------------
* 27-3/2013 | xyx | Add a new property
* 
*/
var mongoose = require('../../common/js/db');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;
var generateId = require('time-uuid');
var someDate = new Date();
var numberOfDaysToAdd = 30;
someDate.setDate(someDate.getDate() + numberOfDaysToAdd); 



var userSchema = mongoose.Schema(
{
    userid: { type: String, unique: true },
    email:{type:String,required:true},
    mobileno:{type:String,required:true,unique:true},
    // hhusertype:{type:String},
    username:{type:String},
    firstname: { type: String},
    password:{type:String},
    // registration_id:{type:String},
    lastname: { type:String },
    dob:{type:Date},
    usertype:{type:String},//consumer or provider
    gender:{type:String},
    user_avatar: { type:String },
    phonetype:{type:String},//phonetype means feature,smart
    location: {
      address1:{type:String},
      address2:{type:String},
      address3:{type:String},
      area:{type:String},
      geo:{ latitude:String, longitude:String },
      city: {type:String },
      district: { type:String },
      state:{ type:String},
      country: { type:String},
      zipcode: {type:String}
    },
    status:{type:String,default:"active"},
    preffered_lang:{type:String,default:"EN"},
    provider:[{//user belongs to many provider
        providerid:{type:String},
        branchid:{type:String},
        isOwner:{type:Boolean},
        confirmed:{type:Boolean}
    }],
    favprovider:[//my fav service provider
        {
         providerid:{type:String,ref:"ProductProvider"},//trade professional id
         categoryid:{type:String,ref:"productcategory"}
        }
    ],
    favproducts:[//my fav products
        {
         productid:{type:String},
         providerid:{type:String}
        }
    ],
    products_recommends:[{productid:{type:String,ref:"productcatalog"},providerid:{type:String,ref:"productprovider"},branchid:{type:String,ref:"productprovider"}}], //list of productids
    verified:{type:Boolean,default:false},
    createdate:{type:Date,default:new Date()},
    payment:{
        paymentid:{type:String,default:"pay"+generateId()},
        payment_type:{type:String,default:"cash"},//scratch code,in case in future online or any
        payment_date:{type:Date,default:new Date()},
        subscription_plan:{
            plan_type:{type:String,default:"trial"},
            amount:Number,
            currency:{type:String,default:"INR"}
        },
       //type :monthly,quarterly,yearly 
        subscription_expiry_date:{type:Date,default:someDate},
        voucher_code:{type:String},
        subscription_status:{type:String,default:"active"}//active,expired
        },
        gcmregistrationid:{type:String},//google cloud message device registration id
        isAdmin:{type:Boolean,default:false},
       // secretkey:{type:String},
       appentrytype:{type:String},
       entrytype:{type:String}//by walkin or registering only applicable for service
});

userSchema.pre('save', function(next) {
    var user = this;
    user.userid=generateId();
    console.log("test121")
    // console.log("userdata in pre"+user);
    if(!user.isModified('password')){
        next();
    } else{
        bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
            if(err) {
                return next(err);
            }
            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err) {
                    return next(err);
                }
                user.password = hash;
                next();
            });
         });
    }
});
userSchema.methods.comparePassword = function(candidatePassword, callback) {
  console.log("test"+this.password)
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if(err){ 
      // console.log("test"+err);
      callback(err);
    }else{
      console.log("isMatch"+isMatch);
      callback(null, isMatch);
    }
     
  });
};
userSchema.statics.findAndModify = function (query, sort, doc, options, callback) {
    return this.collection.findAndModify(query, sort, doc, options, callback);
};
var User = mongoose.model('users', userSchema);

//export the model schema
module.exports = User;
