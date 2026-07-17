const mongoose = require("mongoose");
mongoose.connect("mongodb://kashifhbox_db_user:GOa52R9GUMaN0ZaU@ac-6nwu1ck-shard-00-00.youqr5l.mongodb.net:27017,ac-6nwu1ck-shard-00-01.youqr5l.mongodb.net:27017,ac-6nwu1ck-shard-00-02.youqr5l.mongodb.net:27017/lead_generation?ssl=true&replicaSet=atlas-ohv5oo-shard-0&authSource=admin&retryWrites=true&w=majority")
  .then(async () => {
    const lead = await mongoose.connection.collection("leads").findOne({ firstPersonalEmail: { $regex: "pallavisingh1952" }});
    console.log(lead);
    process.exit(0);
  });
