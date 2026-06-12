import mongoose from 'mongoose';
const uri = 'mongodb+srv://sagarchauhan89230_db_user:7zfnM4bcWAlf6R7R@cluster0.czdwon2.mongodb.net/?appName=Cluster0';
mongoose.connect(uri).then(() => {
  console.log(mongoose.connection.db.databaseName);
  process.exit(0);
}).catch(console.error);
