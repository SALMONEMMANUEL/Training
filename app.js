const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const utilPath = require('./util/path');
const app = express();
const mongoose = require('mongoose');
const staffRouter = require('./routes/staff');
const bcrypt = require('bcryptjs');
const User = require('./models/users');
const flash = require('connect-flash');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');
const csurf = require('csurf');
const Admin = require('./models/auth');
const errorController = require('./controllers/error');
const MongoDB_URI = 'mongodb://127.0.0.1:27017/lams';
// const MongoDB_URI = 'mongodb://localhost:27017/lams';
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const multer = require('multer');
const store = new MongoDBStore({
  uri: MongoDB_URI,
  collection: 'sessions'
});
const csrfProtection = csurf();
const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'documents');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  }
})
const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'document/png' || file.mimetype === 'document/jpg' || file.mimetype === 'document/jpe' || file.mimetype === 'document/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(multer({
  storage: fileStorage

}).single('document'));
app.use(express.static(path.join(utilPath, 'public')));

app.use('/documents', express.static(path.join(__dirname, 'documents')));
app.use(session({
  secret: 'my secret',
  resave: false,
  saveUninitialized: false,
  store: store
}))
app.use(csrfProtection);
app.use(flash());
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrf = req.csrfToken()
  next();
})

app.use((req, _res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findOne({
      _id: req.session.user._id
    })
    .then(user => {
      if (!user) {
        return next()
      }
      req.user = user;
      next();
    })
})
//for admin
app.use((req, _res, next) => {
  if (!req.session.admin) {
    return next();
  }
  Admin.findOne({
      _id: req.session.admin._id
    })
    .then(admin => {
      if (!admin) {
        return next()
      }
      req.admin = admin;
      next();
    })
})

//MIDDLEWARE FOR ROUTER
app.use(authRouter);
app.use(staffRouter);
app.use('/admin', adminRouter);
// app.use((error, req, res, next) => { 
//     res.status(500).render('500', {
//         pagetitle: 'Service Unavailable',
//         path: '/500'
//     });
// })

app.use(errorController.get404);


mongoose.connect(MongoDB_URI,{useNewUrlParser:true,useUnifiedTopology:true},
  (err)=>{
    if(err){
      console.log('no connection')
    }
    else{
      console.log('there is connection')
    }
  })
  // .then(() => {
  //   return Admin.findOne({
  //     email: 'georgelasu@edu.ng'
 
  //   })

  //   .then(user => {
  //     if (!user) {
  //       return bcrypt.hash('password', 12)
  //         .then(hashedPassword => {
  //           const admin = Admin({
  //             email: 'georgelasu@edu.ng',
  //             password:hashedPassword
              
               
  //           });

  //           return admin.save();
  //         })
  //         .catch(err => {
  //           console.log('Error occured 1')
  //         })
  //     }else {
  //       return user;
  //     }
  //   })
  //   .catch(err => {
  //     console.log('Error occured 2')
  //   })
    
  // })
  .then(conn => {
    app.listen(4000);
    console.log('Connected');
  })
  .catch(err => {
    console.log(err);
  })