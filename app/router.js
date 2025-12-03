const express     = require('express');
const authRouter  = require('./routes/auth');
const meRouter    = require('./routes/me');
const adminRouter = require('./routes/admin');
// const appRouter = require('./routes/route');

module.exports = (app) => {

    app.use('/api/v1/auth',  authRouter);
    app.use('/api/v1/me',    meRouter);
    app.use('/api/v1/admin', adminRouter);
    // app.use('/api/v1/', appRouter);
    
    app.use((req, res) => {
        res.status(404).json({ "message": "Маршрут не существует", "errCode": 404 })
    })

};