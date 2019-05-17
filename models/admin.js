var mongoose = require('mongoose');

var adminschema = new mongoose.Schema({
  username : String,
  password : String,
  adminname : String,
  dob : Date,
  emailID : String,
  mobNo : String,
  address : String,
  accessLevel : { type: Number, min:1, max:3, default: 1},
  assignedTo : String, //Hostel Name
  resetPasswordToken :  {type : String, default :undefined },
  resetPasswordExpires : {type : String, default : undefined}
});

adminschema.index({
  username : 1
}, {
  unique : true
});

var Admin = mongoose.model("Admin", adminschema);

module.exports=Admin;
