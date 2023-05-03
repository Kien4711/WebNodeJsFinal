const mongoose = require('mongoose')
const mongodb = 'mongodb://localhost:27017/nodejsFinal'
const mongodb_tmp = 'mongodb+srv://trungkien:Kien4711@cluster0.jnp9bdx.mongodb.net/test'

mongoose.connect(mongodb_tmp, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error(err));

const db = mongoose.connection
db.on("error", console.error.bind(console, "MongoDB connection error:"));
module.export=db;