const { MongoClient } = require('mongodb');
require('dotenv').config();

const deleteUser = async (email) => {
  try {
    const client = await MongoClient.connect(process.env.MONGODB_URI);
    const db = client.db();
    
    const result = await db.collection('users').deleteOne({ email });
    console.log('Delete result:', result);
    
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

deleteUser('jonp4208@gmail.com'); 