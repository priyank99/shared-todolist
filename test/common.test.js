process.env.NODE_ENV = 'test';

let User = require('../models/user');
let app = require('../app');

let mongoose = require("mongoose");
//Require the dev-dependencies
let chai = require('chai');
let expect = chai.expect;
let should = chai.should();
let chaiHttp = require('chai-http');

let request = require('supertest');


const testCredentials = {
    username: 'test0',
    password: 'coffee'
}
//now let's login the user before we run any tests
var authenticatedUser = request.agent(app);

/*
authenticatedUser
    .post('/user/register')
    .send(testCredentials)
    .end(function (err, response) {
        expect(response.statusCode).to.equal(302);
        expect('Location', '/list/all');
        //done();
    });
*/
before(function (done) {
    authenticatedUser
        .post('/user/login')
        .send(testCredentials)
        .end(function (err, response) {
            expect(response.statusCode).to.equal(302);
            expect('Location', '/list/all');
            done();
        });
});
//this test says: make a POST to the /login route with the email: sponge@bob.com, password: garyTheSnail
//after the POST has completed, make sure the status code is 200 
//also make sure that the user has been directed to the /home page

describe('GET /user/dashboard', function(done){
    //addresses 1st bullet point: if the user is logged in we should get a 200 status code
      it('should return a 200 response if the user is logged in', function(done){
        authenticatedUser.get('/user/dashboard')
        .expect(200, done);
      });
    //addresses 2nd bullet point: if the user is not logged in we should get a 302 response code and be directed to the /login page
      it('should return a 302 response and redirect to /login', function(done){
        request(app).get('/user/dashboard')
        .expect('Location', '/user/login')
        .expect(302, done);
      });
    });