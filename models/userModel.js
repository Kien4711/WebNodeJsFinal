const mongoose=require('mongoose')
const bcrypt=require('bcrypt')
// Thiết lập schema cho người dùng
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true},
    phone: { type: String, required: true },
    address: { type: String, required: true },
    birthday: { type: Date, required: true },
    password: { type: String, required: true },
    otp: { type: String },
    // otpCreatedTime: { type: Date }
  });
// Hash password before saving to database
userSchema.pre('save', function(next) {
    const user = this;
    if (!user.isModified('password')) return next();
  
    bcrypt.genSalt(10, (err, salt) => {
      if (err) return next(err);
  
      bcrypt.hash(user.password, salt, (err, hash) => {
        if (err) return next(err);
  
        user.password = hash;
        next();
      });
    });
  });
  
  // Compare password to hashed password in database
  userSchema.methods.comparePassword = function(candidatePassword, callback) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      if (err) return callback(err);
      callback(null, isMatch);
    });
  };
// Tạo model cho người dùng
const User = mongoose.model('User', userSchema);
module.exports=User;