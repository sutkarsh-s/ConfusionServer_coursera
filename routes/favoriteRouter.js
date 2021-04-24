const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Favorites = require('../models/favorites');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({})
        .populate('user')
        .populate('dishes')
        .then((favorites) => {
            // extract favorites that match the req.user.id
            if (favorites) {
                user_favorites = favorites.filter(fav => fav.user._id.toString() === req.user.id.toString())[0];
                if(!user_favorites) {
                    var err = new Error('You have no favorites!');
                    err.status = 404;
                    return next(err);
                }
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(user_favorites);
            } else {
                var err = new Error('There are no favorites');
                err.status = 404;
                return next(err);
            }

        }, (err) => next(err))
        .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser,
    (req, res, next) => {
        Favorites.find({})
            .then((favorites) => {
                var userf;
                if(favorites)
                    userf = favorites.filter(fav => fav.user._id.toString() === req.user.id.toString())[0];
                    if(!userf)  {
                        newEntry = {'user': req.user.id, 'dishes': req.body};
                        userf = Favorites.create(newEntry);
                    }
                    else { //update
                        for (var i = (req.body.length -1); i >= 0; i--) {
                            if (userf.dishes.indexOf(req.body[i]._id)===-1)
                        
                            { //not there yet; add; note: toLowerCase in order to avoid duplicates
                                userf.dishes = userf.dishes.concat(req.body[i]._id);
                                console.log('added entry: ', req.body[i]._id);
                            } else {
                                console.log('ignored an attempt to create a duplicate entry: ', req.body[i]._id);
                            }
                          }
                }
                userf.save()
                    .then((userf) => {
                        Favorites.findById(userf._id)
                        .populate('user')
                        .populate('dishes')
                        .then((userf) => {
                        res.statusCode = 201;
                        res.setHeader("Content-Type", "application/json");
                        res.json(userf);
                        console.log("favorites Created");
                    }, (err) => next(err));
                }, (err) => next(err))
            .catch((err) => next(err));
})
})

.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favorites/'+ req.params.dishId);
})

.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOneAndRemove({user: req.user._id})
    .then((resp)=>{
        res.status = 200;
        res.setHeader('Content-Type','application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('GET operation is not supported on /favorites/'+ req.params.dishId);
})
.post(cors.corsWithOptions, authenticate.verifyUser,
    (req, res, next) => {
        Favorites.find({})
            .populate('user')
            .then((favorites) => {
                var userf;
                if(favorites)
                    userf = favorites.filter(fav => fav.user._id.toString() === req.user.id.toString())[0];
                if(!userf)  {
                    newEntry = {'user': req.user.id, 'dishes': req.params.dishId};
                    userf = Favorites.create(newEntry);
                }
                else { //update
                        if (userf.dishes.indexOf(req.params.dishId)===-1){
                            userf.dishes = userf.dishes.concat(req.params.dishId);
                            console.log('added entry: ', req.params.dishId);
                        } else {
                            console.log('ignored an attempt to create a duplicate entry: ', req.params.dishId);
                        }
                      }
                userf.save()
                    .then((userf) => {
                        Favorites.findById(userf._id)
                        .populate('user')
                        .populate('dishes')
                        .then((userf) => {
                        res.statusCode = 201;
                        res.setHeader("Content-Type", "application/json");
                        res.json(userf);
                        console.log("favorites Created");
                    }, (err) => next(err));
                }, (err) => next(err))
            .catch((err) => next(err));
})
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation is not supported on /favorites/'+ req.params.dishId);
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({'user':req.user._id})
    .then((favs) => {
        if (favs == null || favs.dishes == null || favs.dishes.indexOf(req.params.dishId) === -1) {
            err = new Error('Dish ' + req.params.dishId + ' not found in favorites.');
            err.status = 404;
            return next(err);
        } else {
            favs.dishes.splice(favs.dishes.indexOf(req.params.dishId),1);
            favs.save()
            .then((favs) => {
                Favorites.findById(favs._id)
                .then((favs) => {
                    res.status = 200;
                    res.setHeader('Content-Type','application/json');
                    res.json(favs);
                }, (err) => next(err));

            }, (err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});


module.exports = favoriteRouter;