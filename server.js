// =====================================
// INDIA CART - FULL STACK (ADVANCED)
// =====================================

// INSTALL
// npm init -y
// npm install express mongoose cors body-parser jsonwebtoken bcryptjs razorpay

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ================= DATABASE =================
mongoose.connect('mongodb://127.0.0.1:27017/indiacart');

// ================= MODELS =================
const User = mongoose.model('User', {
  username: String,
  password: String,
  isAdmin: { type: Boolean, default: false }
});

const Product = mongoose.model('Product', {
  name: String,
  price: Number,
  image: String
});

const Order = mongoose.model('Order', {
  userId: String,
  items: Array,
  total: Number,
  paymentId: String
});

// ================= RAZORPAY =================
const razorpay = new Razorpay({
  key_id: 'YOUR_KEY_ID',
  key_secret: 'YOUR_SECRET_KEY'
});

app.post('/create-order', async (req, res) => {
  const options = {
    amount: req.body.amount * 100,
    currency: 'INR'
  };
  const order = await razorpay.orders.create(options);
  res.json(order);
});

// ================= AUTH =================
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hash });
  await user.save();
  res.send('User Created');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.send('User not found');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.send('Wrong password');

  const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, 'secret');
  res.json({ token });
});

// ================= ADMIN MIDDLEWARE =================
function adminAuth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.send('No token');

  const decoded = jwt.verify(token, 'secret');
  if (!decoded.isAdmin) return res.send('Not admin');

  next();
}

// ================= PRODUCTS =================
app.get('/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/products', adminAuth, async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.send('Product Added');
});

app.delete('/products/:id', adminAuth, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.send('Deleted');
});

// ================= ORDERS =================
app.post('/orders', async (req, res) => {
  const order = new Order(req.body);
  await order.save();
  res.send('Order Saved');
});

app.get('/orders', adminAuth, async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

// ================= SERVER =================
app.listen(5000, () => console.log('Server running on port 5000'));

// =====================================
// FRONTEND PAYMENT INTEGRATION
// =====================================


 //Add this in your HTML JS:

function payNow(total){
 fetch('http://localhost:5000/create-order',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body: JSON.stringify({amount: total})
 })
 .then(res=>res.json())
 .then(order=>{
   const options = {
     key: 'YOUR_KEY_ID',
     amount: order.amount,
     currency: 'INR',
     order_id: order.id,
     handler: function (response){
       alert('Payment Successful');
     }
   };
   const rzp = new Razorpay(options);
   rzp.open();
 });
}



// =====================================
// ADMIN PANEL IDEA (FRONTEND)
// =====================================


// Create a simple form:

//<input id="name">
//<input id="price">
//<input id="image">
<button onclick="addProduct()">Add</button>

function addProduct(){
 fetch('http://localhost:5000/products',{
  method:'POST',
  headers:{
    'Content-Type':'application/json',
    'authorization': localStorage.getItem('token')
  },
  body: JSON.stringify({
    name: name.value,
    price: price.value,
    image: image.value
  })
 });
}

 //=====================================
 //NOW YOUR WEBSITE HAS:
// =====================================
/*✔ Real Payment (Razorpay)
✔ Orders stored in DB
✔ Admin panel API
✔ Secure login (JWT)*/

// NEXT: Deployment (Render / Vercel)
